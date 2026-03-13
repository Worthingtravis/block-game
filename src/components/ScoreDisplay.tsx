import { useRef, useState, useEffect } from 'react'

type ScoreDisplayProps = {
  score: number
  highScore: number
  comboMultiplier: number
}

export default function ScoreDisplay({ score, highScore, comboMultiplier }: ScoreDisplayProps) {
  const prevScoreRef = useRef(score)
  const prevComboRef = useRef(comboMultiplier)
  const [scorePopping, setScorePopping] = useState(false)
  const [comboPulsing, setComboPulsing] = useState(false)

  useEffect(() => {
    if (score !== prevScoreRef.current) {
      setScorePopping(true)
      const timer = setTimeout(() => setScorePopping(false), 300)
      prevScoreRef.current = score
      return () => clearTimeout(timer)
    }
  }, [score])

  useEffect(() => {
    if (comboMultiplier > prevComboRef.current) {
      setComboPulsing(true)
      const timer = setTimeout(() => setComboPulsing(false), 300)
      prevComboRef.current = comboMultiplier
      return () => clearTimeout(timer)
    }
    prevComboRef.current = comboMultiplier
  }, [comboMultiplier])

  return (
    <div
      className="score-display"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: '400px',
        padding: '8px 0',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>HIGH</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{highScore}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '14px', opacity: 0.7 }}>SCORE</div>
        <div
          className={scorePopping ? 'score--popping' : ''}
          style={{ fontSize: '32px', fontWeight: 'bold' }}
        >
          {score}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>COMBO</div>
        <div
          className={comboPulsing ? 'combo--pulsing' : ''}
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: comboMultiplier > 1 ? 'var(--yellow)' : 'inherit',
          }}
        >
          x{comboMultiplier}
        </div>
      </div>
    </div>
  )
}
