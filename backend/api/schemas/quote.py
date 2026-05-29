from pydantic import BaseModel

class QuoteResponse(BaseModel):
    ticker: str
    price: float
    change_pct: float
    iv: float          # ATM implied volatility as decimal (e.g. 0.26 = 26%)
