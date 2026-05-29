import pytest
from pydantic import ValidationError
from api.schemas.analyse import AnalyseRequest, Leg

def _leg(**kwargs):
    defaults = dict(type="call", strike=190.0, expiry="2026-06-20",
                    direction="long", quantity=1, premium=1.45)
    return Leg(**{**defaults, **kwargs})

def test_analyse_request_valid():
    req = AnalyseRequest(ticker="AAPL", underlying_price=189.50, legs=[_leg()])
    assert req.ticker == "AAPL"
    assert req.analysis_date is None

def test_analyse_request_rejects_empty_legs():
    with pytest.raises(ValidationError):
        AnalyseRequest(ticker="AAPL", underlying_price=189.50, legs=[])

def test_leg_rejects_invalid_direction():
    with pytest.raises(ValidationError):
        _leg(direction="buy")
