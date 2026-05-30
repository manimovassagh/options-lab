import { useStrategies } from '../../api/client'

interface Props { selected: string; onChange: (name: string) => void }

export function StrategySelector({ selected, onChange }: Props) {
  const { data } = useStrategies()
  const description = data?.strategies.find(s => s.name === selected)?.description

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Strategy</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: description ? 7 : 0 }}>
        {data?.strategies.map(s => (
          <button key={s.name} onClick={() => onChange(s.name)} style={{
            background: selected === s.name ? 'var(--accent-dim)' : 'var(--bg-card)',
            color: selected === s.name ? 'var(--accent)' : 'var(--text-muted)',
            border: `1px solid ${selected === s.name ? 'var(--accent-glow)' : 'var(--border)'}`,
            borderRadius: 5,
            padding: '4px 11px',
            fontSize: 11,
            fontWeight: selected === s.name ? 700 : 400,
            cursor: 'pointer',
            transition: 'all 0.12s',
          }}>{s.name}</button>
        ))}
      </div>
      {description && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{description}</p>
      )}
    </div>
  )
}
