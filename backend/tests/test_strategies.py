from calc.strategies import identify_strategy, calc_max_profit_loss, calc_breakevens
from api.schemas.analyse import Leg
from datetime import date, timedelta

EXP = (date.today() + timedelta(days=30)).isoformat()

def _leg(type, direction, strike=190.0, premium=1.45):
    return Leg(type=type, strike=strike, expiry=EXP, direction=direction, quantity=1, premium=premium)

def test_identify_long_call():
    assert identify_strategy([_leg("call","long")]) == "Long Call"

def test_identify_long_put():
    assert identify_strategy([_leg("put","long")]) == "Long Put"

def test_identify_cash_secured_put():
    assert identify_strategy([_leg("put","short")]) == "Cash-Secured Put"

def test_long_call_max_loss():
    _, loss = calc_max_profit_loss([_leg("call","long",premium=1.45)])
    assert abs(loss - (-145.0)) < 0.01

def test_long_call_max_profit_is_none():
    profit, _ = calc_max_profit_loss([_leg("call","long")])
    assert profit is None

def test_long_call_breakeven():
    be = calc_breakevens([_leg("call","long",strike=190.0,premium=1.45)])
    assert abs(be[0] - 191.45) < 0.01
