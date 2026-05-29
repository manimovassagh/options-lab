from fastapi import APIRouter
from api.schemas.strategy import StrategiesResponse
from calc.strategies import get_strategy_templates

router = APIRouter()

@router.get("/strategies", response_model=StrategiesResponse)
def get_strategies():
    return StrategiesResponse(strategies=get_strategy_templates())
