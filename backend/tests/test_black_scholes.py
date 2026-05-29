from calc.black_scholes import price_option, calc_greeks
import math

S, K, t, r, sigma = 100.0, 100.0, 1.0, 0.05, 0.20

def test_call_price_known_value():
    assert abs(price_option("c", S, K, t, r, sigma) - 10.45) < 0.10

def test_put_call_parity():
    call = price_option("c", S, K, t, r, sigma)
    put  = price_option("p", S, K, t, r, sigma)
    parity = call - S + K * math.exp(-r * t)
    assert abs(put - parity) < 0.01

def test_call_delta_atm():
    g = calc_greeks("c", S, K, t, r, sigma)
    assert 0.55 < g["delta"] < 0.75

def test_theta_negative_for_long_call():
    g = calc_greeks("c", S, K, t, r, sigma)
    assert g["theta"] < 0

def test_deep_itm_call_delta_near_one():
    g = calc_greeks("c", 150.0, 100.0, t, r, sigma)
    assert g["delta"] > 0.85

def test_deep_otm_call_delta_near_zero():
    g = calc_greeks("c", 50.0, 100.0, t, r, sigma)
    assert g["delta"] < 0.10
