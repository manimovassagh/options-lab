import type { AnalyseResponse } from '../../types/options'

function Tile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded"
      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-mono font-bold" style={{ color: color || 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

export function GreeksPanel({ analysis }: { analysis: AnalyseResponse }) {
  const { greeks, strategy_name, max_profit, max_loss, breakeven } = analysis
  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{strategy_name}</p>
      <div className="grid grid-cols-4 gap-2">
        <Tile label="Delta Δ"  value={greeks.delta.toFixed(3)} />
        <Tile label="Gamma Γ"  value={greeks.gamma.toFixed(4)} />
        <Tile label="Theta Θ"  value={greeks.theta.toFixed(3)} color="var(--loss)" />
        <Tile label="Vega ν"   value={greeks.vega.toFixed(3)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Tile label="Max Profit" value={max_profit !== null ? `$${max_profit.toFixed(0)}` : '∞'} color="var(--profit)" />
        <Tile label="Max Loss"   value={max_loss   !== null ? `$${Math.abs(max_loss).toFixed(0)}` : '∞'} color="var(--loss)" />
        <Tile label="Breakeven"  value={breakeven.length ? `$${breakeven[0].toFixed(2)}` : '—'} />
      </div>
    </div>
  )
}
