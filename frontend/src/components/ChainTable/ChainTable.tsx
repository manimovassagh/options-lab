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

  if (isLoading) return (
    <div className="flex items-center gap-2 p-4" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />
      Fetching chain…
    </div>
  )
  if (error) return <p className="text-sm p-4" style={{ color: 'var(--loss)' }}>Error — invalid ticker?</p>
  if (!chain) return null

  const active = expiry || chain.available_expiries[0]
  const callMap = new Map(chain.contracts.filter(c => c.type === 'call').map(c => [c.strike, c]))
  const putMap  = new Map(chain.contracts.filter(c => c.type === 'put').map(c => [c.strike, c]))
  const strikes = [...new Set(chain.contracts.map(c => c.strike))].sort((a, b) => a - b)
  const S = chain.underlying_price

  return (
    <div style={{ fontSize: 11 }}>
      {/* Expiry selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {chain.available_expiries.slice(0, 8).map(exp => (
          <button key={exp} onClick={() => onExpiryChange(exp)} style={{
            background: exp === active ? 'var(--accent)' : 'var(--bg-card)',
            color: exp === active ? '#000' : 'var(--text-muted)',
            border: `1px solid ${exp === active ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 4,
            padding: '3px 8px',
            fontSize: 11,
            fontWeight: exp === active ? 700 : 400,
            cursor: 'pointer',
          }}>
            {exp.slice(5)}
          </button>
        ))}
      </div>

      {/* DTE + price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--text-muted)', fontSize: 11 }}>
        <span><span style={{ color: 'var(--warning)', fontWeight: 700 }}>{chain.days_to_expiry}</span> DTE</span>
        <span>Spot <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>${S.toFixed(2)}</span></span>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 40px 28px 24px 44px 40px 40px 28px 24px', gap: 0, marginBottom: 4 }}>
        {/* Calls side */}
        <div style={{ color: 'var(--call-color)', fontWeight: 700, fontSize: 10, paddingLeft: 4 }}>CALLS</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'right' }}>BID</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'right' }}>ASK</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'right' }}>IV</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'right' }}>Δ</div>
        {/* Puts side */}
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'right' }}>Δ</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'right' }}>IV</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'right' }}>BID</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'right' }}>ASK</div>
        <div style={{ color: 'var(--put-color)', fontWeight: 700, fontSize: 10, textAlign: 'right', paddingRight: 4 }}>PUTS</div>
      </div>

      {/* Rows */}
      <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
        {strikes.map(strike => {
          const call = callMap.get(strike)
          const put  = putMap.get(strike)
          const isAtm = Math.abs(strike - S) < S * 0.004
          const callItm = strike < S
          const putItm  = strike > S

          return (
            <div key={strike} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 40px 40px 28px 24px 44px 40px 40px 28px 24px',
              borderTop: isAtm ? '1px solid var(--accent-glow)' : '1px solid rgba(28,47,69,0.5)',
              borderBottom: isAtm ? '1px solid var(--accent-glow)' : undefined,
              background: isAtm ? 'rgba(0,212,255,0.04)' : (callItm ? 'rgba(0,180,216,0.02)' : undefined),
              cursor: 'pointer',
            }}>
              {/* Call side */}
              {call ? (
                <>
                  <div onClick={() => onContractSelect(call, S)}
                    style={{
                      padding: '4px 4px',
                      background: callItm ? 'rgba(0,180,216,0.06)' : undefined,
                      display: 'flex', alignItems: 'center', gap: 4,
                      borderRight: '1px solid rgba(28,47,69,0.4)',
                    }}>
                    {callItm && <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--call-color)', flexShrink: 0 }} />}
                    <span style={{ color: callItm ? 'var(--call-color)' : 'var(--text-secondary)', fontWeight: callItm ? 600 : 400 }}>
                      {call.mid.toFixed(2)}
                    </span>
                  </div>
                  <div onClick={() => onContractSelect(call, S)} style={{ padding: '4px 2px', textAlign: 'right', color: 'var(--text-muted)' }}>{call.bid.toFixed(2)}</div>
                  <div onClick={() => onContractSelect(call, S)} style={{ padding: '4px 2px', textAlign: 'right', color: 'var(--text-muted)' }}>{call.ask.toFixed(2)}</div>
                  <div onClick={() => onContractSelect(call, S)} style={{ padding: '4px 2px', textAlign: 'right', color: 'var(--text-secondary)' }}>{(call.iv * 100).toFixed(0)}</div>
                  <div onClick={() => onContractSelect(call, S)} style={{ padding: '4px 2px', textAlign: 'right', color: 'var(--call-color)', fontWeight: 600 }}>{call.delta.toFixed(2)}</div>
                </>
              ) : (
                <><div /><div /><div /><div /><div /></>
              )}

              {/* Strike — center */}
              <div style={{
                padding: '4px 4px',
                textAlign: 'center',
                fontWeight: isAtm ? 800 : 700,
                fontSize: isAtm ? 12 : 11,
                color: isAtm ? 'var(--accent)' : 'var(--text-primary)',
                background: isAtm ? 'rgba(0,212,255,0.06)' : 'var(--bg-secondary)',
                borderLeft: '1px solid rgba(28,47,69,0.4)',
                borderRight: '1px solid rgba(28,47,69,0.4)',
                position: 'relative',
              }}>
                {isAtm && <span style={{ position: 'absolute', top: 2, right: 2, fontSize: 7, color: 'var(--accent)', fontWeight: 900 }}>ATM</span>}
                {strike}
              </div>

              {/* Put side */}
              {put ? (
                <>
                  <div onClick={() => onContractSelect(put, S)} style={{ padding: '4px 2px', textAlign: 'right', color: 'var(--put-color)', fontWeight: 600 }}>{Math.abs(put.delta).toFixed(2)}</div>
                  <div onClick={() => onContractSelect(put, S)} style={{ padding: '4px 2px', textAlign: 'right', color: 'var(--text-secondary)' }}>{(put.iv * 100).toFixed(0)}</div>
                  <div onClick={() => onContractSelect(put, S)} style={{ padding: '4px 2px', textAlign: 'right', color: 'var(--text-muted)' }}>{put.bid.toFixed(2)}</div>
                  <div onClick={() => onContractSelect(put, S)} style={{ padding: '4px 2px', textAlign: 'right', color: 'var(--text-muted)' }}>{put.ask.toFixed(2)}</div>
                  <div onClick={() => onContractSelect(put, S)}
                    style={{
                      padding: '4px 4px',
                      background: putItm ? 'rgba(247,37,133,0.06)' : undefined,
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
                      borderLeft: '1px solid rgba(28,47,69,0.4)',
                    }}>
                    <span style={{ color: putItm ? 'var(--put-color)' : 'var(--text-secondary)', fontWeight: putItm ? 600 : 400 }}>
                      {put.mid.toFixed(2)}
                    </span>
                    {putItm && <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--put-color)', flexShrink: 0 }} />}
                  </div>
                </>
              ) : (
                <><div /><div /><div /><div /><div /></>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
