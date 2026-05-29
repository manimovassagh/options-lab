from calc.pnl import pnl_curve_at_expiry, pnl_curve_at_date
from api.schemas.analyse import Leg
from datetime import date, timedelta

EXPIRY = (date.today() + timedelta(days=30)).isoformat()

def _leg(direction="long"):
    return Leg(type="call", strike=100.0, expiry=EXPIRY,
               direction=direction, quantity=1, premium=2.0)

def test_long_call_max_loss_at_expiry():
    curve = pnl_curve_at_expiry([_leg()], underlying_price=100.0)
    otm = [p for p in curve if p.price < 100.0]
    for pt in otm:
        assert abs(pt.pnl - (-200.0)) < 0.01

def test_long_call_profit_at_expiry():
    curve = pnl_curve_at_expiry([_leg()], underlying_price=100.0)
    itm = next(p for p in curve if abs(p.price - 110.0) < 0.5)
    assert abs(itm.pnl - 800.0) < 5.0   # (110-100-2)*100

def test_short_call_mirrors_long():
    lc = pnl_curve_at_expiry([_leg("long")],  underlying_price=100.0)
    sc = pnl_curve_at_expiry([_leg("short")], underlying_price=100.0)
    for lp, sp in zip(lc, sc):
        assert abs(lp.pnl + sp.pnl) < 0.01

def test_pnl_before_expiry_differs_from_expiry():
    mid = date.today() + timedelta(days=15)
    at_expiry = pnl_curve_at_expiry([_leg()], underlying_price=100.0)
    at_mid     = pnl_curve_at_date([_leg()], 100.0, mid)
    atm_expiry = next(p for p in at_expiry if abs(p.price - 100.0) < 1.0)
    atm_mid    = next(p for p in at_mid    if abs(p.price - 100.0) < 1.0)
    assert atm_mid.pnl > atm_expiry.pnl   # time value reduces loss before expiry
