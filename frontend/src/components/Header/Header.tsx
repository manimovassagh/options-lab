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
  const [input, setInput] = useState(ticker || '')
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
