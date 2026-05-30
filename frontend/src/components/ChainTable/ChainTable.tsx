import { LineChart, Line, ReferenceLine, ResponsiveContainer } from 'recharts'
import { useChain } from '../../api/client'
import type { OptionContract } from '../../types/options'

interface Props {
  ticker: string
  expiry: string | null
  selected: OptionContract | null
  onExpiryChange: (e: string) => void
  onContractSelect: (c: OptionContract, underlyingPrice: number) => void
}

const COLS = '1fr 36px 36px 26px 22px 48px 22px 26px 36px 36px 1fr'

export function ChainTable({ ticker, expiry, selected, onExpiryChange, onContractSelect }: Props) {
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

  const ivSmileData = strikes
    .filter(s => callMap.has(s))
    .map(s => ({ strike: s, iv: Math.round(callMap.get(s)!.iv * 100) }))

  const atmStrike = strikes.reduce((b, s) => Math.abs(s - S) < Math.abs(b - S) ? s : b, strikes[0])
  const atmIV = callMap.get(atmStrike)?.iv ?? 0

  return (
    <div style={{ fontSize: 11 }}>
      {/* Expiry pills */}
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
            transition: 'all 0.12s',
          }}>
            {exp.slice(5)}
          </button>
        ))}
      </div>

      {/* DTE + spot */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--text-muted)', fontSize: 11 }}>
        <span><span style={{ color: 'var(--warning)', fontWeight: 700 }}>{chain.days_to_expiry}</span> DTE</span>
        <span>Spot <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>${S.toFixed(2)}</span></span>
      </div>

      {/* IV Smile mini chart */}
      {ivSmileData.length > 0 && (
        <div style={{
          marginBottom: 10, padding: '6px 8px 2px',
          background: 'var(--bg-secondary)',
          borderRadius: 6,
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>IV Smile</span>
            <span style={{ fontSize: 9, color: 'var(--warning)', fontWeight: 600 }}>
              ATM IV {atmIV > 0 ? `${(atmIV * 100).toFixed(1)}%` : '—'}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={36}>
            <LineChart data={ivSmileData} margin={{ top: 2, right: 4, bottom: 2, left: 4 }}>
              <ReferenceLine x={S} stroke="rgba(0,212,255,0.5)" strokeWidth={1} />
              <Line type="monotone" dataKey="iv" stroke="var(--warning)" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Column headers — 11 cols matching COLS */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS, marginBottom: 3 }}>
        <div style={{ color: 'var(--call-color)', fontWeight: 700, fontSize: 10, paddingLeft: 4 }}>CALLS</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'right' }}>BID</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'right' }}>ASK</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'right' }}>IV</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'right' }}>Δ</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'center' }}>STRIKE</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'left' }}>Δ</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'left' }}>IV</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'left' }}>BID</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'left' }}>ASK</div>
        <div style={{ color: 'var(--put-color)', fontWeight: 700, fontSize: 10, textAlign: 'right', paddingRight: 4 }}>PUTS</div>
      </div>

      {/* Rows */}
      <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 270px)' }}>
        {strikes.map(strike => {
          const call = callMap.get(strike)
          const put  = putMap.get(strike)
          const isAtm = Math.abs(strike - S) < S * 0.004
          const callItm = strike < S
          const putItm  = strike > S
          const selCall = selected?.type === 'call' && selected?.strike === strike
          const selPut  = selected?.type === 'put'  && selected?.strike === strike
          const isSel   = selCall || selPut

          return (
            <div key={strike} style={{
              display: 'grid',
              gridTemplateColumns: COLS,
              borderTop: isAtm ? '1px solid var(--accent-glow)' : '1px solid rgba(28,47,69,0.5)',
              borderBottom: isAtm ? '1px solid var(--accent-glow)' : undefined,
              background: isSel
                ? 'rgba(0,212,255,0.07)'
                : isAtm
                  ? 'rgba(0,212,255,0.03)'
                  : undefined,
              transition: 'background 0.1s',
            }}>

              {/* ── Call side ── */}
              {call ? (
                <>
                  <div onClick={() => onContractSelect(call, S)} style={{
                    padding: '4px 4px',
                    background: callItm ? 'rgba(0,180,216,0.05)' : undefined,
                    borderRight: '1px solid rgba(28,47,69,0.4)',
                    cursor: 'pointer',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {selCall && <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, boxShadow: '0 0 4px var(--accent)' }} />}
                      <span style={{ color: callItm ? 'var(--call-color)' : 'var(--text-secondary)', fontWeight: callItm ? 600 : 400 }}>
                        {call.mid.toFixed(2)}
                      </span>
                    </div>
                    {call.volume > 0 && (
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
                        {call.volume >= 1000 ? `${(call.volume / 1000).toFixed(1)}k` : call.volume}
                      </div>
                    )}
                  </div>
                  <div onClick={() => onContractSelect(call, S)} style={{ padding: '4px 2px', textAlign: 'right', color: 'var(--text-muted)', cursor: 'pointer' }}>{call.bid.toFixed(2)}</div>
                  <div onClick={() => onContractSelect(call, S)} style={{ padding: '4px 2px', textAlign: 'right', color: 'var(--text-muted)', cursor: 'pointer' }}>{call.ask.toFixed(2)}</div>
                  <div onClick={() => onContractSelect(call, S)} style={{ padding: '4px 2px', textAlign: 'right', color: 'var(--text-secondary)', cursor: 'pointer' }}>{(call.iv * 100).toFixed(0)}</div>
                  <div onClick={() => onContractSelect(call, S)} style={{ padding: '4px 2px', textAlign: 'right', color: 'var(--call-color)', fontWeight: 600, cursor: 'pointer' }}>{call.delta.toFixed(2)}</div>
                </>
              ) : (
                <>
                  <div style={{ borderRight: '1px solid rgba(28,47,69,0.4)' }} />
                  <div /><div /><div /><div />
                </>
              )}

              {/* ── Strike center ── */}
              <div style={{
                padding: '4px 0',
                textAlign: 'center',
                fontWeight: isAtm ? 800 : 600,
                fontSize: isAtm ? 11 : 10,
                color: isAtm ? 'var(--accent)' : 'var(--text-primary)',
                background: isAtm ? 'rgba(0,212,255,0.06)' : 'var(--bg-secondary)',
                borderLeft: '1px solid rgba(28,47,69,0.4)',
                borderRight: '1px solid rgba(28,47,69,0.4)',
                position: 'relative',
              }}>
                {isAtm && <span style={{ position: 'absolute', top: 1, right: 2, fontSize: 6.5, color: 'var(--accent)', fontWeight: 900 }}>ATM</span>}
                {strike}
              </div>

              {/* ── Put side ── */}
              {put ? (
                <>
                  <div onClick={() => onContractSelect(put, S)} style={{ padding: '4px 2px', textAlign: 'left', color: 'var(--put-color)', fontWeight: 600, cursor: 'pointer' }}>{Math.abs(put.delta).toFixed(2)}</div>
                  <div onClick={() => onContractSelect(put, S)} style={{ padding: '4px 2px', textAlign: 'left', color: 'var(--text-secondary)', cursor: 'pointer' }}>{(put.iv * 100).toFixed(0)}</div>
                  <div onClick={() => onContractSelect(put, S)} style={{ padding: '4px 2px', textAlign: 'left', color: 'var(--text-muted)', cursor: 'pointer' }}>{put.bid.toFixed(2)}</div>
                  <div onClick={() => onContractSelect(put, S)} style={{ padding: '4px 2px', textAlign: 'left', color: 'var(--text-muted)', cursor: 'pointer' }}>{put.ask.toFixed(2)}</div>
                  <div onClick={() => onContractSelect(put, S)} style={{
                    padding: '4px 4px',
                    background: putItm ? 'rgba(247,37,133,0.05)' : undefined,
                    borderLeft: '1px solid rgba(28,47,69,0.4)',
                    cursor: 'pointer',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                      <span style={{ color: putItm ? 'var(--put-color)' : 'var(--text-secondary)', fontWeight: putItm ? 600 : 400 }}>
                        {put.mid.toFixed(2)}
                      </span>
                      {selPut && <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--put-color)', flexShrink: 0, boxShadow: '0 0 4px var(--put-color)' }} />}
                    </div>
                    {put.volume > 0 && (
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1, textAlign: 'right' }}>
                        {put.volume >= 1000 ? `${(put.volume / 1000).toFixed(1)}k` : put.volume}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div /><div /><div /><div />
                  <div style={{ borderLeft: '1px solid rgba(28,47,69,0.4)' }} />
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
