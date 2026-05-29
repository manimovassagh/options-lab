import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
         ReferenceLine, ResponsiveContainer, Legend } from 'recharts'
import type { PnLPoint } from '../../types/options'

interface Props {
  pnlAtExpiry: PnLPoint[]; pnlToday: PnLPoint[]; pnlMidpoint: PnLPoint[]
  breakevens: number[]; underlyingPrice: number
}

export function PnLChart({ pnlAtExpiry, pnlToday, pnlMidpoint, breakevens, underlyingPrice }: Props) {
  const todayMap = new Map(pnlToday.map(p => [p.price, p.pnl]))
  const midMap   = new Map(pnlMidpoint.map(p => [p.price, p.pnl]))
  const data     = pnlAtExpiry.map(p => ({
    price: p.price, 'At Expiry': p.pnl,
    'Today': todayMap.get(p.price) ?? null,
    'Midpoint': midMap.get(p.price) ?? null,
  }))
  const all = [...pnlAtExpiry, ...pnlToday, ...pnlMidpoint].map(p => p.pnl)
  const pad = (Math.max(...all) - Math.min(...all)) * 0.15

  return (
    <div className="p-4 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--accent)' }}>P&L Chart</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,63,85,0.6)" />
          <XAxis dataKey="price" tick={{ fontSize: 10, fill: '#8899aa' }} tickFormatter={v => `$${v}`} />
          <YAxis tick={{ fontSize: 10, fill: '#8899aa' }} tickFormatter={v => `$${v}`}
                 domain={[Math.min(...all) - pad, Math.max(...all) + pad]} />
          <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4 }}
                   labelFormatter={v => `Price: $${v}`} formatter={(v: unknown) => [`$${(v as number)?.toFixed(2)}`, '']} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 2" />
          <ReferenceLine x={underlyingPrice} stroke="rgba(79,195,247,0.35)" strokeDasharray="4 2" />
          {breakevens.map(be => (
            <ReferenceLine key={be} x={be} stroke="rgba(255,193,7,0.5)" strokeDasharray="4 2"
              label={{ value: `BE $${be}`, fill: '#ffc107', fontSize: 10 }} />
          ))}
          <Line type="monotone" dataKey="At Expiry" stroke="#4caf50" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="Today"     stroke="#4fc3f7" dot={false} strokeWidth={1.5} strokeDasharray="5 3" />
          <Line type="monotone" dataKey="Midpoint"  stroke="#ff9800" dot={false} strokeWidth={1.5} strokeDasharray="5 3" />
          <Legend wrapperStyle={{ fontSize: 10 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
