from typing import Protocol, runtime_checkable
from api.schemas.quote import QuoteResponse
from api.schemas.chain import ChainResponse

@runtime_checkable
class DataProvider(Protocol):
    def get_quote(self, ticker: str) -> QuoteResponse: ...
    def get_chain(self, ticker: str, expiry: str) -> ChainResponse: ...
