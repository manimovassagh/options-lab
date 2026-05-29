from pydantic import BaseModel, field_validator
from typing import Literal, Optional
from datetime import date

class Leg(BaseModel):
    type: Literal["call", "put"]
    strike: float
    expiry: str               # ISO date "YYYY-MM-DD"
    direction: Literal["long", "short"]
    quantity: int
    premium: float            # per share price (not per contract)

class PnLPoint(BaseModel):
    price: float
    pnl: float                # dollars for 1 contract (100 shares)

class Greeks(BaseModel):
    delta: float
    gamma: float
    theta: float
    vega: float

class AnalyseRequest(BaseModel):
    ticker: str
    underlying_price: float
    legs: list[Leg]
    analysis_date: Optional[date] = None

    @field_validator("legs")
    @classmethod
    def legs_not_empty(cls, v: list) -> list:
        if not v:
            raise ValueError("at least one leg required")
        return v

class AnalyseResponse(BaseModel):
    strategy_name: str
    max_profit: Optional[float]    # None = unlimited
    max_loss: Optional[float]      # None = unlimited
    breakeven: list[float]
    greeks: Greeks
    pnl_at_expiry: list[PnLPoint]
    pnl_today: list[PnLPoint]
    pnl_midpoint: list[PnLPoint]
