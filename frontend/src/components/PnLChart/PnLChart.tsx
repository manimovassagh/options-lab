import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer
} from 'recharts'
import type { PnLPoint } from '../../types/options'

interface Props {
  pnlAtExpiry: PnLPoint[]; pnlToday: PnLPoint[]; pnlMidpoint: PnLPoint[]
  breakevens: number[]; underlyingPrice: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
        Price: <span style={{ color: 'var(--text-primary)' }}>${Number(label).toFixed(2)}</span>
      </p>
      {payload.map((p: any) => p.value != null && (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{
            fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            color: p.value >= 0 ? 'var(--profit)' : 'var(--loss)',
          }}>
            {p.value >= 0 ? '+' : ''}${(p.value as number).toFixed(0)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function PnLChart({ pnlAtExpiry, pnlToday, pnlMidpoint, breakevens, underlyingPrice }: Props) {
  const todayMap = new Map(pnlToday.map(p => [p.price, p.pnl]))
  const midMap   = new Map(pnlMidpoint.map(p => [p.price, p.pnl]))
  const data     = pnlAtExpiry.map(p => ({
    price: p.price,
    'At Expiry': p.pnl,
    'Today':     todayMap.get(p.price) ?? null,
    'Midpoint':  midMap.get(p.price) ?? null,
  }))

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px 16px 8px',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          P&amp;L Curve
        </span>
        <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
          <span style={{ color: '#00e676' }}>● At Expiry</span>
          <span style={{ color: '#00b4d8' }}>● Today</span>
          <span style={{ color: '#ff9800' }}>● Midpoint</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00e676" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(28,47,69,0.8)" />
          <XAxis
            dataKey="price"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickFormatter={v => `$${Number(v).toFixed(0)}`}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickFormatter={v => `${Number(v) >= 0 ? '+' : ''}$${Number(v).toFixed(0)}`}
            domain={['auto', 'auto']}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          <ReferenceLine
            x={underlyingPrice}
            stroke="rgba(0,212,255,0.4)"
            strokeDasharray="4 3"
            strokeWidth={1}
            label={{ value: `$${underlyingPrice.toFixed(0)}`, fill: 'var(--accent)', fontSize: 9, position: 'top' }}
          />
          {breakevens.map(be => (
            <ReferenceLine key={be} x={be}
              stroke="rgba(255,179,0,0.6)" strokeDasharray="3 3" strokeWidth={1}
              label={{ value: `BE $${be.toFixed(0)}`, fill: 'var(--warning)', fontSize: 9, position: 'insideTopRight' }}
            />
          ))}
          <Area
            type="monotone" dataKey="At Expiry"
            stroke="#00e676" strokeWidth={2}
            fill="url(#profitGrad)"
            dot={false} connectNulls
          />
          <Line type="monotone" dataKey="Today"
            stroke="#00b4d8" strokeWidth={1.5} strokeDasharray="5 3"
            dot={false} connectNulls
          />
          <Line type="monotone" dataKey="Midpoint"
            stroke="#ff9800" strokeWidth={1.5} strokeDasharray="5 3"
            dot={false} connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
