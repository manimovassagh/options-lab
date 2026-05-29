interface Props { expiry: string; analysisDate: string; onChange: (d: string) => void }

export function TimeframeSlider({ expiry, analysisDate, onChange }: Props) {
  const today     = new Date().toISOString().split('T')[0]
  const totalDays = Math.max(Math.ceil((+new Date(expiry) - +new Date(today)) / 86400000), 1)
  const current   = Math.max(Math.ceil((+new Date(analysisDate) - +new Date(today)) / 86400000), 0)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = new Date(today)
    d.setDate(d.getDate() + parseInt(e.target.value))
    onChange(d.toISOString().split('T')[0])
  }

  return (
    <div className="mt-3 p-3 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
        <span>Today</span>
        <span style={{ color: 'var(--accent)' }}>{analysisDate}</span>
        <span>Expiry {expiry}</span>
      </div>
      <input type="range" min={0} max={totalDays} value={current} onChange={handleChange}
        className="w-full" style={{ accentColor: 'var(--accent)' }} />
    </div>
  )
}
