from pydantic import BaseModel
from typing import Literal

class OptionContract(BaseModel):
    strike: float
    type: Literal["call", "put"]
    bid: float
    ask: float
    mid: float
    iv: float          # implied volatility as decimal
    delta: float
    gamma: float
    theta: float       # daily theta, negative for long positions
    vega: float        # per 1% IV change
    open_interest: int
    volume: int

class ChainResponse(BaseModel):
    ticker: str
    expiry: str                       # ISO date "YYYY-MM-DD"
    days_to_expiry: int
    available_expiries: list[str]
    underlying_price: float
    contracts: list[OptionContract]
