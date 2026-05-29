from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from api.schemas.chain import ChainResponse
from providers.yfinance_provider import YFinanceProvider
import yfinance as yf

router = APIRouter()
provider = YFinanceProvider()

@router.get("/chain/{ticker}", response_model=ChainResponse)
def get_chain(ticker: str, expiry: Optional[str] = Query(default=None)):
    try:
        available = list(yf.Ticker(ticker.upper()).options)
        if not available:
            raise HTTPException(404, detail=f"No options for {ticker}")
        return provider.get_chain(ticker.upper(), expiry or available[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))
