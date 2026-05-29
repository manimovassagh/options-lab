from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app
from api.schemas.quote import QuoteResponse
from api.schemas.chain import ChainResponse, OptionContract
from datetime import date, timedelta

client = TestClient(app)
EXPIRY = (date.today() + timedelta(days=30)).isoformat()

MOCK_QUOTE = QuoteResponse(ticker="AAPL", price=189.50, change_pct=1.2, iv=0.26)
MOCK_CONTRACT = OptionContract(strike=190.0, type="call", bid=1.40, ask=1.50, mid=1.45,
                                iv=0.26, delta=0.45, gamma=0.08, theta=-0.05, vega=0.12,
                                open_interest=8420, volume=1230)
MOCK_CHAIN = ChainResponse(ticker="AAPL", expiry=EXPIRY, days_to_expiry=30,
                            available_expiries=[EXPIRY], underlying_price=189.50,
                            contracts=[MOCK_CONTRACT])

@patch("api.routes.quote.provider")
def test_get_quote(mock_prov):
    mock_prov.get_quote.return_value = MOCK_QUOTE
    r = client.get("/api/quote/AAPL")
    assert r.status_code == 200
    assert r.json()["price"] == 189.50

@patch("api.routes.chain.yf.Ticker")
@patch("api.routes.chain.provider")
def test_get_chain(mock_prov, mock_ticker):
    mock_ticker.return_value.options = [EXPIRY]
    mock_prov.get_chain.return_value = MOCK_CHAIN
    r = client.get(f"/api/chain/AAPL?expiry={EXPIRY}")
    assert r.status_code == 200
    assert r.json()["contracts"][0]["delta"] == 0.45

def test_analyse_long_call():
    r = client.post("/api/analyse", json={
        "ticker": "AAPL", "underlying_price": 100.0,
        "legs": [{"type": "call", "strike": 100.0, "expiry": EXPIRY,
                  "direction": "long", "quantity": 1, "premium": 2.0}],
    })
    assert r.status_code == 200
    data = r.json()
    assert data["strategy_name"] == "Long Call"
    assert data["max_profit"] is None
    assert abs(data["max_loss"] - (-200.0)) < 0.01
    assert abs(data["breakeven"][0] - 102.0) < 0.01
    assert data["greeks"]["theta"] < 0

def test_analyse_rejects_empty_legs():
    r = client.post("/api/analyse", json={"ticker":"AAPL","underlying_price":100.0,"legs":[]})
    assert r.status_code == 422

def test_get_strategies():
    r = client.get("/api/strategies")
    assert r.status_code == 200
    names = [s["name"] for s in r.json()["strategies"]]
    assert "Long Call" in names
