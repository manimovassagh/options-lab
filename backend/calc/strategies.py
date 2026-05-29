from api.schemas.analyse import Leg
from api.schemas.strategy import StrategyTemplate, LegTemplate


def identify_strategy(legs: list[Leg]) -> str:
    if len(legs) == 2 and any(l.type == "call" and l.direction == "short" for l in legs):
        return "Covered Call"
    if len(legs) != 1:
        return "Custom"
    leg = legs[0]
    if leg.type == "call" and leg.direction == "long":  return "Long Call"
    if leg.type == "put"  and leg.direction == "long":  return "Long Put"
    if leg.type == "put"  and leg.direction == "short": return "Cash-Secured Put"
    if leg.type == "call" and leg.direction == "short": return "Naked Call"
    return "Custom"


def calc_max_profit_loss(legs: list[Leg]) -> tuple[float | None, float | None]:
    name = identify_strategy(legs)
    leg  = legs[0]
    q    = leg.quantity * 100
    if name == "Long Call":
        return None, round(-leg.premium * q, 2)
    if name == "Long Put":
        return round((leg.strike - leg.premium) * q, 2), round(-leg.premium * q, 2)
    if name == "Cash-Secured Put":
        return round(leg.premium * q, 2), round(-(leg.strike - leg.premium) * q, 2)
    if name == "Naked Call":
        return round(leg.premium * q, 2), None
    return None, None


def calc_breakevens(legs: list[Leg]) -> list[float]:
    name = identify_strategy(legs)
    leg  = legs[0]
    if name in ("Long Call", "Naked Call"):
        return [round(leg.strike + leg.premium, 2)]
    if name in ("Long Put", "Cash-Secured Put"):
        return [round(leg.strike - leg.premium, 2)]
    return []


def get_strategy_templates() -> list[StrategyTemplate]:
    return [
        StrategyTemplate(
            name="Long Call",
            description="Buy a call. Unlimited upside, loss limited to premium paid.",
            legs=[LegTemplate(type="call", direction="long", quantity=1)],
        ),
        StrategyTemplate(
            name="Long Put",
            description="Buy a put. Profit when stock falls. Loss limited to premium paid.",
            legs=[LegTemplate(type="put", direction="long", quantity=1)],
        ),
        StrategyTemplate(
            name="Cash-Secured Put",
            description="Sell a put for income. Obligated to buy at strike if assigned.",
            legs=[LegTemplate(type="put", direction="short", quantity=1)],
        ),
        StrategyTemplate(
            name="Covered Call",
            description="Own 100 shares + sell a call. Collect premium, cap upside at strike.",
            legs=[
                LegTemplate(type="stock", direction="long", quantity=100),
                LegTemplate(type="call",  direction="short", quantity=1),
            ],
        ),
    ]
