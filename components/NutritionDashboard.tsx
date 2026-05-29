'use client'

export interface NutrientData {
  consumed: number
  target: number
}

export interface NutritionDashboardProps {
  calories: NutrientData
  protein: NutrientData
  carbs: NutrientData
  fat: NutrientData
}

interface NutrientRowProps {
  label: string
  unit: string
  data: NutrientData
}

function NutrientRow({ label, unit, data }: NutrientRowProps) {
  const { consumed, target } = data
  const pct = target > 0 ? Math.round((consumed / target) * 100) : 0
  const isOver = consumed > target
  const barWidth = Math.min(pct, 100)

  const trackColor = 'var(--surface-3)'
  const fillColor = isOver ? 'var(--red)' : 'var(--amber)'
  const pctColor = isOver ? 'var(--red)' : 'var(--text-dim)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 13, color: isOver ? 'var(--red)' : 'var(--text)' }}>
            {consumed}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>/ {target} {unit}</span>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: pctColor,
            minWidth: 36,
            textAlign: 'right',
          }}>
            {pct}%
          </span>
        </div>
      </div>
      <div style={{
        height: 6,
        borderRadius: 3,
        background: trackColor,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${barWidth}%`,
          borderRadius: 3,
          background: fillColor,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  )
}

export default function NutritionDashboard({ calories, protein, carbs, fat }: NutritionDashboardProps) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
        Today&apos;s Nutrition
      </h2>
      <NutrientRow label="Calories" unit="kcal" data={calories} />
      <NutrientRow label="Protein"  unit="g"    data={protein} />
      <NutrientRow label="Carbs"    unit="g"    data={carbs} />
      <NutrientRow label="Fat"      unit="g"    data={fat} />
    </div>
  )
}
