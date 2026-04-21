from __future__ import annotations

from datetime import datetime
from typing import Annotated
import json
import re
import time
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from fastapi import APIRouter, Depends, Query
from psycopg import Connection
from psycopg.types.json import Json

from app.auth.router import get_current_user, get_conn
from app.auth.schemas import UserResponse
from app.investing.schemas import (
    InvestingActivitiesResponse,
    InvestingActivitiesUpdateRequest,
    InvestingActivityYearSummary,
    InvestingCapitalEntriesResponse,
    InvestingCapitalEntriesUpdateRequest,
    InvestingCapitalEntry,
    InvestingHoldingsResponse,
    InvestingHoldingsUpdateRequest,
    InvestingMetricsResponse,
    InvestingMetricsUpdateRequest,
    InvestingQuotesResponse,
    InvestingNotesResponse,
    InvestingNotesUpdateRequest,
    InvestingPickingResponse,
    InvestingPickingRow,
    InvestingPickingUpdateRequest,
)


router = APIRouter(prefix="/investing", tags=["investing"])
_PRICE_CACHE_TTL_SECONDS = 120
_FUNDAMENTALS_CACHE_TTL_SECONDS = 60 * 60
_price_cache: dict[str, tuple[float, float]] = {}
_fundamentals_cache: dict[str, tuple[float | None, float | None, float]] = {}
_fx_cache: dict[str, tuple[float, float]] = {}
DEFAULT_INVESTING_NOTES = """* Distribution of money ~ 15% of shares
* Main goal - general money to ETFs
* Operating expenses are no more than 3,5%
* Minimum target - 6% per year

When to buy stocks?
- During earnings season, look for a company that is undervalued and buy
- Sell bonds, spend cash

When there is nothing to buy:
- Buy value ETFs, bonds, collect cash

Important:
* 20% of obligations - after 100k in portfolio
* After 100k portfolio, increase ETF from 40% to 50% (15/15/15/5)
"""


def _parse_num(value: str) -> float:
    raw = str(value).strip().replace(" ", "")
    if "," in raw and "." not in raw:
        # Common EU format: 1090,66 -> 1090.66
        raw = raw.replace(",", ".")
    elif "," in raw and "." in raw:
        # Assume commas are thousands separators: 1,090.66 -> 1090.66
        raw = raw.replace(",", "")
    cleaned = "".join(ch for ch in raw if ch.isdigit() or ch in ".-")
    try:
        return float(cleaned) if cleaned else 0.0
    except Exception:
        return 0.0


def _fmt_pct(value: float) -> str:
    return f"{value:.2f}%"


def _parse_date(value: str) -> datetime:
    raw = str(value).strip()
    for fmt in ("%d.%m.%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(raw, fmt)
        except Exception:
            pass
    return datetime.min


def _enrich_entries(entries: list[dict]) -> list[InvestingCapitalEntry]:
    enriched: list[InvestingCapitalEntry] = []
    sorted_entries = sorted(entries, key=lambda e: _parse_date(str(e.get("date", ""))))
    prev_total = 0.0
    for raw in sorted_entries:
        deposit = _parse_num(str(raw.get("deposit", "0")))
        total_value = _parse_num(str(raw.get("total_value", "0")))

        # "%" column: how total value changed between start/end of year.
        # (start ~ previous row total, end ~ current row total).
        roi = ((total_value - prev_total) / prev_total * 100.0) if prev_total > 0 else 0.0

        # "1Y" column: portfolio performance for the year accounting for top-ups.
        # First row uses only current deposit as base.
        # Next rows use previous total + current deposit.
        base = deposit if prev_total <= 0 else (prev_total + deposit)
        one_year = ((total_value - base) / base * 100.0) if base > 0 else 0.0

        prev_total = total_value
        enriched.append(
            InvestingCapitalEntry(
                id=str(raw.get("id", "")),
                date=str(raw.get("date", "")),
                deposit=str(raw.get("deposit", "")),
                total_value=str(raw.get("total_value", "")),
                roi_percent=_fmt_pct(roi),
                one_year_percent=_fmt_pct(one_year),
            )
        )
    return enriched


def _date_to_iso(value: str) -> str:
    dt = _parse_date(value)
    if dt != datetime.min:
        return dt.strftime("%Y-%m-%d")
    return datetime.utcnow().strftime("%Y-%m-%d")


def _fetch_fx_rate_to_usd(currency: str, trade_date: str) -> float | None:
    cur = str(currency or "").strip().upper()
    if not cur:
        return None
    if cur == "USD":
        return 1.0

    iso_date = _date_to_iso(trade_date)
    cache_key = f"{cur}:{iso_date}"
    now = time.time()
    cached = _fx_cache.get(cache_key)
    if cached and now - cached[1] < 60 * 60 * 6:
        return cached[0]

    urls = [
        f"https://api.frankfurter.app/{iso_date}?from={quote(cur)}&to=USD",
        f"https://api.frankfurter.app/latest?from={quote(cur)}&to=USD",
    ]
    for url in urls:
        req = Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
        try:
            with urlopen(req, timeout=6) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
            continue
        rates = payload.get("rates", {})
        rate = rates.get("USD")
        if isinstance(rate, (int, float)) and float(rate) > 0:
            value = float(rate)
            _fx_cache[cache_key] = (value, now)
            return value
    return None


def _enrich_activities_with_usd(rows: list[dict]) -> list[dict]:
    enriched: list[dict] = []
    for row in rows:
        raw_type = str(row.get("type", "")).strip().lower()
        kind = "sell" if raw_type in {"sell", "sale", "sold"} else "buy"
        count = int(_parse_num(str(row.get("count", "0"))))
        legacy_buy_price = str(row.get("buyPrice", "0"))
        legacy_sell_price = str(row.get("sellPrice", "0"))
        price_value = _parse_num(str(row.get("price", "")))
        if price_value <= 0:
            fallback_price = legacy_sell_price if kind == "sell" else legacy_buy_price
            price_value = _parse_num(fallback_price)

        amount_value = _parse_num(str(row.get("amount", "")))
        amount = amount_value if amount_value > 0 else (count * price_value)

        gains_value = _parse_num(str(row.get("gains_losses", "")))
        if gains_value == 0:
            gains_value = _parse_num(str(row.get("result", "0")))
        gains_losses = gains_value
        commission = _parse_num(str(row.get("commission", "0")))
        currency = str(row.get("currency", "USD")).strip().upper() or "USD"
        trade_date = str(row.get("date", "")).strip()
        fx = _fetch_fx_rate_to_usd(currency, trade_date) or (1.0 if currency == "USD" else 0.0)
        amount_usd = amount * fx
        gains_losses_usd = gains_losses * fx
        commission_usd = commission * fx
        enriched.append(
            {
                **row,
                "type": kind,
                "count": count,
                "price": f"{price_value:.6f}".rstrip("0").rstrip(".") if price_value else "0",
                "amount": f"{amount:.6f}".rstrip("0").rstrip(".") if amount else "0",
                "gains_losses": f"{gains_losses:.6f}".rstrip("0").rstrip(".") if gains_losses else "0",
                "currency": currency,
                "amount_usd": f"{amount_usd:.2f}",
                "gains_losses_usd": f"{gains_losses_usd:.2f}",
                "commission_usd": f"{commission_usd:.2f}",
                "fx_rate_to_usd": f"{fx:.6f}",
            }
        )
    return enriched


def _calc_activity_yearly_summary(rows: list[dict]) -> list[InvestingActivityYearSummary]:
    by_year: dict[str, dict[str, float]] = {}
    for row in rows:
        date = str(row.get("date", "")).strip()
        dt = _parse_date(date)
        year = str(dt.year) if dt != datetime.min else (date[-4:] if len(date) >= 4 else "Unknown")
        if year not in by_year:
            by_year[year] = {
                "purchases_amount": 0.0,
                "purchases_commission": 0.0,
                "sales_amount": 0.0,
                "sales_pnl": 0.0,
                "sales_commission": 0.0,
            }
        amount = _parse_num(str(row.get("amount_usd", row.get("amount", "0"))))
        gains_losses = _parse_num(str(row.get("gains_losses_usd", row.get("gains_losses", "0"))))
        commission = _parse_num(str(row.get("commission_usd", row.get("commission", "0"))))
        kind = str(row.get("type", "")).strip().lower()
        if kind == "sell":
            by_year[year]["sales_amount"] += amount
            by_year[year]["sales_pnl"] += gains_losses
            by_year[year]["sales_commission"] += commission
        else:
            by_year[year]["purchases_amount"] += amount
            by_year[year]["purchases_commission"] += commission

    summary: list[InvestingActivityYearSummary] = []
    for year in sorted(by_year.keys()):
        agg = by_year[year]
        net = (
            agg["sales_amount"]
            - agg["purchases_amount"]
            - agg["sales_commission"]
            - agg["purchases_commission"]
            + agg["sales_pnl"]
        )
        summary.append(
            InvestingActivityYearSummary(
                year=year,
                purchases_amount=f"{agg['purchases_amount']:.2f}",
                purchases_commission=f"{agg['purchases_commission']:.2f}",
                sales_amount=f"{agg['sales_amount']:.2f}",
                sales_pnl=f"{agg['sales_pnl']:.2f}",
                sales_commission=f"{agg['sales_commission']:.2f}",
                net_cash_flow=f"{net:.2f}",
            )
        )
    return summary


def _fetch_yahoo_prices(tickers: list[str]) -> dict[str, float]:
    if not tickers:
        return {}
    symbols = ",".join(tickers)
    url = f"https://query1.finance.yahoo.com/v7/finance/quote?symbols={quote(symbols)}"
    try:
        with urlopen(url, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        return {}
    result = payload.get("quoteResponse", {}).get("result", [])
    prices: dict[str, float] = {}
    for item in result:
        symbol = str(item.get("symbol", "")).upper().strip()
        price = item.get("regularMarketPrice")
        if symbol and isinstance(price, (int, float)):
            prices[symbol] = float(price)
    return prices


def _fetch_stooq_price(ticker: str) -> float | None:
    symbol = ticker.lower().strip()
    if not symbol:
        return None
    url = f"https://stooq.com/q/l/?s={quote(symbol)}.us&i=d"
    req = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "text/csv,text/plain,*/*",
        },
    )
    try:
        with urlopen(req, timeout=6) as response:
            raw = response.read().decode("utf-8", "ignore").strip()
    except (HTTPError, URLError, TimeoutError):
        return None
    if not raw:
        return None
    first = raw.splitlines()[0]
    parts = [p.strip() for p in first.split(",")]
    # Expected format: SYMBOL,DATE,TIME,OPEN,HIGH,LOW,CLOSE,VOLUME
    if len(parts) < 7:
        return None
    close = _parse_num(parts[6])
    return close if close > 0 else None


def _fetch_market_prices(tickers: list[str]) -> dict[str, float]:
    now = time.time()
    result: dict[str, float] = {}
    missing: list[str] = []
    for ticker in tickers:
        cached = _price_cache.get(ticker)
        if cached and now - cached[1] < _PRICE_CACHE_TTL_SECONDS:
            result[ticker] = cached[0]
        else:
            missing.append(ticker)

    if missing:
        yahoo_prices = _fetch_yahoo_prices(missing)
        for ticker in missing:
            price = yahoo_prices.get(ticker)
            if isinstance(price, (int, float)) and float(price) > 0:
                value = float(price)
                result[ticker] = value
                _price_cache[ticker] = (value, now)
                continue
            stooq_price = _fetch_stooq_price(ticker)
            if isinstance(stooq_price, (int, float)) and float(stooq_price) > 0:
                value = float(stooq_price)
                result[ticker] = value
                _price_cache[ticker] = (value, now)
    return result


def _fetch_yahoo_quote_rows(tickers: list[str]) -> dict[str, dict]:
    if not tickers:
        return {}
    symbols = ",".join(tickers)
    url = f"https://query1.finance.yahoo.com/v7/finance/quote?symbols={quote(symbols)}"
    try:
        with urlopen(url, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        return {}
    result = payload.get("quoteResponse", {}).get("result", [])
    rows: dict[str, dict] = {}
    for item in result:
        symbol = str(item.get("symbol", "")).upper().strip()
        if symbol:
            rows[symbol] = item
    return rows


def _fetch_finviz_fundamentals(ticker: str) -> tuple[float | None, float | None]:
    now = time.time()
    cached = _fundamentals_cache.get(ticker)
    if cached and now - cached[2] < _FUNDAMENTALS_CACHE_TTL_SECONDS:
        return cached[0], cached[1]

    url = f"https://finviz.com/quote.ashx?t={quote(ticker)}&p=d"
    req = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "text/html,application/xhtml+xml,*/*",
        },
    )
    try:
        with urlopen(req, timeout=7) as response:
            html = response.read().decode("utf-8", "ignore")
    except (HTTPError, URLError, TimeoutError):
        _fundamentals_cache[ticker] = (None, None, now)
        return None, None

    beta_match = re.search(r'data-boxover-html="Beta".*?<b>([^<]+)</b>', html, re.S)
    beta_text = beta_match.group(1).strip() if beta_match else ""
    beta = _parse_num(beta_text) if beta_text and beta_text != "-" else None
    if isinstance(beta, float) and beta <= 0:
        beta = None

    div_match = re.search(
        r'data-boxover-html="Trailing 12 Months Dividend".*?<b>[^<]*\(([-+]?\d+(?:\.\d+)?)%\)</b>',
        html,
        re.S,
    )
    div_percent = _parse_num(div_match.group(1)) if div_match else None
    div_yield = (div_percent / 100.0) if isinstance(div_percent, float) and div_percent > 0 else None

    _fundamentals_cache[ticker] = (div_yield, beta, now)
    return div_yield, beta


def _calc_metrics_from_holdings(holdings: list[dict]) -> tuple[str, str, dict[str, str]]:
    tickers: list[str] = []
    shares_by_ticker: dict[str, float] = {}
    for row in holdings:
        ticker = str(row.get("ticker", "")).strip().upper()
        if not ticker:
            continue
        shares = _parse_num(str(row.get("shares", "0")))
        shares_by_ticker[ticker] = shares_by_ticker.get(ticker, 0.0) + max(0.0, shares)
        tickers.append(ticker)
    unique_tickers = list(dict.fromkeys(tickers))[:50]
    if not unique_tickers:
        return "—", "—", {}

    prices = _fetch_market_prices(unique_tickers)
    values_by_ticker: dict[str, float] = {}
    total_value = 0.0
    for ticker in unique_tickers:
        price = prices.get(ticker)
        if not isinstance(price, (int, float)):
            continue
        value = float(price) * shares_by_ticker.get(ticker, 0.0)
        if value <= 0:
            continue
        values_by_ticker[ticker] = value
        total_value += value

    if total_value <= 0:
        return "—", "—", {}

    weighted_div_yield = 0.0
    weighted_beta = 0.0
    div_weight_total = 0.0
    beta_weight_total = 0.0
    allocation_percent: dict[str, str] = {}

    for ticker, value in values_by_ticker.items():
        weight = value / total_value
        allocation_percent[ticker] = f"{(weight * 100.0):.2f}%"

        div_yield, beta = _fetch_finviz_fundamentals(ticker)
        if isinstance(div_yield, (int, float)):
            weighted_div_yield += weight * float(div_yield)
            div_weight_total += weight

        if isinstance(beta, (int, float)):
            weighted_beta += weight * float(beta)
            beta_weight_total += weight

    div_yield_percent = f"{(weighted_div_yield * 100.0):.2f}%" if div_weight_total > 0 else "—"
    beta_value = f"{weighted_beta:.2f}" if beta_weight_total > 0 else "—"
    return div_yield_percent, beta_value, allocation_percent


@router.get("/quotes", response_model=InvestingQuotesResponse)
def get_quotes(
    tickers: Annotated[str, Query(description="Comma-separated tickers, e.g. AAPL,MSFT")] = "",
    user: Annotated[UserResponse, Depends(get_current_user)] = None,
):
    _ = user.id
    parsed = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    unique_tickers = list(dict.fromkeys(parsed))[:50]
    if not unique_tickers:
        return InvestingQuotesResponse(prices={}, as_of=datetime.utcnow().isoformat())
    prices = _fetch_yahoo_prices(unique_tickers)
    return InvestingQuotesResponse(prices=prices, as_of=datetime.utcnow().isoformat())


@router.get("/metrics", response_model=InvestingMetricsResponse)
def get_metrics(
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    row = conn.execute(
        "SELECT holdings FROM investing_holdings WHERE user_id = %s",
        (user.id,),
    ).fetchone()
    holdings = row[0] if row and isinstance(row[0], list) else []
    try:
        div_yield_percent, beta, allocation_percent = _calc_metrics_from_holdings(holdings)
    except Exception:
        # Never fail the dashboard because of upstream quote issues or malformed holdings.
        div_yield_percent, beta, allocation_percent = "—", "—", {}
    return InvestingMetricsResponse(
        div_yield_percent=div_yield_percent,
        beta=beta,
        allocation_percent=allocation_percent,
    )


@router.put("/metrics", response_model=InvestingMetricsResponse)
def update_metrics(
    payload: InvestingMetricsUpdateRequest,
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    # Keep existing values if fields are omitted.
    current = conn.execute(
        "SELECT div_yield_percent, beta FROM investing_metrics WHERE user_id = %s",
        (user.id,),
    ).fetchone()

    div_yield = payload.div_yield_percent if payload.div_yield_percent is not None else (current[0] if current else "—")
    beta = payload.beta if payload.beta is not None else (current[1] if current else "—")

    conn.execute(
        """
        INSERT INTO investing_metrics(user_id, div_yield_percent, beta, updated_at)
        VALUES (%s, %s, %s, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET div_yield_percent = EXCLUDED.div_yield_percent,
                      beta = EXCLUDED.beta,
                      updated_at = NOW()
        """,
        (user.id, div_yield, beta),
    )
    conn.commit()
    return InvestingMetricsResponse(div_yield_percent=div_yield, beta=beta, allocation_percent={})


@router.get("/holdings", response_model=InvestingHoldingsResponse)
def get_holdings(
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    row = conn.execute(
        "SELECT holdings, updated_at FROM investing_holdings WHERE user_id = %s",
        (user.id,),
    ).fetchone()
    if not row:
        return InvestingHoldingsResponse(holdings=[], updated_at=None)
    return InvestingHoldingsResponse(holdings=row[0], updated_at=str(row[1]))


@router.put("/holdings", response_model=InvestingHoldingsResponse)
def update_holdings(
    payload: InvestingHoldingsUpdateRequest,
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    holdings_json = [h.model_dump() for h in payload.holdings]
    row = conn.execute(
        """
        INSERT INTO investing_holdings(user_id, holdings, updated_at)
        VALUES (%s, %s, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET holdings = EXCLUDED.holdings,
                      updated_at = NOW()
        RETURNING updated_at
        """,
        (user.id, Json(holdings_json)),
    ).fetchone()
    conn.commit()
    updated_at = str(row[0]) if row else None
    return InvestingHoldingsResponse(holdings=holdings_json, updated_at=updated_at)


@router.get("/capital-entries", response_model=InvestingCapitalEntriesResponse)
def get_capital_entries(
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    row = conn.execute(
        "SELECT entries, updated_at FROM investing_capital_entries WHERE user_id = %s",
        (user.id,),
    ).fetchone()
    if not row:
        return InvestingCapitalEntriesResponse(entries=[], updated_at=None)
    entries_raw = row[0] if isinstance(row[0], list) else []
    return InvestingCapitalEntriesResponse(entries=_enrich_entries(entries_raw), updated_at=str(row[1]))


@router.put("/capital-entries", response_model=InvestingCapitalEntriesResponse)
def update_capital_entries(
    payload: InvestingCapitalEntriesUpdateRequest,
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    entries_json = [e.model_dump() for e in payload.entries]
    row = conn.execute(
        """
        INSERT INTO investing_capital_entries(user_id, entries, updated_at)
        VALUES (%s, %s, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET entries = EXCLUDED.entries,
                      updated_at = NOW()
        RETURNING updated_at
        """,
        (user.id, Json(entries_json)),
    ).fetchone()
    conn.commit()
    updated_at = str(row[0]) if row else None
    return InvestingCapitalEntriesResponse(entries=_enrich_entries(entries_json), updated_at=updated_at)


@router.get("/notes", response_model=InvestingNotesResponse)
def get_notes(
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    row = conn.execute(
        "SELECT notes, updated_at FROM investing_notes WHERE user_id = %s",
        (user.id,),
    ).fetchone()
    if row:
        return InvestingNotesResponse(notes=row[0], updated_at=str(row[1]))

    inserted = conn.execute(
        """
        INSERT INTO investing_notes(user_id, notes, updated_at)
        VALUES (%s, %s, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET notes = investing_notes.notes
        RETURNING notes, updated_at
        """,
        (user.id, DEFAULT_INVESTING_NOTES),
    ).fetchone()
    conn.commit()
    if not inserted:
        return InvestingNotesResponse(notes=DEFAULT_INVESTING_NOTES, updated_at=None)
    return InvestingNotesResponse(notes=inserted[0], updated_at=str(inserted[1]))


@router.put("/notes", response_model=InvestingNotesResponse)
def update_notes(
    payload: InvestingNotesUpdateRequest,
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    row = conn.execute(
        """
        INSERT INTO investing_notes(user_id, notes, updated_at)
        VALUES (%s, %s, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET notes = EXCLUDED.notes,
                      updated_at = NOW()
        RETURNING notes, updated_at
        """,
        (user.id, payload.notes),
    ).fetchone()
    conn.commit()
    if not row:
        return InvestingNotesResponse(notes=payload.notes, updated_at=None)
    return InvestingNotesResponse(notes=row[0], updated_at=str(row[1]))


@router.get("/activities", response_model=InvestingActivitiesResponse)
def get_activities(
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    row = conn.execute(
        "SELECT activities, updated_at FROM investing_activities WHERE user_id = %s",
        (user.id,),
    ).fetchone()
    if not row:
        return InvestingActivitiesResponse(activities=[], yearly_summary=[], updated_at=None)
    raw = row[0] if isinstance(row[0], list) else []
    try:
        enriched = _enrich_activities_with_usd(raw)
        summary = _calc_activity_yearly_summary(enriched)
    except Exception:
        # Fail-safe: never break Activities page due to malformed legacy rows.
        enriched = []
        summary = []
    return InvestingActivitiesResponse(activities=enriched, yearly_summary=summary, updated_at=str(row[1]))


@router.put("/activities", response_model=InvestingActivitiesResponse)
def update_activities(
    payload: InvestingActivitiesUpdateRequest,
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    activities_json = [
        {
            k: v
            for k, v in a.model_dump().items()
            if k not in {"amount_usd", "gains_losses_usd", "commission_usd", "fx_rate_to_usd"}
        }
        for a in payload.activities
    ]
    for row in activities_json:
        raw_type = str(row.get("type", "")).strip().lower()
        row["type"] = "sell" if raw_type in {"sell", "sale", "sold"} else "buy"
    row = conn.execute(
        """
        INSERT INTO investing_activities(user_id, activities, updated_at)
        VALUES (%s, %s, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET activities = EXCLUDED.activities,
                      updated_at = NOW()
        RETURNING updated_at
        """,
        (user.id, Json(activities_json)),
    ).fetchone()
    conn.commit()
    updated_at = str(row[0]) if row else None
    enriched = _enrich_activities_with_usd(activities_json)
    summary = _calc_activity_yearly_summary(enriched)
    return InvestingActivitiesResponse(activities=enriched, yearly_summary=summary, updated_at=updated_at)


@router.get("/picking", response_model=InvestingPickingResponse)
def get_picking(
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    row = conn.execute(
        "SELECT rows, updated_at FROM investing_picking WHERE user_id = %s",
        (user.id,),
    ).fetchone()
    if not row:
        return InvestingPickingResponse(rows=[], updated_at=None)
    raw = row[0] if isinstance(row[0], list) else []
    normalized = [InvestingPickingRow(**r).model_dump() if isinstance(r, dict) else InvestingPickingRow(id=str(r)).model_dump() for r in raw]
    return InvestingPickingResponse(rows=normalized, updated_at=str(row[1]))


@router.put("/picking", response_model=InvestingPickingResponse)
def update_picking(
    payload: InvestingPickingUpdateRequest,
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    rows_json = [r.model_dump() for r in payload.rows]
    row = conn.execute(
        """
        INSERT INTO investing_picking(user_id, rows, updated_at)
        VALUES (%s, %s, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET rows = EXCLUDED.rows,
                      updated_at = NOW()
        RETURNING updated_at
        """,
        (user.id, Json(rows_json)),
    ).fetchone()
    conn.commit()
    updated_at = str(row[0]) if row else None
    return InvestingPickingResponse(rows=rows_json, updated_at=updated_at)

