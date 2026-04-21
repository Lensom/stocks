from __future__ import annotations

from pydantic import BaseModel, Field


class InvestingMetricsResponse(BaseModel):
    div_yield_percent: str
    beta: str
    allocation_percent: dict[str, str] = Field(default_factory=dict)


class InvestingMetricsUpdateRequest(BaseModel):
    div_yield_percent: str | None = Field(default=None, max_length=32)
    beta: str | None = Field(default=None, max_length=32)


class InvestingHolding(BaseModel):
    id: str
    ticker: str
    name: str
    industry: str
    targetWeight: str
    currentWeight: str
    shares: int
    avgBuyPrice: str
    marketPrice: str
    marketValue: str
    pnl: str
    trend: str


class InvestingHoldingsResponse(BaseModel):
    holdings: list[InvestingHolding]
    updated_at: str | None = None


class InvestingHoldingsUpdateRequest(BaseModel):
    holdings: list[InvestingHolding] = Field(default_factory=list)


class InvestingQuotesResponse(BaseModel):
    prices: dict[str, float] = Field(default_factory=dict)
    as_of: str | None = None


class InvestingNotesResponse(BaseModel):
    notes: str
    updated_at: str | None = None


class InvestingNotesUpdateRequest(BaseModel):
    notes: str = Field(default="", max_length=20000)


class InvestingCapitalEntry(BaseModel):
    id: str
    date: str
    deposit: str
    total_value: str
    roi_percent: str
    one_year_percent: str


class InvestingCapitalEntryInput(BaseModel):
    id: str
    date: str
    deposit: str
    total_value: str


class InvestingCapitalEntriesResponse(BaseModel):
    entries: list[InvestingCapitalEntry]
    updated_at: str | None = None


class InvestingCapitalEntriesUpdateRequest(BaseModel):
    entries: list[InvestingCapitalEntryInput] = Field(default_factory=list)


class InvestingActivity(BaseModel):
    id: str
    type: str = "buy"
    name: str = ""
    ticker: str = ""
    category: str = ""
    count: int = 0
    price: str = "0"
    currency: str = "USD"
    amount: str = "0"
    gains_losses: str = "0"
    commission: str = "0"
    date: str = ""
    amount_usd: str = "0.00"
    gains_losses_usd: str = "0.00"
    commission_usd: str = "0.00"
    fx_rate_to_usd: str = "1.000000"


class InvestingActivityYearSummary(BaseModel):
    year: str
    purchases_amount: str
    purchases_commission: str
    sales_amount: str
    sales_pnl: str
    sales_commission: str
    net_cash_flow: str


class InvestingActivitiesResponse(BaseModel):
    activities: list[InvestingActivity]
    yearly_summary: list[InvestingActivityYearSummary]
    updated_at: str | None = None


class InvestingActivitiesUpdateRequest(BaseModel):
    activities: list[InvestingActivity] = Field(default_factory=list)


class InvestingPickingRow(BaseModel):
    id: str
    name: str = ""
    ticker: str = ""
    industry: str = ""
    pe: str = ""
    eps: str = ""
    beta: str = ""
    div_yield: str = ""
    current_price: str = ""
    strong_buy_until: str = ""
    may_buy_until: str = ""
    buy_right_now: str = ""
    price_goal_1y: str = ""
    price_goal_5y: str = ""
    reports: str = ""


class InvestingPickingResponse(BaseModel):
    rows: list[InvestingPickingRow]
    updated_at: str | None = None


class InvestingPickingUpdateRequest(BaseModel):
    rows: list[InvestingPickingRow] = Field(default_factory=list)
