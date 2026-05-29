from pydantic import BaseModel
from typing import Literal, Optional

class LegTemplate(BaseModel):
    type: Literal["call", "put", "stock"]
    direction: Literal["long", "short"]
    quantity: int
    strike_offset: Optional[float] = None

class StrategyTemplate(BaseModel):
    name: str
    description: str
    legs: list[LegTemplate]

class StrategiesResponse(BaseModel):
    strategies: list[StrategyTemplate]
