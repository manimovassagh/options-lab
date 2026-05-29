import { useState } from 'react'
import { Header } from '../components/Header/Header'
import { ChainTable } from '../components/ChainTable/ChainTable'
import type { OptionContract } from '../types/options'

type Tab = 'chain' | 'analyser' | 'learn'

export function Dashboard() {
  const [ticker, setTicker]               = useState<string | null>(null)
  const [expiry, setExpiry]               = useState<string | null>(null)
  const [activeTab, setActiveTab]         = useState<Tab>('chain')
  const [contract, setContract]               = useState<OptionContract | null>(null)
  const [_underlyingPrice, setUnderlying]     = useState(0)

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
              Learn panel coming soon.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
