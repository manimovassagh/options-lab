import type { AnalyseResponse } from '../../types/options'

function GreekBar({ label, value, min, max, color, format }: {
  label: string; value: number; min: number; max: number; color: string; format: (v: number) => string
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  return (
    <div style={{ padding: '9px 12px', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{format(value)}</span>
      </div>
      <div style={{ height: 3, background: 'var(--border-bright)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s ease', boxShadow: `0 0 6px ${color}66` }} />
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color, accent }: {
  label: string; value: string; sub?: string; color?: string; accent?: string
}) {
  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--bg-primary)',
      borderRadius: 8,
      border: '1px solid var(--border)',
      borderLeft: accent ? `3px solid ${accent}` : undefined,
    }}>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: color || 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function ProbGauge({ prob }: { prob: number }) {
  const pct = Math.round(prob)
  const color = pct > 60 ? 'var(--profit)' : pct > 40 ? 'var(--warning)' : 'var(--loss)'
  const circumference = 2 * Math.PI * 20
  const offset = circumference - (pct / 100) * circumference

  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--bg-primary)',
      borderRadius: 8,
      border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <svg width={44} height={44} viewBox="0 0 44 44">
        <circle cx={22} cy={22} r={20} fill="none" stroke="var(--border-bright)" strokeWidth={3} />
        <circle
          cx={22} cy={22} r={20}
          fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 22 22)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text x={22} y={26} textAnchor="middle" fontSize={10} fontWeight={800} fill={color}>{pct}%</text>
      </svg>
      <div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Prob ITM</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {pct > 50 ? 'Likely profit at expiry' : pct > 35 ? 'Moderate probability' : 'Low probability'}
        </div>
      </div>
    </div>
  )
}

export function GreeksPanel({ analysis }: { analysis: AnalyseResponse }) {
  const { greeks, strategy_name, max_profit, max_loss, breakeven } = analysis
  const rr = max_loss && max_profit ? Math.abs(max_profit / max_loss) : null
  const probItm = Math.abs(greeks.delta) * 100
  const dollarTheta = Math.abs(greeks.theta) * 100

  return (
    <div style={{ marginTop: 12 }}>
      {/* Strategy badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        padding: '8px 14px',
        background: 'var(--accent-dim)',
        borderRadius: 8,
        border: '1px solid var(--accent-glow)',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.04em' }}>{strategy_name}</span>
        {rr && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
            R/R <span style={{ color: rr >= 2 ? 'var(--profit)' : 'var(--warning)' }}>{rr.toFixed(1)}x</span>
          </span>
        )}
      </div>

      {/* Greeks gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 9 }}>
        <GreekBar label="Delta Δ" value={greeks.delta} min={-1} max={1}
          color="#00d4ff" format={v => v.toFixed(3)} />
        <GreekBar label="Gamma Γ" value={greeks.gamma} min={0} max={0.15}
          color="#a78bfa" format={v => v.toFixed(4)} />
        <GreekBar label="Theta Θ / day" value={Math.abs(greeks.theta)} min={0} max={2}
          color="#ff3d5a" format={v => `-${v.toFixed(3)}`} />
        <GreekBar label="Vega ν / 1%" value={greeks.vega} min={0} max={0.5}
          color="#fbbf24" format={v => v.toFixed(3)} />
      </div>

      {/* Prob ITM gauge */}
      <ProbGauge prob={probItm} />

      {/* Risk metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginTop: 9 }}>
        <StatCard label="Max Profit" accent="var(--profit)" color="var(--profit)"
          value={max_profit !== null ? `$${max_profit.toFixed(0)}` : '∞'}
          sub="per contract" />
        <StatCard label="Max Loss" accent="var(--loss)" color="var(--loss)"
          value={max_loss !== null ? `$${Math.abs(max_loss).toFixed(0)}` : '∞'}
          sub="per contract" />
        <StatCard label="Breakeven"
          value={breakeven.length ? `$${breakeven[0].toFixed(2)}` : '—'}
          sub={breakeven.length > 1 ? `$${breakeven[1].toFixed(2)}` : undefined} />
      </div>

      {/* Dollar cost row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginTop: 7 }}>
        <StatCard label="Daily Theta Cost" color="var(--loss)"
          value={`-$${dollarTheta.toFixed(2)}`}
          sub="per contract / day" />
        <StatCard label="Vega Exposure"
          value={`$${(greeks.vega * 100).toFixed(2)}`}
          sub="per 1% IV change" />
      </div>
    </div>
  )
}
