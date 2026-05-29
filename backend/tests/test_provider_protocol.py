from providers.base import DataProvider
from api.schemas.chain import ChainResponse
from api.schemas.quote import QuoteResponse

def test_mock_satisfies_protocol():
    class MockProvider:
        def get_quote(self, ticker: str) -> QuoteResponse:
            return QuoteResponse(ticker=ticker, price=100.0, change_pct=0.0, iv=0.25)
        def get_chain(self, ticker: str, expiry: str) -> ChainResponse:
            return ChainResponse(ticker=ticker, expiry=expiry, days_to_expiry=30,
                                 available_expiries=[expiry], underlying_price=100.0, contracts=[])
    assert isinstance(MockProvider(), DataProvider)
