# Options Analyser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-user options risk/reward analyser with a React dashboard, FastAPI backend, real yfinance market data, and Black-Scholes Greeks.

**Architecture:** Python FastAPI backend with a `DataProvider` abstraction over yfinance; `py_vollib` for Black-Scholes math; React + TypeScript (Vite) frontend with Recharts for P&L charts and TanStack Query for API calls.

**Tech Stack:** Python 3.11+, FastAPI, Pydantic v2, yfinance, py_vollib, numpy, pytest, httpx; React 18, TypeScript, Vite, Recharts, TanStack Query v5, Tailwind CSS

---

## File Map

```
options_analyser/
├── backend/
│   ├── main.py                        # FastAPI app, route registration, CORS
│   ├── requirements.txt
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── quote.py               # GET /api/quote/{ticker}
│   │   │   ├── chain.py               # GET /api/chain/{ticker}
│   │   │   ├── analyse.py             # POST /api/analyse
│   │   │   └── strategy.py            # GET /api/strategies
│   │   └── schemas/
│   │       ├── __init__.py
│   │       ├── quote.py               # QuoteResponse
│   │       ├── chain.py               # ChainResponse, OptionContract
│   │       ├── analyse.py             # AnalyseRequest, AnalyseResponse, Leg, PnLPoint, Greeks
│   │       └── strategy.py            # StrategyTemplate, StrategiesResponse
│   ├── providers/
│   │   ├── __init__.py
│   │   ├── base.py                    # DataProvider Protocol
│   │   └── yfinance_provider.py       # YFinanceProvider
│   ├── calc/                          # Named 'calc' to avoid shadowing stdlib 'math'
│   │   ├── __init__.py
│   │   ├── black_scholes.py           # price_option, calc_greeks
│   │   ├── pnl.py                     # pnl_curve_at_expiry, pnl_curve_at_date
│   │   └── strategies.py              # identify_strategy, calc_max_profit_loss, calc_breakevens
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py
│       ├── test_schemas.py
│       ├── test_provider_protocol.py
│       ├── test_black_scholes.py
│       ├── test_pnl.py
│       ├── test_strategies.py
│       └── test_routes.py
└── frontend/
    ├── vite.config.ts                 # Proxy /api → localhost:8000
    ├── tailwind.config.js
    ├── src/
    │   ├── main.tsx                   # QueryClientProvider root
    │   ├── App.tsx                    # Renders Dashboard
    │   ├── index.css                  # Dark trading theme CSS vars
    │   ├── types/
    │   │   └── options.ts             # TypeScript mirrors of all Pydantic schemas
    │   ├── api/
    │   │   └── client.ts              # useQuote, useChain, useAnalyse, useStrategies
    │   ├── pages/
    │   │   └── Dashboard.tsx          # Layout: Header + ChainTable left + analysis right
    │   └── components/
    │       ├── Header/
    │       │   └── Header.tsx         # Ticker search, quote display, tab nav
    │       ├── ChainTable/
    │       │   └── ChainTable.tsx     # Option chain table, expiry selector
    │       ├── PnLChart/
    │       │   └── PnLChart.tsx       # Recharts P&L with 3 lines + breakeven
    │       ├── GreeksPanel/
    │       │   └── GreeksPanel.tsx    # Delta/Theta/Vega/Gamma + summary metrics
    │       ├── TimeframeSlider/
    │       │   └── TimeframeSlider.tsx # Date slider today → expiry
    │       ├── StrategySelector/
    │       │   └── StrategySelector.tsx # Strategy dropdown
    │       └── LearnPanel/
    │           └── LearnPanel.tsx     # Interactive educational explainers
```

---

## Task 1: Backend Project Setup

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/main.py`
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: Create requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
pydantic==2.7.0
yfinance==0.2.40
py_vollib==1.0.1
numpy==1.26.4
httpx==0.27.0
pytest==8.2.0
pytest-asyncio==0.23.0
```

- [ ] **Step 2: Create virtualenv and install**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -c "import fastapi, yfinance, py_vollib; print('OK')"
```

Expected: prints `OK`.

- [ ] **Step 3: Create main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Options Analyser API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 4: Create tests/conftest.py**

```python
import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    return TestClient(app)
```

- [ ] **Step 5: Verify server starts**

```bash
uvicorn main:app --reload --port 8000
```

Open http://localhost:8000/api/health — expect `{"status":"ok"}`.

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: backend project setup — FastAPI skeleton with CORS"
```

---

## Task 2: Pydantic Schemas

**Files:**
- Create: `backend/api/__init__.py`
- Create: `backend/api/schemas/__init__.py`
- Create: `backend/api/schemas/quote.py`
- Create: `backend/api/schemas/chain.py`
- Create: `backend/api/schemas/analyse.py`
- Create: `backend/api/schemas/strategy.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/test_schemas.py`

- [ ] **Step 1: Create directory scaffolding**

```bash
mkdir -p backend/api/schemas backend/api/routes backend/tests
touch backend/api/__init__.py backend/api/schemas/__init__.py
touch backend/api/routes/__init__.py backend/tests/__init__.py
```

- [ ] **Step 2: Create api/schemas/quote.py**

```python
from pydantic import BaseModel

class QuoteResponse(BaseModel):
    ticker: str
    price: float
    change_pct: float
    iv: float          # ATM implied volatility as decimal (e.g. 0.26 = 26%)
```

- [ ] **Step 3: Create api/schemas/chain.py**

```python
from pydantic import BaseModel
from typing import Literal

class OptionContract(BaseModel):
    strike: float
    type: Literal["call", "put"]
    bid: float
    ask: float
    mid: float
    iv: float          # implied volatility as decimal
    delta: float
    gamma: float
    theta: float       # daily theta, negative for long positions
    vega: float        # per 1% IV change
    open_interest: int
    volume: int

class ChainResponse(BaseModel):
    ticker: str
    expiry: str                       # ISO date "YYYY-MM-DD"
    days_to_expiry: int
    available_expiries: list[str]
    underlying_price: float
    contracts: list[OptionContract]
```

- [ ] **Step 4: Create api/schemas/analyse.py**

```python
from pydantic import BaseModel, field_validator
from typing import Literal, Optional
from datetime import date

class Leg(BaseModel):
    type: Literal["call", "put"]
    strike: float
    expiry: str               # ISO date "YYYY-MM-DD"
    direction: Literal["long", "short"]
    quantity: int
    premium: float            # per share price (not per contract)

class PnLPoint(BaseModel):
    price: float
    pnl: float                # dollars for 1 contract (100 shares)

class Greeks(BaseModel):
    delta: float
    gamma: float
    theta: float
    vega: float

class AnalyseRequest(BaseModel):
    ticker: str
    underlying_price: float
    legs: list[Leg]
    analysis_date: Optional[date] = None

    @field_validator("legs")
    @classmethod
    def legs_not_empty(cls, v: list) -> list:
        if not v:
            raise ValueError("at least one leg required")
        return v

class AnalyseResponse(BaseModel):
    strategy_name: str
    max_profit: Optional[float]    # None = unlimited
    max_loss: Optional[float]      # None = unlimited
    breakeven: list[float]
    greeks: Greeks
    pnl_at_expiry: list[PnLPoint]
    pnl_today: list[PnLPoint]
    pnl_midpoint: list[PnLPoint]
```

- [ ] **Step 5: Create api/schemas/strategy.py**

```python
from pydantic import BaseModel
from typing import Literal, Optional

class LegTemplate(BaseModel):
    type: Literal["call", "put", "stock"]
    direction: Literal["long", "short"]
    quantity: int
    strike_offset: Optional[float] = None

class StrategyTemplate(BaseModel):
    name: str
    description: str
    legs: list[LegTemplate]

class StrategiesResponse(BaseModel):
    strategies: list[StrategyTemplate]
```

- [ ] **Step 6: Write schema tests**

```python
# backend/tests/test_schemas.py
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
```

- [ ] **Step 7: Run tests**

```bash
cd backend && pytest tests/test_schemas.py -v
```

Expected: 3 tests pass.

- [ ] **Step 8: Commit**

```bash
git add backend/api/ backend/tests/
git commit -m "feat: Pydantic schemas for all API endpoints"
```

---

## Task 3: DataProvider Protocol + YFinanceProvider

**Files:**
- Create: `backend/providers/__init__.py`
- Create: `backend/providers/base.py`
- Create: `backend/providers/yfinance_provider.py`
- Create: `backend/tests/test_provider_protocol.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_provider_protocol.py
from providers.base import DataProvider
from api.schemas.chain import ChainResponse
from api.schemas.quote import QuoteResponse

def test_mock_satisfies_protocol():
    class MockProvider:
        def get_quote(self, ticker: str) -> QuoteResponse:
            return QuoteResponse(ticker=ticker, price=100.0, change_pct=0.0, iv=0.25)
        def get_chain(self, ticker: str, expiry: str) -> ChainResponse:
            return ChainResponse(ticker=ticker, expiry=expiry, days_to_expiry=30,
                                 available_expiries=[expiry], underlying_price=100.0, contracts=[])
    assert isinstance(MockProvider(), DataProvider)
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd backend && pytest tests/test_provider_protocol.py -v
```

Expected: `ModuleNotFoundError`.

- [ ] **Step 3: Create providers/base.py**

```python
from typing import Protocol, runtime_checkable
from api.schemas.quote import QuoteResponse
from api.schemas.chain import ChainResponse

@runtime_checkable
class DataProvider(Protocol):
    def get_quote(self, ticker: str) -> QuoteResponse: ...
    def get_chain(self, ticker: str, expiry: str) -> ChainResponse: ...
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd backend && pytest tests/test_provider_protocol.py -v
```

Expected: 1 test passes.

- [ ] **Step 5: Create providers/yfinance_provider.py**

```python
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
                    open_interest=int(row.get("openInterest") or 0),
                    volume=int(row.get("volume") or 0),
                ))
        return ChainResponse(
            ticker=ticker, expiry=expiry, days_to_expiry=_dte(expiry),
            available_expiries=available, underlying_price=S, contracts=contracts,
        )
```

- [ ] **Step 6: Commit**

```bash
mkdir -p backend/providers && touch backend/providers/__init__.py
git add backend/providers/
git commit -m "feat: DataProvider protocol + YFinanceProvider with calculated Greeks"
```

---

## Task 4: Black-Scholes + P&L Engine

**Files:**
- Create: `backend/calc/__init__.py`
- Create: `backend/calc/black_scholes.py`
- Create: `backend/calc/pnl.py`
- Create: `backend/calc/strategies.py`
- Create: `backend/tests/test_black_scholes.py`
- Create: `backend/tests/test_pnl.py`
- Create: `backend/tests/test_strategies.py`

- [ ] **Step 1: Write Black-Scholes tests**

```python
# backend/tests/test_black_scholes.py
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
```

- [ ] **Step 2: Run — verify fails**

```bash
cd backend && pytest tests/test_black_scholes.py -v
```

Expected: `ModuleNotFoundError`.

- [ ] **Step 3: Create calc/black_scholes.py**

```python
from py_vollib.black_scholes import black_scholes as _price
from py_vollib.black_scholes.greeks.analytical import (
    delta as _delta, gamma as _gamma, theta as _theta, vega as _vega,
)

def price_option(flag: str, S: float, K: float, t: float, r: float, sigma: float) -> float:
    return float(_price(flag, S, K, t, r, sigma))

def calc_greeks(flag: str, S: float, K: float, t: float, r: float, sigma: float) -> dict:
    return {
        "delta": round(float(_delta(flag, S, K, t, r, sigma)), 4),
        "gamma": round(float(_gamma(flag, S, K, t, r, sigma)), 4),
        "theta": round(float(_theta(flag, S, K, t, r, sigma)), 4),
        "vega":  round(float(_vega( flag, S, K, t, r, sigma)) / 100, 4),
    }
```

- [ ] **Step 4: Run — verify passes**

```bash
cd backend && pytest tests/test_black_scholes.py -v
```

Expected: 6 tests pass.

- [ ] **Step 5: Write P&L tests**

```python
# backend/tests/test_pnl.py
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
```

- [ ] **Step 6: Create calc/pnl.py**

```python
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
    return list(np.linspace(lo, hi, 60))

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
```

- [ ] **Step 7: Run P&L tests**

```bash
cd backend && pytest tests/test_pnl.py -v
```

Expected: 4 tests pass.

- [ ] **Step 8: Write strategy tests**

```python
# backend/tests/test_strategies.py
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
```

- [ ] **Step 9: Create calc/strategies.py**

```python
from api.schemas.analyse import Leg
from api.schemas.strategy import StrategyTemplate, LegTemplate

def identify_strategy(legs: list[Leg]) -> str:
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
```

- [ ] **Step 10: Run strategy tests**

```bash
cd backend && pytest tests/test_strategies.py -v
```

Expected: 6 tests pass.

- [ ] **Step 11: Run full backend suite**

```bash
cd backend && pytest tests/ -v
```

Expected: All tests pass.

- [ ] **Step 12: Commit**

```bash
mkdir -p backend/calc && touch backend/calc/__init__.py
git add backend/calc/ backend/tests/
git commit -m "feat: Black-Scholes engine, P&L curves, and strategy definitions"
```

---

## Task 5: API Endpoints

**Files:**
- Create: `backend/api/routes/quote.py`
- Create: `backend/api/routes/chain.py`
- Create: `backend/api/routes/analyse.py`
- Create: `backend/api/routes/strategy.py`
- Modify: `backend/main.py`
- Create: `backend/tests/test_routes.py`

- [ ] **Step 1: Write route tests**

```python
# backend/tests/test_routes.py
from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app
from api.schemas.quote import QuoteResponse
from api.schemas.chain import ChainResponse, OptionContract
from datetime import date, timedelta

client = TestClient(app)
EXPIRY = (date.today() + timedelta(days=30)).isoformat()

MOCK_QUOTE = QuoteResponse(ticker="AAPL", price=189.50, change_pct=1.2, iv=0.26)
MOCK_CONTRACT = OptionContract(strike=190.0, type="call", bid=1.40, ask=1.50, mid=1.45,
                                iv=0.26, delta=0.45, gamma=0.08, theta=-0.05, vega=0.12,
                                open_interest=8420, volume=1230)
MOCK_CHAIN = ChainResponse(ticker="AAPL", expiry=EXPIRY, days_to_expiry=30,
                            available_expiries=[EXPIRY], underlying_price=189.50,
                            contracts=[MOCK_CONTRACT])

@patch("api.routes.quote.provider")
def test_get_quote(mock_prov):
    mock_prov.get_quote.return_value = MOCK_QUOTE
    r = client.get("/api/quote/AAPL")
    assert r.status_code == 200
    assert r.json()["price"] == 189.50

@patch("api.routes.chain.provider")
def test_get_chain(mock_prov):
    mock_prov.get_chain.return_value = MOCK_CHAIN
    r = client.get(f"/api/chain/AAPL?expiry={EXPIRY}")
    assert r.status_code == 200
    assert r.json()["contracts"][0]["delta"] == 0.45

def test_analyse_long_call():
    r = client.post("/api/analyse", json={
        "ticker": "AAPL", "underlying_price": 100.0,
        "legs": [{"type": "call", "strike": 100.0, "expiry": EXPIRY,
                  "direction": "long", "quantity": 1, "premium": 2.0}],
    })
    assert r.status_code == 200
    data = r.json()
    assert data["strategy_name"] == "Long Call"
    assert data["max_profit"] is None
    assert abs(data["max_loss"] - (-200.0)) < 0.01
    assert abs(data["breakeven"][0] - 102.0) < 0.01
    assert data["greeks"]["theta"] < 0

def test_analyse_rejects_empty_legs():
    r = client.post("/api/analyse", json={"ticker":"AAPL","underlying_price":100.0,"legs":[]})
    assert r.status_code == 422

def test_get_strategies():
    r = client.get("/api/strategies")
    assert r.status_code == 200
    names = [s["name"] for s in r.json()["strategies"]]
    assert "Long Call" in names
```

- [ ] **Step 2: Run — verify fails**

```bash
cd backend && pytest tests/test_routes.py -v
```

Expected: 404s or import errors.

- [ ] **Step 3: Create api/routes/quote.py**

```python
from fastapi import APIRouter, HTTPException
from api.schemas.quote import QuoteResponse
from providers.yfinance_provider import YFinanceProvider

router = APIRouter()
provider = YFinanceProvider()

@router.get("/quote/{ticker}", response_model=QuoteResponse)
def get_quote(ticker: str):
    try:
        return provider.get_quote(ticker.upper())
    except Exception as e:
        raise HTTPException(404, detail=f"No data for {ticker}: {e}")
```

- [ ] **Step 4: Create api/routes/chain.py**

```python
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from api.schemas.chain import ChainResponse
from providers.yfinance_provider import YFinanceProvider
import yfinance as yf

router = APIRouter()
provider = YFinanceProvider()

@router.get("/chain/{ticker}", response_model=ChainResponse)
def get_chain(ticker: str, expiry: Optional[str] = Query(default=None)):
    try:
        available = list(yf.Ticker(ticker.upper()).options)
        if not available:
            raise HTTPException(404, detail=f"No options for {ticker}")
        return provider.get_chain(ticker.upper(), expiry or available[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))
```

- [ ] **Step 5: Create api/routes/analyse.py**

```python
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
    analysis_date = req.analysis_date or today

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
```

- [ ] **Step 6: Create api/routes/strategy.py**

```python
from fastapi import APIRouter
from api.schemas.strategy import StrategiesResponse
from calc.strategies import get_strategy_templates

router = APIRouter()

@router.get("/strategies", response_model=StrategiesResponse)
def get_strategies():
    return StrategiesResponse(strategies=get_strategy_templates())
```

- [ ] **Step 7: Register all routes in main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.quote    import router as quote_router
from api.routes.chain    import router as chain_router
from api.routes.analyse  import router as analyse_router
from api.routes.strategy import router as strategy_router

app = FastAPI(title="Options Analyser API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],
                   allow_methods=["*"], allow_headers=["*"])

app.include_router(quote_router,    prefix="/api")
app.include_router(chain_router,    prefix="/api")
app.include_router(analyse_router,  prefix="/api")
app.include_router(strategy_router, prefix="/api")

@app.get("/api/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 8: Run all backend tests**

```bash
cd backend && pytest tests/ -v
```

Expected: All tests pass.

- [ ] **Step 9: Commit**

```bash
git add backend/
git commit -m "feat: all API endpoints complete — backend done"
```

---

## Task 6: Frontend Setup

**Files:**
- Create: `frontend/` (via Vite)
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/index.css`
- Modify: `frontend/tailwind.config.js`

- [ ] **Step 1: Scaffold and install**

```bash
cd /Users/mani/Documents/Projects/options_analyser
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install recharts @tanstack/react-query axios
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 2: Configure Vite proxy**

```ts
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
```

- [ ] **Step 3: Configure Tailwind**

```js
// frontend/tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 4: Replace src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary:   #0f1923;
  --bg-secondary: #1a2535;
  --bg-card:      #1e2d3d;
  --border:       #2a3f55;
  --text-primary: #e2e8f0;
  --text-muted:   #8899aa;
  --accent:       #4fc3f7;
  --profit:       #4caf50;
  --loss:         #ef5350;
}

* { box-sizing: border-box; }
body { background: var(--bg-primary); color: var(--text-primary);
       font-family: system-ui, sans-serif; margin: 0; }
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Open http://localhost:5173 — default Vite page renders.

- [ ] **Step 6: Commit**

```bash
cd .. && git add frontend/
git commit -m "feat: Vite + React + TypeScript frontend with Tailwind and API proxy"
```

---

## Task 7: Types + API Client

**Files:**
- Create: `frontend/src/types/options.ts`
- Create: `frontend/src/api/client.ts`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Create src/types/options.ts**

```typescript
export interface QuoteResponse {
  ticker: string; price: number; change_pct: number; iv: number
}
export interface OptionContract {
  strike: number; type: 'call' | 'put'
  bid: number; ask: number; mid: number; iv: number
  delta: number; gamma: number; theta: number; vega: number
  open_interest: number; volume: number
}
export interface ChainResponse {
  ticker: string; expiry: string; days_to_expiry: number
  available_expiries: string[]; underlying_price: number
  contracts: OptionContract[]
}
export interface Leg {
  type: 'call' | 'put'; strike: number; expiry: string
  direction: 'long' | 'short'; quantity: number; premium: number
}
export interface PnLPoint { price: number; pnl: number }
export interface Greeks { delta: number; gamma: number; theta: number; vega: number }
export interface AnalyseRequest {
  ticker: string; underlying_price: number; legs: Leg[]; analysis_date?: string
}
export interface AnalyseResponse {
  strategy_name: string; max_profit: number | null; max_loss: number | null
  breakeven: number[]; greeks: Greeks
  pnl_at_expiry: PnLPoint[]; pnl_today: PnLPoint[]; pnl_midpoint: PnLPoint[]
}
export interface StrategyTemplate {
  name: string; description: string
}
export interface StrategiesResponse { strategies: StrategyTemplate[] }
```

- [ ] **Step 2: Create src/api/client.ts**

```typescript
import axios from 'axios'
import { useQuery, useMutation } from '@tanstack/react-query'
import type { QuoteResponse, ChainResponse, AnalyseRequest, AnalyseResponse, StrategiesResponse } from '../types/options'

const api = axios.create({ baseURL: '/api' })

export const useQuote = (ticker: string | null) =>
  useQuery<QuoteResponse>({
    queryKey: ['quote', ticker],
    queryFn: () => api.get(`/quote/${ticker}`).then(r => r.data),
    enabled: !!ticker, retry: 2, staleTime: 30_000,
  })

export const useChain = (ticker: string | null, expiry: string | null) =>
  useQuery<ChainResponse>({
    queryKey: ['chain', ticker, expiry],
    queryFn: () => api.get(`/chain/${ticker}`, { params: expiry ? { expiry } : {} }).then(r => r.data),
    enabled: !!ticker, retry: 2, staleTime: 30_000,
  })

export const useAnalyse = () =>
  useMutation<AnalyseResponse, Error, AnalyseRequest>({
    mutationFn: (req) => api.post('/analyse', req).then(r => r.data),
  })

export const useStrategies = () =>
  useQuery<StrategiesResponse>({
    queryKey: ['strategies'],
    queryFn: () => api.get('/strategies').then(r => r.data),
    staleTime: Infinity,
  })
```

- [ ] **Step 3: Wrap in QueryClientProvider**

```tsx
// frontend/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient()
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
  </React.StrictMode>
)
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/ frontend/src/api/ frontend/src/main.tsx
git commit -m "feat: TypeScript types + TanStack Query hooks"
```

---

## Task 8: Dashboard + ChainTable

**Files:**
- Create: `frontend/src/components/Header/Header.tsx`
- Create: `frontend/src/components/ChainTable/ChainTable.tsx`
- Create: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create Header.tsx**

```tsx
// frontend/src/components/Header/Header.tsx
import { useState } from 'react'
import { useQuote } from '../../api/client'

type Tab = 'chain' | 'analyser' | 'learn'

interface Props {
  ticker: string | null
  activeTab: Tab
  onTickerChange: (t: string) => void
  onTabChange: (t: Tab) => void
}

export function Header({ ticker, activeTab, onTickerChange, onTabChange }: Props) {
  const [input, setInput] = useState('')
  const { data: quote } = useQuote(ticker)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) onTickerChange(input.trim().toUpperCase())
  }

  return (
    <header className="flex items-center gap-6 px-6 py-3 border-b"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
      <form onSubmit={submit} className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          placeholder="Ticker (e.g. AAPL)" className="px-3 py-1.5 rounded text-sm w-36"
          style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
        <button type="submit" className="px-3 py-1.5 rounded text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#000' }}>Go</button>
      </form>

      {quote && (
        <div className="flex items-center gap-4 text-sm">
          <span className="font-bold" style={{ color: 'var(--accent)' }}>{quote.ticker}</span>
          <span className="font-mono">${quote.price.toFixed(2)}</span>
          <span style={{ color: quote.change_pct >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
            {quote.change_pct >= 0 ? '+' : ''}{quote.change_pct.toFixed(2)}%
          </span>
          <span style={{ color: 'var(--text-muted)' }}>IV {(quote.iv * 100).toFixed(1)}%</span>
        </div>
      )}

      <nav className="ml-auto flex gap-1">
        {(['chain','analyser','learn'] as Tab[]).map(tab => (
          <button key={tab} onClick={() => onTabChange(tab)}
            className="px-4 py-1.5 rounded text-sm capitalize"
            style={{ background: activeTab === tab ? 'var(--accent)' : 'transparent',
                     color: activeTab === tab ? '#000' : 'var(--text-muted)' }}>
            {tab}
          </button>
        ))}
      </nav>
    </header>
  )
}
```

- [ ] **Step 2: Create ChainTable.tsx**

```tsx
// frontend/src/components/ChainTable/ChainTable.tsx
import { useChain } from '../../api/client'
import type { OptionContract } from '../../types/options'

interface Props {
  ticker: string
  expiry: string | null
  onExpiryChange: (e: string) => void
  onContractSelect: (c: OptionContract, underlyingPrice: number) => void
}

export function ChainTable({ ticker, expiry, onExpiryChange, onContractSelect }: Props) {
  const { data: chain, isLoading, error } = useChain(ticker, expiry)

  if (isLoading) return <p className="text-sm p-4" style={{ color: 'var(--text-muted)' }}>Loading chain...</p>
  if (error)     return <p className="text-sm p-4" style={{ color: 'var(--loss)' }}>Failed — is the ticker valid?</p>
  if (!chain)    return null

  const active = expiry || chain.available_expiries[0]
  const calls  = chain.contracts.filter(c => c.type === 'call')

  return (
    <div>
      <div className="flex gap-1 mb-3 flex-wrap">
        {chain.available_expiries.slice(0, 8).map(exp => (
          <button key={exp} onClick={() => onExpiryChange(exp)}
            className="text-xs px-2 py-1 rounded"
            style={{ background: exp === active ? 'var(--accent)' : 'var(--bg-card)',
                     color: exp === active ? '#000' : 'var(--text-muted)',
                     border: '1px solid var(--border)' }}>
            {exp.slice(5)}
          </button>
        ))}
      </div>

      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
        {chain.days_to_expiry} DTE · ${chain.underlying_price.toFixed(2)}
      </p>

      <table className="w-full border-collapse">
        <thead>
          <tr style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border)' }}>
            {['Strike','Bid','Ask','IV%','Δ','Θ'].map(h => (
              <th key={h} className="text-xs font-medium px-2 py-1 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calls.map(c => {
            const atm = Math.abs(c.strike - chain.underlying_price) < chain.underlying_price * 0.005
            return (
              <tr key={c.strike}
                onClick={() => onContractSelect(c, chain.underlying_price)}
                className="cursor-pointer hover:opacity-80"
                style={{ background: atm ? 'rgba(79,195,247,0.08)' : undefined,
                         borderBottom: '1px solid rgba(42,63,85,0.4)' }}>
                <td className="px-2 py-1.5 text-xs font-mono font-bold"
                  style={{ color: atm ? 'var(--accent)' : undefined }}>{c.strike}</td>
                <td className="px-2 py-1.5 text-xs font-mono">{c.bid.toFixed(2)}</td>
                <td className="px-2 py-1.5 text-xs font-mono">{c.ask.toFixed(2)}</td>
                <td className="px-2 py-1.5 text-xs font-mono">{(c.iv * 100).toFixed(1)}</td>
                <td className="px-2 py-1.5 text-xs font-mono">{c.delta.toFixed(2)}</td>
                <td className="px-2 py-1.5 text-xs font-mono" style={{ color: 'var(--loss)' }}>
                  {c.theta.toFixed(3)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Create Dashboard.tsx shell**

```tsx
// frontend/src/pages/Dashboard.tsx
import { useState } from 'react'
import { Header } from '../components/Header/Header'
import { ChainTable } from '../components/ChainTable/ChainTable'
import type { OptionContract } from '../types/options'

type Tab = 'chain' | 'analyser' | 'learn'

export function Dashboard() {
  const [ticker, setTicker]               = useState<string | null>(null)
  const [expiry, setExpiry]               = useState<string | null>(null)
  const [activeTab, setActiveTab]         = useState<Tab>('chain')
  const [contract, setContract]           = useState<OptionContract | null>(null)
  const [underlyingPrice, setUnderlying]  = useState(0)

  const handleContractSelect = (c: OptionContract, price: number) => {
    setContract(c)
    setUnderlying(price)
    setActiveTab('analyser')
  }

  return (
    <div className="flex flex-col h-screen">
      <Header ticker={ticker} activeTab={activeTab}
        onTickerChange={t => { setTicker(t); setContract(null) }}
        onTabChange={setActiveTab} />
      <main className="flex flex-1 overflow-hidden">
        <div className="w-96 border-r overflow-auto p-4" style={{ borderColor: 'var(--border)' }}>
          {ticker
            ? <ChainTable ticker={ticker} expiry={expiry}
                onExpiryChange={setExpiry} onContractSelect={handleContractSelect} />
            : <p className="text-sm mt-8 text-center" style={{ color: 'var(--text-muted)' }}>
                Enter a ticker to load the option chain.
              </p>
          }
        </div>
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'analyser' && !contract && (
            <p className="text-sm mt-8 text-center" style={{ color: 'var(--text-muted)' }}>
              Click a contract in the chain to analyse it.
            </p>
          )}
          {activeTab === 'learn' && (
            <p className="text-sm mt-8 text-center" style={{ color: 'var(--text-muted)' }}>
              Learn panel coming in next task.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Update App.tsx**

```tsx
import { Dashboard } from './pages/Dashboard'
export default function App() { return <Dashboard /> }
```

- [ ] **Step 5: Test in browser**

Start both servers (`uvicorn main:app --reload` and `npm run dev`). Search "AAPL". Verify chain table loads with expiry buttons and ATM highlighting.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: Dashboard shell, Header, and ChainTable with live option chain"
```

---

## Task 9: Analysis Panel — PnL Chart + Greeks

**Files:**
- Create: `frontend/src/components/PnLChart/PnLChart.tsx`
- Create: `frontend/src/components/GreeksPanel/GreeksPanel.tsx`
- Create: `frontend/src/components/TimeframeSlider/TimeframeSlider.tsx`
- Modify: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Create PnLChart.tsx**

```tsx
// frontend/src/components/PnLChart/PnLChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
         ReferenceLine, ResponsiveContainer, Legend } from 'recharts'
import type { PnLPoint } from '../../types/options'

interface Props {
  pnlAtExpiry: PnLPoint[]; pnlToday: PnLPoint[]; pnlMidpoint: PnLPoint[]
  breakevens: number[]; underlyingPrice: number
}

export function PnLChart({ pnlAtExpiry, pnlToday, pnlMidpoint, breakevens, underlyingPrice }: Props) {
  const todayMap = new Map(pnlToday.map(p => [p.price, p.pnl]))
  const midMap   = new Map(pnlMidpoint.map(p => [p.price, p.pnl]))
  const data     = pnlAtExpiry.map(p => ({
    price: p.price, 'At Expiry': p.pnl,
    'Today': todayMap.get(p.price) ?? null,
    'Midpoint': midMap.get(p.price) ?? null,
  }))
  const all = [...pnlAtExpiry, ...pnlToday, ...pnlMidpoint].map(p => p.pnl)
  const pad = (Math.max(...all) - Math.min(...all)) * 0.15

  return (
    <div className="p-4 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--accent)' }}>P&L Chart</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,63,85,0.6)" />
          <XAxis dataKey="price" tick={{ fontSize: 10, fill: '#8899aa' }} tickFormatter={v => `$${v}`} />
          <YAxis tick={{ fontSize: 10, fill: '#8899aa' }} tickFormatter={v => `$${v}`}
                 domain={[Math.min(...all) - pad, Math.max(...all) + pad]} />
          <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4 }}
                   labelFormatter={v => `Price: $${v}`} formatter={(v: number) => [`$${v?.toFixed(2)}`, '']} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 2" />
          <ReferenceLine x={underlyingPrice} stroke="rgba(79,195,247,0.35)" strokeDasharray="4 2" />
          {breakevens.map(be => (
            <ReferenceLine key={be} x={be} stroke="rgba(255,193,7,0.5)" strokeDasharray="4 2"
              label={{ value: `BE $${be}`, fill: '#ffc107', fontSize: 10 }} />
          ))}
          <Line type="monotone" dataKey="At Expiry" stroke="#4caf50" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="Today"     stroke="#4fc3f7" dot={false} strokeWidth={1.5} strokeDasharray="5 3" />
          <Line type="monotone" dataKey="Midpoint"  stroke="#ff9800" dot={false} strokeWidth={1.5} strokeDasharray="5 3" />
          <Legend wrapperStyle={{ fontSize: 10 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Create GreeksPanel.tsx**

```tsx
// frontend/src/components/GreeksPanel/GreeksPanel.tsx
import type { AnalyseResponse } from '../../types/options'

function Tile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded"
      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-mono font-bold" style={{ color: color || 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

export function GreeksPanel({ analysis }: { analysis: AnalyseResponse }) {
  const { greeks, strategy_name, max_profit, max_loss, breakeven } = analysis
  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{strategy_name}</p>
      <div className="grid grid-cols-4 gap-2">
        <Tile label="Delta Δ"  value={greeks.delta.toFixed(3)} />
        <Tile label="Gamma Γ"  value={greeks.gamma.toFixed(4)} />
        <Tile label="Theta Θ"  value={greeks.theta.toFixed(3)} color="var(--loss)" />
        <Tile label="Vega ν"   value={greeks.vega.toFixed(3)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Tile label="Max Profit" value={max_profit !== null ? `$${max_profit.toFixed(0)}` : '∞'} color="var(--profit)" />
        <Tile label="Max Loss"   value={max_loss   !== null ? `$${Math.abs(max_loss).toFixed(0)}` : '∞'} color="var(--loss)" />
        <Tile label="Breakeven"  value={breakeven.length ? `$${breakeven[0].toFixed(2)}` : '—'} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create TimeframeSlider.tsx**

```tsx
// frontend/src/components/TimeframeSlider/TimeframeSlider.tsx
interface Props { expiry: string; analysisDate: string; onChange: (d: string) => void }

export function TimeframeSlider({ expiry, analysisDate, onChange }: Props) {
  const today     = new Date().toISOString().split('T')[0]
  const totalDays = Math.max(Math.ceil((+new Date(expiry) - +new Date(today)) / 86400000), 1)
  const current   = Math.max(Math.ceil((+new Date(analysisDate) - +new Date(today)) / 86400000), 0)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = new Date(today)
    d.setDate(d.getDate() + parseInt(e.target.value))
    onChange(d.toISOString().split('T')[0])
  }

  return (
    <div className="mt-3 p-3 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
        <span>Today</span>
        <span style={{ color: 'var(--accent)' }}>{analysisDate}</span>
        <span>Expiry {expiry}</span>
      </div>
      <input type="range" min={0} max={totalDays} value={current} onChange={handleChange}
        className="w-full" style={{ accentColor: 'var(--accent)' }} />
    </div>
  )
}
```

- [ ] **Step 4: Wire analysis panel into Dashboard.tsx**

```tsx
// frontend/src/pages/Dashboard.tsx
import { useState } from 'react'
import { Header } from '../components/Header/Header'
import { ChainTable } from '../components/ChainTable/ChainTable'
import { PnLChart } from '../components/PnLChart/PnLChart'
import { GreeksPanel } from '../components/GreeksPanel/GreeksPanel'
import { TimeframeSlider } from '../components/TimeframeSlider/TimeframeSlider'
import { useAnalyse } from '../api/client'
import type { OptionContract } from '../types/options'

type Tab = 'chain' | 'analyser' | 'learn'

export function Dashboard() {
  const [ticker, setTicker]              = useState<string | null>(null)
  const [expiry, setExpiry]              = useState<string | null>(null)
  const [activeTab, setActiveTab]        = useState<Tab>('chain')
  const [contract, setContract]          = useState<OptionContract | null>(null)
  const [underlyingPrice, setUnderlying] = useState(0)
  const [analysisDate, setAnalysisDate]  = useState(new Date().toISOString().split('T')[0])

  const { mutate: analyse, data: analysis, isPending } = useAnalyse()

  const runAnalysis = (c: OptionContract, price: number, date?: string) => {
    if (!ticker || !expiry) return
    analyse({
      ticker,
      underlying_price: price,
      legs: [{ type: c.type, strike: c.strike, expiry,
               direction: 'long', quantity: 1, premium: c.mid }],
      analysis_date: date,
    })
  }

  const handleContractSelect = (c: OptionContract, price: number) => {
    setContract(c); setUnderlying(price); setActiveTab('analyser')
    runAnalysis(c, price)
  }

  const handleDateChange = (date: string) => {
    setAnalysisDate(date)
    if (contract) runAnalysis(contract, underlyingPrice, date)
  }

  return (
    <div className="flex flex-col h-screen">
      <Header ticker={ticker} activeTab={activeTab}
        onTickerChange={t => { setTicker(t); setContract(null) }}
        onTabChange={setActiveTab} />
      <main className="flex flex-1 overflow-hidden">
        <div className="w-96 border-r overflow-auto p-4" style={{ borderColor: 'var(--border)' }}>
          {ticker
            ? <ChainTable ticker={ticker} expiry={expiry} onExpiryChange={setExpiry}
                onContractSelect={handleContractSelect} />
            : <p className="text-sm mt-8 text-center" style={{ color: 'var(--text-muted)' }}>
                Enter a ticker to load the option chain.
              </p>
          }
        </div>
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'analyser' && (
            <>
              {isPending && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Analysing...</p>}
              {analysis && !isPending && (
                <>
                  <PnLChart pnlAtExpiry={analysis.pnl_at_expiry} pnlToday={analysis.pnl_today}
                    pnlMidpoint={analysis.pnl_midpoint} breakevens={analysis.breakeven}
                    underlyingPrice={underlyingPrice} />
                  <GreeksPanel analysis={analysis} />
                  {contract && expiry && (
                    <TimeframeSlider expiry={expiry} analysisDate={analysisDate} onChange={handleDateChange} />
                  )}
                </>
              )}
              {!analysis && !isPending && (
                <p className="text-sm mt-8 text-center" style={{ color: 'var(--text-muted)' }}>
                  Click a contract in the chain to analyse it.
                </p>
              )}
            </>
          )}
          {activeTab === 'learn' && (
            <p className="text-sm mt-8 text-center" style={{ color: 'var(--text-muted)' }}>
              Learn panel — next task.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 5: Test in browser**

1. Search "AAPL" → chain loads
2. Click any call → switches to Analyser, P&L chart renders with 3 lines
3. Greeks panel shows Δ/Θ/Γ/ν + max profit/loss
4. Drag timeframe slider → chart re-renders

- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: P&L chart, Greeks panel, timeframe slider — core analysis panel complete"
```

---

## Task 10: StrategySelector + LearnPanel

**Files:**
- Create: `frontend/src/components/StrategySelector/StrategySelector.tsx`
- Create: `frontend/src/components/LearnPanel/LearnPanel.tsx`
- Modify: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Create StrategySelector.tsx**

```tsx
// frontend/src/components/StrategySelector/StrategySelector.tsx
import { useStrategies } from '../../api/client'

interface Props { selected: string; onChange: (name: string) => void }

export function StrategySelector({ selected, onChange }: Props) {
  const { data } = useStrategies()
  const description = data?.strategies.find(s => s.name === selected)?.description

  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Strategy</span>
        <select value={selected} onChange={e => onChange(e.target.value)}
          className="text-xs px-2 py-1 rounded"
          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
          {data?.strategies.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
      </div>
      {description && (
        <p className="text-xs mt-0.5 flex-1" style={{ color: 'var(--text-muted)' }}>{description}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create LearnPanel.tsx**

```tsx
// frontend/src/components/LearnPanel/LearnPanel.tsx
import type { AnalyseResponse } from '../../types/options'

const LESSONS = [
  { title: 'What is a Call Option?',
    body: 'A call gives you the right to BUY 100 shares at the strike price before expiry. You profit when the stock rises above your breakeven (strike + premium paid). Your loss is limited to the premium.',
    liveKey: 'breakeven' },
  { title: 'What is Delta (Δ)?',
    body: 'Delta = how much the option price moves per $1 move in the stock. Delta 0.45 means you gain ~$45 if the stock rises $1. ATM calls have delta ~0.50. Deep ITM calls have delta near 1.0.',
    liveKey: 'delta' },
  { title: 'What is Theta (Θ)?',
    body: 'Theta = daily cost of holding an option. Theta -0.05 means you lose ~$5/day just from time passing, even if the stock doesn\'t move. This is "time decay" — why buyers dislike holding through weekends.',
    liveKey: 'theta' },
  { title: 'What is Implied Volatility (IV)?',
    body: 'IV is the market\'s expectation of future price movement, baked into the option price. High IV = expensive options. When IV drops after you buy (IV crush), your option loses value even if the stock is flat.',
    liveKey: 'iv' },
  { title: 'Max Profit & Max Loss',
    body: 'For a long call: max loss = premium paid × 100 (the flat bottom of the P&L chart). Max profit = unlimited — the stock can keep rising. The green line on the chart shows profit at expiry.',
    liveKey: 'maxloss' },
]

export function LearnPanel({ analysis }: { analysis?: AnalyseResponse }) {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h2 className="text-base font-bold" style={{ color: 'var(--accent)' }}>Options Fundamentals</h2>
      {LESSONS.map(lesson => (
        <div key={lesson.title} className="p-4 rounded"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold mb-1">{lesson.title}</h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{lesson.body}</p>
          {analysis && lesson.liveKey === 'delta' && (
            <p className="text-xs mt-2" style={{ color: 'var(--accent)' }}>
              Your position delta: <strong>{analysis.greeks.delta.toFixed(3)}</strong>
            </p>
          )}
          {analysis && lesson.liveKey === 'theta' && (
            <p className="text-xs mt-2" style={{ color: 'var(--loss)' }}>
              Your daily theta: <strong>{analysis.greeks.theta.toFixed(3)}</strong> (${(analysis.greeks.theta * 100).toFixed(2)}/day per contract)
            </p>
          )}
          {analysis && lesson.liveKey === 'breakeven' && analysis.breakeven.length > 0 && (
            <p className="text-xs mt-2" style={{ color: 'var(--profit)' }}>
              Your breakeven: <strong>${analysis.breakeven[0].toFixed(2)}</strong>
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Add StrategySelector + LearnPanel to Dashboard.tsx**

In `Dashboard.tsx`, add these two imports:
```tsx
import { StrategySelector } from '../components/StrategySelector/StrategySelector'
import { LearnPanel } from '../components/LearnPanel/LearnPanel'
```

Add `strategy` state:
```tsx
const [strategy, setStrategy] = useState('Long Call')
```

Inside `activeTab === 'analyser'`, above `<PnLChart`, add:
```tsx
<StrategySelector selected={strategy} onChange={setStrategy} />
```

Replace the `activeTab === 'learn'` placeholder with:
```tsx
{activeTab === 'learn' && <LearnPanel analysis={analysis} />}
```

- [ ] **Step 4: Final integration test**

With both servers running:
1. Search "AAPL" → chain loads
2. Click a call → switches to Analyser, full analysis renders
3. Strategy dropdown shows "Long Call", "Long Put", etc.
4. Click "Learn" tab → lessons show with live values if a contract is selected
5. Drag timeframe slider → chart updates
6. Search a different ticker → chain resets cleanly

- [ ] **Step 5: Final commit**

```bash
git add frontend/src/
git commit -m "feat: StrategySelector and LearnPanel — V1 complete"
```

---

## Running the App

```bash
# Terminal 1 — backend
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open http://localhost:5173
