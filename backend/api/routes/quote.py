from fastapi import APIRouter, HTTPException
from api.schemas.quote import QuoteResponse
from providers.yfinance_provider import YFinanceProvider

router = APIRouter()
provider = YFinanceProvider()

@router.get("/quote/{ticker}", response_model=QuoteResponse)
def get_quote(ticker: str):
    try:
        return provider.get_quote(ticker.upper())
    except Exception as e:
        raise HTTPException(404, detail=f"No data for {ticker}: {e}")
