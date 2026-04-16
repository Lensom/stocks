from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from psycopg import Connection
from psycopg.types.json import Json

from app.auth.router import get_current_user, get_conn
from app.auth.schemas import UserResponse
from app.investing.schemas import (
    InvestingCapitalEntriesResponse,
    InvestingCapitalEntriesUpdateRequest,
    InvestingCapitalEntry,
    InvestingHoldingsResponse,
    InvestingHoldingsUpdateRequest,
    InvestingMetricsResponse,
    InvestingMetricsUpdateRequest,
)


router = APIRouter(prefix="/investing", tags=["investing"])


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


@router.get("/metrics", response_model=InvestingMetricsResponse)
def get_metrics(
    user: Annotated[UserResponse, Depends(get_current_user)],
    conn: Annotated[Connection, Depends(get_conn)],
):
    row = conn.execute(
        "SELECT div_yield_percent, beta FROM investing_metrics WHERE user_id = %s",
        (user.id,),
    ).fetchone()
    if not row:
        return InvestingMetricsResponse(div_yield_percent="—", beta="—")
    return InvestingMetricsResponse(div_yield_percent=row[0], beta=row[1])


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
    return InvestingMetricsResponse(div_yield_percent=div_yield, beta=beta)


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

