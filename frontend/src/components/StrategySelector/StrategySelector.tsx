import { useStrategies } from '../../api/client'

interface Props { selected: string; onChange: (name: string) => void }

export function StrategySelector({ selected, onChange }: Props) {
  const { data } = useStrategies()
  const description = data?.strategies.find(s => s.name === selected)?.description

  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Strategy</span>
        <select value={selected} onChange={e => onChange(e.target.value)}
          className="text-xs px-2 py-1 rounded"
          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
          {data?.strategies.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
      </div>
      {description && (
        <p className="text-xs mt-0.5 flex-1" style={{ color: 'var(--text-muted)' }}>{description}</p>
      )}
    </div>
  )
}
