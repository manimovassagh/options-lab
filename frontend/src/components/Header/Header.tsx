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
  const { data: quote, isFetching } = useQuote(ticker)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) onTickerChange(input.trim().toUpperCase())
  }

  return (
    <header style={{
      background: 'linear-gradient(180deg, #0d1520 0%, #070d14 100%)',
      borderBottom: '1px solid var(--border)',
    }}>
      {/* Top bar */}
      <div className="flex items-center gap-4 px-5 py-2.5">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, #00d4ff, #0070ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 10px var(--accent-glow)',
            fontSize: 13, fontWeight: 800, color: '#000'
          }}>O</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.05em' }}>
            OPTIONS<span style={{ color: 'var(--text-muted)' }}>LAB</span>
          </span>
        </div>

        {/* Search */}
        <form onSubmit={submit} className="flex items-center gap-2">
          <div style={{ position: 'relative' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              placeholder="Symbol"
              maxLength={8}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-bright)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.08em',
                padding: '5px 10px',
                width: 100,
                outline: 'none',
              }}
            />
          </div>
          <button type="submit" style={{
            background: 'var(--accent)',
            color: '#000',
            border: 'none',
            borderRadius: 6,
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 8px var(--accent-glow)',
          }}>GO</button>
        </form>

        {/* Quote */}
        {quote && (
          <div className="flex items-center gap-5 ml-2">
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.04em' }}>
              {quote.ticker}
            </span>
            <span style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              ${quote.price.toFixed(2)}
            </span>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: quote.change_pct >= 0 ? 'var(--profit)' : 'var(--loss)',
              background: quote.change_pct >= 0 ? 'var(--profit-dim)' : 'var(--loss-dim)',
              padding: '2px 8px', borderRadius: 4,
            }}>
              {quote.change_pct >= 0 ? '▲' : '▼'} {Math.abs(quote.change_pct).toFixed(2)}%
            </span>
            <div className="flex items-center gap-1" style={{ fontSize: 11 }}>
              <span style={{ color: 'var(--text-muted)' }}>IV</span>
              <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{(quote.iv * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}
        {isFetching && !quote && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading…</span>
        )}

        {/* Tabs */}
        <nav className="ml-auto flex gap-1">
          {(['chain', 'analyser', 'learn'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => onTabChange(tab)} style={{
              background: activeTab === tab ? 'var(--accent-dim)' : 'transparent',
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
              border: activeTab === tab ? '1px solid var(--accent-glow)' : '1px solid transparent',
              borderRadius: 6,
              padding: '5px 16px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              transition: 'all 0.15s',
            }}>
              {tab}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
