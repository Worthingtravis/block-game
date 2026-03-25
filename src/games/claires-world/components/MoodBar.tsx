type Props = {
  claireMultiplier: number
}

// Maps claireMultiplier 1.0–3.0 to 0–100%
function toPercent(multiplier: number): number {
  return Math.round(((multiplier - 1.0) / 2.0) * 100)
}

export default function MoodBar({ claireMultiplier }: Props) {
  const pct = toPercent(Math.min(3.0, Math.max(1.0, claireMultiplier)))
  const pulsing = claireMultiplier > 2.5

  return (
    <div className="claire-mood-bar" aria-label={`Claire multiplier: ${claireMultiplier.toFixed(1)}x`}>
      <div
        className={`claire-mood-bar__fill${pulsing ? ' claire-mood-bar__fill--pulse' : ''}`}
        style={{ width: `${pct}%` }}
      />
      <span className="claire-mood-bar__label">{claireMultiplier.toFixed(1)}x</span>
    </div>
  )
}
