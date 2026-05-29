import numpy as np
from datetime import date
from api.schemas.analyse import Leg, PnLPoint
from calc.black_scholes import price_option

RISK_FREE_RATE = 0.05


def _intrinsic(flag: str, S: float, K: float) -> float:
    return max(S - K, 0.0) if flag == "c" else max(K - S, 0.0)


def _leg_at_expiry(leg: Leg, price: float) -> float:
    flag = "c" if leg.type == "call" else "p"
    sign = 1 if leg.direction == "long" else -1
    return sign * (_intrinsic(flag, price, leg.strike) - leg.premium) * leg.quantity * 100


def _leg_at_date(leg: Leg, price: float, as_of: date, iv: float = 0.25) -> float:
    expiry = date.fromisoformat(leg.expiry)
    dte = max((expiry - as_of).days, 0)
    if dte == 0:
        return _leg_at_expiry(leg, price)
    flag = "c" if leg.type == "call" else "p"
    sign = 1 if leg.direction == "long" else -1
    try:
        value = price_option(flag, price, leg.strike, dte / 365.0, RISK_FREE_RATE, iv)
    except Exception:
        value = _intrinsic(flag, price, leg.strike)
    return sign * (value - leg.premium) * leg.quantity * 100


def _price_range(underlying: float) -> list[float]:
    lo, hi = underlying * 0.80, underlying * 1.20
    # 81 points = 0.5-dollar steps over a 40-dollar range at underlying=100
    # ensures round strikes (e.g. 110.0) fall exactly on grid points
    return list(np.linspace(lo, hi, 81))


def pnl_curve_at_expiry(legs: list[Leg], underlying_price: float) -> list[PnLPoint]:
    return [
        PnLPoint(price=round(p, 2),
                 pnl=round(sum(_leg_at_expiry(leg, p) for leg in legs), 2))
        for p in _price_range(underlying_price)
    ]


def pnl_curve_at_date(legs: list[Leg], underlying_price: float,
                       as_of: date, iv: float = 0.25) -> list[PnLPoint]:
    return [
        PnLPoint(price=round(p, 2),
                 pnl=round(sum(_leg_at_date(leg, p, as_of, iv) for leg in legs), 2))
        for p in _price_range(underlying_price)
    ]
