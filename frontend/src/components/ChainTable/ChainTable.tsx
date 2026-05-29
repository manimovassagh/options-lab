import { useChain } from '../../api/client'
import type { OptionContract } from '../../types/options'

interface Props {
  ticker: string
  expiry: string | null
  onExpiryChange: (e: string) => void
  onContractSelect: (c: OptionContract, underlyingPrice: number) => void
}

export function ChainTable({ ticker, expiry, onExpiryChange, onContractSelect }: Props) {
  const { data: chain, isLoading, error } = useChain(ticker, expiry)

  if (isLoading) return <p className="text-sm p-4" style={{ color: 'var(--text-muted)' }}>Loading chain...</p>
  if (error)     return <p className="text-sm p-4" style={{ color: 'var(--loss)' }}>Failed — is the ticker valid?</p>
  if (!chain)    return null

  const active = expiry || chain.available_expiries[0]
  const calls  = chain.contracts.filter(c => c.type === 'call')

  return (
    <div>
      <div className="flex gap-1 mb-3 flex-wrap">
        {chain.available_expiries.slice(0, 8).map(exp => (
          <button key={exp} onClick={() => onExpiryChange(exp)}
            className="text-xs px-2 py-1 rounded"
            style={{ background: exp === active ? 'var(--accent)' : 'var(--bg-card)',
                     color: exp === active ? '#000' : 'var(--text-muted)',
                     border: '1px solid var(--border)' }}>
            {exp.slice(5)}
          </button>
        ))}
      </div>

      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
        {chain.days_to_expiry} DTE · ${chain.underlying_price.toFixed(2)}
      </p>

      <table className="w-full border-collapse">
        <thead>
          <tr style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border)' }}>
            {['Strike','Bid','Ask','IV%','Δ','Θ'].map(h => (
              <th key={h} className="text-xs font-medium px-2 py-1 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calls.map(c => {
            const atm = Math.abs(c.strike - chain.underlying_price) < chain.underlying_price * 0.005
            return (
              <tr key={c.strike}
                onClick={() => onContractSelect(c, chain.underlying_price)}
                className="cursor-pointer hover:opacity-80"
                style={{ background: atm ? 'rgba(79,195,247,0.08)' : undefined,
                         borderBottom: '1px solid rgba(42,63,85,0.4)' }}>
                <td className="px-2 py-1.5 text-xs font-mono font-bold"
                  style={{ color: atm ? 'var(--accent)' : undefined }}>{c.strike}</td>
                <td className="px-2 py-1.5 text-xs font-mono">{c.bid.toFixed(2)}</td>
                <td className="px-2 py-1.5 text-xs font-mono">{c.ask.toFixed(2)}</td>
                <td className="px-2 py-1.5 text-xs font-mono">{(c.iv * 100).toFixed(1)}</td>
                <td className="px-2 py-1.5 text-xs font-mono">{c.delta.toFixed(2)}</td>
                <td className="px-2 py-1.5 text-xs font-mono" style={{ color: 'var(--loss)' }}>
                  {c.theta.toFixed(3)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
