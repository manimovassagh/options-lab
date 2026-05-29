from fastapi import APIRouter
from datetime import date
from api.schemas.analyse import AnalyseRequest, AnalyseResponse, Greeks
from calc.pnl import pnl_curve_at_expiry, pnl_curve_at_date
from calc.strategies import identify_strategy, calc_max_profit_loss, calc_breakevens
from calc.black_scholes import calc_greeks

router = APIRouter()
RISK_FREE_RATE = 0.05

@router.post("/analyse", response_model=AnalyseResponse)
def analyse(req: AnalyseRequest):
    legs = req.legs
    S = req.underlying_price
    today = date.today()

    primary = legs[0]
    expiry = date.fromisoformat(primary.expiry)
    dte = max((expiry - today).days, 1)
    t = dte / 365.0
    iv = 0.25
    flag = "c" if primary.type == "call" else "p"
    sign = 1 if primary.direction == "long" else -1

    raw = calc_greeks(flag, S, primary.strike, t, RISK_FREE_RATE, iv)
    greeks = Greeks(
        delta=round(raw["delta"] * sign, 4),
        gamma=round(raw["gamma"], 4),
        theta=round(raw["theta"] * sign, 4),
        vega=round(raw["vega"]  * sign, 4),
    )

    mid_date = today + (expiry - today) // 2

    return AnalyseResponse(
        strategy_name=identify_strategy(legs),
        max_profit=calc_max_profit_loss(legs)[0],
        max_loss=calc_max_profit_loss(legs)[1],
        breakeven=calc_breakevens(legs),
        greeks=greeks,
        pnl_at_expiry=pnl_curve_at_expiry(legs, S),
        pnl_today=pnl_curve_at_date(legs, S, today, iv),
        pnl_midpoint=pnl_curve_at_date(legs, S, mid_date, iv),
    )
