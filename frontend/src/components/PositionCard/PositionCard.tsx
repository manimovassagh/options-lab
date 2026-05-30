import type { OptionContract } from '../../types/options'

interface Props {
  contract: OptionContract
  ticker: string
  expiry: string
  underlyingPrice: number
}

export function PositionCard({ contract, ticker, expiry, underlyingPrice }: Props) {
  const isCall = contract.type === 'call'
  const color = isCall ? 'var(--call-color)' : 'var(--put-color)'
  const colorRgb = isCall ? '0,180,216' : '247,37,133'
  const itm = isCall ? contract.strike < underlyingPrice : contract.strike > underlyingPrice
  const spreadPct = contract.mid > 0 ? ((contract.ask - contract.bid) / contract.mid * 100) : 0
  const probItm = Math.abs(contract.delta) * 100
  const costBasis = contract.mid * 100
  const dollarTheta = Math.abs(contract.theta) * 100

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid rgba(${colorRgb},0.22)`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10,
      padding: '12px 14px',
      marginBottom: 12,
      boxShadow: `0 0 20px rgba(${colorRgb},0.06), inset 0 1px 0 rgba(255,255,255,0.03)`,
    }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{
            fontSize: 10, fontWeight: 900,
            color: isCall ? '#001a24' : '#fff',
            background: color,
            padding: '2px 8px', borderRadius: 4,
            letterSpacing: '0.08em',
            boxShadow: `0 0 8px rgba(${colorRgb},0.4)`,
          }}>
            {contract.type.toUpperCase()}
          </span>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {ticker} ${contract.strike}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: itm ? (isCall ? '#001a24' : '#fff') : 'var(--text-muted)',
            background: itm ? color : 'var(--border)',
            padding: '1px 5px', borderRadius: 3,
          }}>
            {itm ? 'ITM' : 'OTM'}
          </span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          Exp <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{expiry}</span>
        </div>
      </div>

      {/* Price row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 8 }}>
        {([
          { label: 'Mid', value: `$${contract.mid.toFixed(2)}`, large: true, c: 'var(--text-primary)' },
          { label: 'Bid', value: `$${contract.bid.toFixed(2)}`, c: 'var(--text-secondary)' },
          { label: 'Ask', value: `$${contract.ask.toFixed(2)}`, c: 'var(--text-secondary)' },
          { label: 'IV', value: `${(contract.iv * 100).toFixed(1)}%`, c: 'var(--warning)' },
          { label: 'Spread', value: `${spreadPct.toFixed(1)}%`, c: spreadPct > 15 ? 'var(--loss)' : 'var(--text-muted)' },
        ] as const).map(({ label, value, large, c }) => (
          <div key={label}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: (large as boolean) ? 15 : 12, fontWeight: (large as boolean) ? 800 : 600, color: c as string, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Greeks + metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        {[
          { label: 'Δ Delta', value: contract.delta.toFixed(3), c: '#00d4ff' },
          { label: 'Γ Gamma', value: contract.gamma.toFixed(4), c: '#a78bfa' },
          { label: 'Θ /day', value: `-$${dollarTheta.toFixed(2)}`, c: '#ff3d5a' },
          { label: 'Cost', value: `$${costBasis.toFixed(0)}`, c: 'var(--text-secondary)' },
          { label: 'P(ITM)', value: `${probItm.toFixed(0)}%`, c: probItm > 50 ? 'var(--profit)' : 'var(--text-secondary)' },
        ].map(({ label, value, c }) => (
          <div key={label}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: c, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
