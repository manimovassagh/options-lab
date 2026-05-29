import { useState, useEffect, useRef } from 'react'
import { Header } from '../components/Header/Header'
import { ChainTable } from '../components/ChainTable/ChainTable'
import { PnLChart } from '../components/PnLChart/PnLChart'
import { GreeksPanel } from '../components/GreeksPanel/GreeksPanel'
import { TimeframeSlider } from '../components/TimeframeSlider/TimeframeSlider'
import { StrategySelector } from '../components/StrategySelector/StrategySelector'
import { LearnPanel } from '../components/LearnPanel/LearnPanel'
import { useChain, useAnalyse } from '../api/client'
import type { OptionContract } from '../types/options'

type Tab = 'chain' | 'analyser' | 'learn'

export function Dashboard() {
  const [ticker, setTicker]              = useState<string | null>('AAPL')
  const [expiry, setExpiry]              = useState<string | null>(null)
  const [activeTab, setActiveTab]        = useState<Tab>('analyser')
  const [contract, setContract]          = useState<OptionContract | null>(null)
  const [strategy, setStrategy]          = useState('Long Call')
  const [underlyingPrice, setUnderlying] = useState(0)
  const [analysisDate, setAnalysisDate]  = useState(new Date().toISOString().split('T')[0])

  const { mutate: analyse, data: analysis, isPending } = useAnalyse()
  const { data: chain } = useChain(ticker, expiry)

  // Auto-select ATM call on first chain load for a given ticker
  const autoSelectedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!chain || !ticker || autoSelectedFor.current === ticker) return
    const calls = chain.contracts.filter(c => c.type === 'call')
    if (calls.length === 0) return
    const atm = calls.reduce((best, c) =>
      Math.abs(c.strike - chain.underlying_price) < Math.abs(best.strike - chain.underlying_price) ? c : best
    )
    autoSelectedFor.current = ticker
    setExpiry(chain.expiry)
    setContract(atm)
    setUnderlying(chain.underlying_price)
    setActiveTab('analyser')
    analyse({
      ticker,
      underlying_price: chain.underlying_price,
      legs: [{ type: atm.type, strike: atm.strike, expiry: chain.expiry,
               direction: 'long', quantity: 1, premium: atm.mid }],
    })
  }, [chain, ticker, analyse])

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

  const handleTickerChange = (t: string) => {
    setTicker(t)
    setContract(null)
    setExpiry(null)
    autoSelectedFor.current = null
  }

  const handleDateChange = (date: string) => {
    setAnalysisDate(date)
    if (contract) runAnalysis(contract, underlyingPrice, date)
  }

  return (
    <div className="flex flex-col h-screen">
      <Header ticker={ticker} activeTab={activeTab}
        onTickerChange={handleTickerChange}
        onTabChange={setActiveTab} />
      <main className="flex flex-1 overflow-hidden">
        <div style={{ width: 520, borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '12px 10px' }}>
          {ticker
            ? <ChainTable ticker={ticker} expiry={expiry} onExpiryChange={setExpiry}
                onContractSelect={handleContractSelect} />
            : <p className="text-sm mt-8 text-center" style={{ color: 'var(--text-muted)' }}>
                Enter a ticker to load the option chain.
              </p>
          }
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {activeTab === 'analyser' && (
            <>
              <StrategySelector selected={strategy} onChange={setStrategy} />
              {isPending && (
                <p className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>Loading analysis...</p>
              )}
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
                  Loading…
                </p>
              )}
            </>
          )}
          {activeTab === 'chain' && !ticker && (
            <p className="text-sm mt-8 text-center" style={{ color: 'var(--text-muted)' }}>
              Enter a ticker to load the option chain.
            </p>
          )}
          {activeTab === 'learn' && <LearnPanel analysis={analysis ?? undefined} />}
        </div>
      </main>
    </div>
  )
}
