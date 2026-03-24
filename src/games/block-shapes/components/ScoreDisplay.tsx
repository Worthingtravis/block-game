import { useState, useEffect } from 'react'

type ScoreDisplayProps = {
  score: number
  highScore: number
  comboMultiplier: number
}

export default function ScoreDisplay({ score, highScore, comboMultiplier }: ScoreDisplayProps) {
  const [prevScore, setPrevScore] = useState(score)
  const [prevCombo, setPrevCombo] = useState(comboMultiplier)
  const [scorePopping, setScorePopping] = useState(false)
  const [comboPulsing, setComboPulsing] = useState(false)

  if (score !== prevScore) {
    setPrevScore(score)
    setScorePopping(true)
  }
  if (comboMultiplier !== prevCombo) {
    if (comboMultiplier > prevCombo) setComboPulsing(true)
    setPrevCombo(comboMultiplier)
  }

  useEffect(() => {
    if (!scorePopping) return
    const timer = setTimeout(() => setScorePopping(false), 300)
    return () => clearTimeout(timer)
  }, [scorePopping])

  useEffect(() => {
    if (!comboPulsing) return
    const timer = setTimeout(() => setComboPulsing(false), 300)
    return () => clearTimeout(timer)
  }, [comboPulsing])

  return (
    <div className="score-display">
      <div>
        <div className="score-display__label">HIGH</div>
        <div className="score-display__value">{highScore}</div>
      </div>
      <div>
        <div className="score-display__label score-display__label--main">SCORE</div>
        <div className={`score-display__value score-display__value--main${scorePopping ? ' score--popping' : ''}`}>
          {score}
        </div>
      </div>
      <div>
        <div className="score-display__label">COMBO</div>
        <div
          className={`score-display__value${comboPulsing ? ' combo--pulsing' : ''}`}
          style={{ color: comboMultiplier > 1 ? 'var(--yellow)' : 'inherit' }}
        >
          x{comboMultiplier}
        </div>
      </div>
    </div>
  )
}
