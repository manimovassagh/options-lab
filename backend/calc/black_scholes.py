from py_vollib.black_scholes import black_scholes as _price
from py_vollib.black_scholes.greeks.analytical import (
    delta as _delta, gamma as _gamma, theta as _theta, vega as _vega,
)

RISK_FREE_RATE = 0.05


def price_option(flag: str, S: float, K: float, t: float, r: float, sigma: float) -> float:
    return float(_price(flag, S, K, t, r, sigma))


def calc_greeks(flag: str, S: float, K: float, t: float, r: float, sigma: float) -> dict:
    return {
        "delta": round(float(_delta(flag, S, K, t, r, sigma)), 4),
        "gamma": round(float(_gamma(flag, S, K, t, r, sigma)), 4),
        "theta": round(float(_theta(flag, S, K, t, r, sigma)), 4),
        "vega":  round(float(_vega( flag, S, K, t, r, sigma)) / 100, 4),
    }
