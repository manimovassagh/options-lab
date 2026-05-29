import math
import yfinance as yf
from datetime import date
from api.schemas.quote import QuoteResponse
from api.schemas.chain import ChainResponse, OptionContract
from py_vollib.black_scholes.greeks.analytical import (
    delta as bs_delta, gamma as bs_gamma,
    theta as bs_theta, vega as bs_vega,
)

RISK_FREE_RATE = 0.05

def _dte(expiry_str: str) -> int:
    return max((date.fromisoformat(expiry_str) - date.today()).days, 1)

def _greeks(flag: str, S: float, K: float, t: float, iv: float) -> dict:
    try:
        return {
            "delta": round(float(bs_delta(flag, S, K, t, RISK_FREE_RATE, iv)), 4),
            "gamma": round(float(bs_gamma(flag, S, K, t, RISK_FREE_RATE, iv)), 4),
            "theta": round(float(bs_theta(flag, S, K, t, RISK_FREE_RATE, iv)), 4),
            "vega":  round(float(bs_vega(flag,  S, K, t, RISK_FREE_RATE, iv)) / 100, 4),
        }
    except Exception:
        return {"delta": 0.0, "gamma": 0.0, "theta": 0.0, "vega": 0.0}

class YFinanceProvider:
    def get_quote(self, ticker: str) -> QuoteResponse:
        t = yf.Ticker(ticker)
        info = t.info
        price = float(info.get("currentPrice") or info.get("regularMarketPrice", 0))
        change_pct = float(info.get("regularMarketChangePercent", 0))
        iv = 0.25
        try:
            chain = t.option_chain(t.options[0])
            atm = chain.calls.iloc[(chain.calls["strike"] - price).abs().argsort()[:1]]
            iv = float(atm["impliedVolatility"].values[0])
        except Exception:
            pass
        return QuoteResponse(ticker=ticker, price=price, change_pct=change_pct, iv=iv)

    def get_chain(self, ticker: str, expiry: str) -> ChainResponse:
        t = yf.Ticker(ticker)
        info = t.info
        S = float(info.get("currentPrice") or info.get("regularMarketPrice", 0))
        available = list(t.options)
        raw = t.option_chain(expiry)
        t_years = _dte(expiry) / 365.0
        contracts = []
        for df, opt_type, flag in [(raw.calls, "call", "c"), (raw.puts, "put", "p")]:
            for _, row in df.iterrows():
                iv = float(row.get("impliedVolatility") or 0.25)
                K = float(row["strike"])
                g = _greeks(flag, S, K, t_years, iv)
                contracts.append(OptionContract(
                    strike=K, type=opt_type,
                    bid=float(row.get("bid") or 0),
                    ask=float(row.get("ask") or 0),
                    mid=round((float(row.get("bid") or 0) + float(row.get("ask") or 0)) / 2, 2),
                    iv=round(iv, 4),
                    delta=g["delta"], gamma=g["gamma"],
                    theta=g["theta"], vega=g["vega"],
                    open_interest=int(v) if (v := float(row.get("openInterest") or 0)) and not math.isnan(v) else 0,
                    volume=int(v) if (v := float(row.get("volume") or 0)) and not math.isnan(v) else 0,
                ))
        return ChainResponse(
            ticker=ticker, expiry=expiry, days_to_expiry=_dte(expiry),
            available_expiries=available, underlying_price=S, contracts=contracts,
        )
