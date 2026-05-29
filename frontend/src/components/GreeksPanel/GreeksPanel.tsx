import type { AnalyseResponse } from '../../types/options'

function GreekBar({ label, value, min, max, color, format }: {
  label: string; value: number; min: number; max: number; color: string; format: (v: number) => string
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  return (
    <div style={{ padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{format(value)}</span>
      </div>
      <div style={{ height: 3, background: 'var(--border-bright)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s ease', boxShadow: `0 0 6px ${color}66` }} />
      </div>
    </div>
  )
}

function MetricCard({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{
      padding: '12px 14px',
      background: 'var(--bg-primary)',
      borderRadius: 8,
      border: `1px solid var(--border)`,
      borderLeft: color ? `3px solid ${color}` : undefined,
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: color || 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function GreeksPanel({ analysis }: { analysis: AnalyseResponse }) {
  const { greeks, strategy_name, max_profit, max_loss, breakeven } = analysis
  const rr = max_loss && max_profit ? Math.abs(max_profit / max_loss) : null

  return (
    <div style={{ marginTop: 12 }}>
      {/* Strategy name */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        padding: '8px 14px',
        background: 'var(--accent-dim)',
        borderRadius: 8,
        border: '1px solid var(--accent-glow)',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.04em' }}>{strategy_name}</span>
      </div>

      {/* Greeks gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <GreekBar label="Delta Δ" value={greeks.delta} min={-1} max={1}
          color="#00d4ff" format={v => v.toFixed(3)} />
        <GreekBar label="Gamma Γ" value={greeks.gamma} min={0} max={0.15}
          color="#a78bfa" format={v => v.toFixed(4)} />
        <GreekBar label="Theta Θ / day" value={Math.abs(greeks.theta)} min={0} max={2}
          color="#ff3d5a" format={v => `-${v.toFixed(3)}`} />
        <GreekBar label="Vega ν / 1%" value={greeks.vega} min={0} max={0.5}
          color="#fbbf24" format={v => v.toFixed(3)} />
      </div>

      {/* Risk metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <MetricCard label="Max Profit" color="var(--profit)"
          value={max_profit !== null ? `$${max_profit.toFixed(0)}` : '∞'}
          sub="per contract" />
        <MetricCard label="Max Loss" color="var(--loss)"
          value={max_loss !== null ? `$${Math.abs(max_loss).toFixed(0)}` : '∞'}
          sub="per contract" />
        <MetricCard label="Breakeven"
          value={breakeven.length ? `$${breakeven[0].toFixed(2)}` : '—'}
          sub={rr ? `R/R ${rr.toFixed(1)}x` : undefined} />
      </div>
    </div>
  )
}
