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
