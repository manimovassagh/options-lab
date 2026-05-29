import type { AnalyseResponse } from '../../types/options'

const LESSONS = [
  { title: 'What is a Call Option?',
    body: 'A call gives you the right to BUY 100 shares at the strike price before expiry. You profit when the stock rises above your breakeven (strike + premium paid). Your loss is limited to the premium.',
    liveKey: 'breakeven' },
  { title: 'What is Delta (Δ)?',
    body: 'Delta = how much the option price moves per $1 move in the stock. Delta 0.45 means you gain ~$45 if the stock rises $1. ATM calls have delta ~0.50. Deep ITM calls have delta near 1.0.',
    liveKey: 'delta' },
  { title: 'What is Theta (Θ)?',
    body: "Theta = daily cost of holding an option. Theta -0.05 means you lose ~$5/day just from time passing, even if the stock doesn't move. This is 'time decay' — why buyers dislike holding through weekends.",
    liveKey: 'theta' },
  { title: 'What is Implied Volatility (IV)?',
    body: "IV is the market's expectation of future price movement, baked into the option price. High IV = expensive options. When IV drops after you buy (IV crush), your option loses value even if the stock is flat.",
    liveKey: 'iv' },
  { title: 'Max Profit & Max Loss',
    body: 'For a long call: max loss = premium paid × 100 (the flat bottom of the P&L chart). Max profit = unlimited — the stock can keep rising. The green line on the chart shows profit at expiry.',
    liveKey: 'maxloss' },
]

export function LearnPanel({ analysis }: { analysis?: AnalyseResponse }) {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h2 className="text-base font-bold" style={{ color: 'var(--accent)' }}>Options Fundamentals</h2>
      {LESSONS.map(lesson => (
        <div key={lesson.title} className="p-4 rounded"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold mb-1">{lesson.title}</h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{lesson.body}</p>
          {analysis && lesson.liveKey === 'delta' && (
            <p className="text-xs mt-2" style={{ color: 'var(--accent)' }}>
              Your position delta: <strong>{analysis.greeks.delta.toFixed(3)}</strong>
            </p>
          )}
          {analysis && lesson.liveKey === 'theta' && (
            <p className="text-xs mt-2" style={{ color: 'var(--loss)' }}>
              Your daily theta: <strong>{analysis.greeks.theta.toFixed(3)}</strong> (${(analysis.greeks.theta * 100).toFixed(2)}/day per contract)
            </p>
          )}
          {analysis && lesson.liveKey === 'breakeven' && analysis.breakeven.length > 0 && (
            <p className="text-xs mt-2" style={{ color: 'var(--profit)' }}>
              Your breakeven: <strong>${analysis.breakeven[0].toFixed(2)}</strong>
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
