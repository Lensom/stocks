from __future__ import annotations

from pydantic import BaseModel, Field


class InvestingMetricsResponse(BaseModel):
    div_yield_percent: str
    beta: str


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

