# Options Analyser — Design Spec
**Date:** 2026-05-30  
**Status:** Approved  
**Scope:** V1 single-user prototype (FastAPI + React). Go rewrite planned after validation.

---

## 1. Goals

Build a personal options risk/reward analyser with two parallel purposes:
1. **Learning** — interactively understand how options work (Greeks, strategies, time decay) using real market data
2. **Tool** — analyse real option chains, model strategy P&L across timeframes, make informed trading decisions

---

## 2. Architecture

```
┌─────────────────────────────┐
│   React + TypeScript (Vite) │  ← Frontend
│   Recharts, TanStack Query  │
└──────────────┬──────────────┘
               │ REST/JSON
┌──────────────▼──────────────┐
│   Python FastAPI + Pydantic │  ← API (prototype; Go rewrite after validation)
│   Strict typed schemas      │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│   DataProvider (Protocol)   │  ← Abstraction layer
│   YFinanceProvider (V1)     │
│   IBKRProvider (future)     │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│   yfinance                  │  ← Market data (free, no auth)
│   py_vollib / scipy         │  ← Black-Scholes, Greeks math
└─────────────────────────────┘
```

### Key architectural decisions

- **DataProvider protocol**: A Python `Protocol` class with `get_chain(ticker)` and `get_quote(ticker)` methods. `YFinanceProvider` implements it now; `IBKRProvider` will slot in without changing any other code.
- **FastAPI → Go migration path**: Every endpoint has an explicit Pydantic request/response model. These models are the contract — the Go rewrite is a mechanical translation of these schemas into Go structs.
- **Math stays in Python**: Black-Scholes and Greeks calculations use `py_vollib`. This library is not available in Go; the Python math service will remain as a sidecar if needed during the Go migration.

---

## 3. Project Structure

```
options_analyser/
├── backend/
│   ├── main.py                   # FastAPI app, route registration
│   ├── api/
│   │   ├── routes/
│   │   │   ├── chain.py          # GET /api/chain/{ticker}
│   │   │   ├── quote.py          # GET /api/quote/{ticker}
│   │   │   ├── analyse.py        # POST /api/analyse
│   │   │   └── strategy.py       # POST /api/strategy, GET /api/strategies
│   │   └── schemas/
│   │       ├── chain.py          # ChainResponse, OptionContract
│   │       ├── quote.py          # QuoteResponse
│   │       ├── analyse.py        # AnalyseRequest, AnalyseResponse, PnLPoint
│   │       └── strategy.py       # StrategyRequest, StrategyResponse, Leg
│   ├── providers/
│   │   ├── base.py               # DataProvider Protocol
│   │   ├── yfinance_provider.py  # YFinanceProvider
│   │   └── ibkr_provider.py      # IBKRProvider (stub, future)
│   ├── math/
│   │   ├── black_scholes.py      # BS pricing, Greeks
│   │   ├── pnl.py                # P&L curve generation across strikes/dates
│   │   └── strategies.py         # Strategy leg definitions and aggregation
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChainTable/       # Option chain table with sortable columns
│   │   │   ├── PnLChart/         # Recharts P&L curve + breakeven lines
│   │   │   ├── GreeksPanel/      # Delta, Theta, Vega, IV display
│   │   │   ├── TimeframeSlider/  # Date slider: today → expiry
│   │   │   ├── StrategySelector/ # Dropdown to pick/build strategy
│   │   │   └── LearnPanel/       # Interactive educational explainers
│   │   ├── pages/
│   │   │   └── Dashboard.tsx     # Main layout: chain left, analysis right
│   │   ├── api/
│   │   │   └── client.ts         # TanStack Query hooks, typed API calls
│   │   └── types/
│   │       └── options.ts        # TypeScript mirrors of Pydantic schemas
│   ├── package.json
│   └── vite.config.ts
└── docs/
    └── superpowers/specs/
        └── 2026-05-30-options-analyser-design.md
```

---

## 4. API Contract

These endpoints define the interface that the Go rewrite will implement exactly.

### `GET /api/quote/{ticker}`
```json
// Response: QuoteResponse
{
  "ticker": "AAPL",
  "price": 189.50,
  "change_pct": 1.2,
  "iv_rank": 42.5,       // implied volatility rank 0-100
  "iv_percentile": 38.0
}
```

### `GET /api/chain/{ticker}?expiry=2026-06-20`
```json
// Response: ChainResponse
{
  "ticker": "AAPL",
  "expiry": "2026-06-20",
  "days_to_expiry": 21,
  "available_expiries": ["2026-06-06", "2026-06-20", "2026-07-18"],
  "contracts": [
    {
      "strike": 190.0,
      "type": "call",
      "bid": 1.40,
      "ask": 1.50,
      "mid": 1.45,
      "iv": 0.26,
      "delta": 0.45,
      "gamma": 0.08,
      "theta": -0.05,
      "vega": 0.12,
      "open_interest": 8420,
      "volume": 1230
    }
  ]
}
```

### `POST /api/analyse`
```json
// Request: AnalyseRequest
{
  "ticker": "AAPL",
  "underlying_price": 189.50,
  "legs": [
    { "type": "call", "strike": 190.0, "expiry": "2026-06-20", "direction": "long", "quantity": 1, "premium": 1.45 }
  ],
  "analysis_date": "2026-05-30"   // optional, defaults to today
}

// Response: AnalyseResponse
{
  "strategy_name": "Long Call",
  "max_profit": null,             // null = unlimited
  "max_loss": 145.0,              // premium paid × 100
  "breakeven": [191.45],
  "greeks": { "delta": 0.45, "theta": -0.05, "vega": 0.12, "gamma": 0.08 },
  "pnl_at_expiry": [
    { "price": 180.0, "pnl": -145.0 },
    { "price": 190.0, "pnl": -145.0 },
    { "price": 191.45, "pnl": 0.0 },
    { "price": 200.0, "pnl": 855.0 }
  ],
  "pnl_today": [                  // same [{price, pnl}] structure, valued as of today
    { "price": 180.0, "pnl": -145.0 },
    { "price": 190.0, "pnl": -62.0 },
    { "price": 200.0, "pnl": 580.0 }
  ],
  "pnl_midpoint": [               // same structure, valued at halfway to expiry
    { "price": 180.0, "pnl": -145.0 },
    { "price": 190.0, "pnl": -95.0 },
    { "price": 200.0, "pnl": 710.0 }
  ]
}
```

### `GET /api/strategies`
Returns list of supported strategy templates with their leg structures (used by StrategySelector to auto-populate legs).

---

## 5. Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 [Ticker Search]   AAPL $189.50 +1.2%   IV Rank: 42      │
├─────────────────────┬───────────────────────────────────────┤
│  OPTION CHAIN       │  P&L CHART                            │
│  Expiry: [Jun 20 ▼] │  ┌─────────────────────────────────┐ │
│                     │  │  ╱──────────────── at expiry    │ │
│  Strike Call  Put   │  │ ╱   ·  ·  today                 │ │
│  185   3.20   0.80  │  │────────────────────── breakeven  │ │
│  190 → 1.45   1.90  │  └─────────────────────────────────┘ │
│  195   0.60   3.10  │                                       │
│                     │  GREEKS           SUMMARY             │
│  [Calls] [Puts]     │  Δ  0.45          Max Loss:  -$145   │
│  [Straddle view]    │  Θ -0.05          Max Profit: ∞      │
│                     │  IV  26%          Breakeven: $191.45 │
│                     │  Vega 0.12                            │
│                     │  ───────────────────────────────────  │
│                     │  Timeframe: Today ────●──── Expiry    │
│                     │  [Strategy: Long Call ▼]              │
└─────────────────────┴───────────────────────────────────────┘

[Chain]  [Analyser]  [Learn]    ← Tab bar at top
```

- Clicking any row in the chain table sends that contract to the right panel
- Dragging the timeframe slider rerenders the P&L chart for that date
- Strategy dropdown auto-populates multi-leg positions (e.g. "Iron Condor" adds 4 legs)

---

## 6. Strategy Support — Phased

### Phase 1 (V1)
| Strategy | Legs | Max Profit | Max Loss |
|---|---|---|---|
| Long Call | 1 long call | Unlimited | Premium paid |
| Long Put | 1 long put | Strike - premium | Premium paid |
| Covered Call | Long 100 shares + 1 short call | Strike - cost basis | Cost basis - premium |
| Cash-Secured Put | 1 short put | Premium received | Strike - premium |

### Phase 2
Bull Call Spread, Bear Put Spread, Bull Put Spread, Bear Call Spread

### Phase 3
Straddle, Strangle, Iron Condor, Iron Butterfly, Calendar Spread

Each strategy is defined as a configuration object specifying legs. The same P&L engine handles all phases — adding a new strategy is adding a new config, not new math.

---

## 7. Learn Tab

Interactive, not static. Each concept is explained with a live chart tied to the currently selected position:

| Lesson | Interactive element |
|---|---|
| What is a Call / Put? | Drag underlying price → watch P&L update |
| What is Delta? | Delta gauge updates as you drag price |
| What is Theta? | Timeframe slider shows P&L erode day-by-day |
| What is IV? | IV slider shows how premium expands/contracts |
| How to read a chain | Annotated chain table with tooltips |
| Breakeven explained | Highlighted point on P&L chart |
| Max profit / Max loss | Annotated regions on chart |

Lessons are ordered from simplest to most complex. Each lesson links to the live Analyser view.

---

## 8. Data Flow

```
User searches "AAPL"
  → GET /api/quote/AAPL             → display price, IV rank
  → GET /api/chain/AAPL?expiry=...  → render chain table

User clicks strike 190 Call
  → POST /api/analyse (Long Call, strike 190)
  → render P&L chart, Greeks panel, summary

User drags timeframe slider to date D
  → POST /api/analyse with analysis_date = D
  → backend recalculates P&L curves for that date, returns updated response
  → frontend rerenders chart (no local math — all calculations stay on backend)

User selects "Iron Condor" from strategy dropdown
  → auto-populate 4 legs (2 calls, 2 puts)
  → POST /api/analyse with all 4 legs
```

---

## 9. Error Handling

- **No data for ticker**: friendly message "No options data available for this ticker"
- **Market closed / stale data**: show last-updated timestamp on chain table
- **API timeout**: TanStack Query retry × 2, then show error with retry button
- **Invalid strategy legs**: backend returns `422` with field-level validation errors; frontend highlights the offending leg

---

## 10. Future / Out of Scope for V1

- Multi-user accounts, auth, saved portfolios
- IBKR live trading integration (data only via IBKRProvider stub)
- Go backend rewrite (planned after V1 validation)
- Backtesting strategies against historical data
- Real-time streaming quotes (websocket)
- Mobile layout
