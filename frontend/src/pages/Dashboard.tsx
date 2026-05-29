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
