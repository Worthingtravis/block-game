import { useState, useEffect } from 'react'
import type { ClearResult } from '../game/types'

type Affirmation = {
  id: number
  text: string
  x: number
  y: number
}

const MESSAGES = {
  single: ['Nice!', 'Clean!', 'Sweet!', 'Smooth!', 'Yes!'],
  double: ['Amazing!', 'Fantastic!', 'Brilliant!', 'Double Kill!', 'Wow!'],
  triple: ['INCREDIBLE!', 'UNSTOPPABLE!', 'TRIPLE THREAT!', 'GODLIKE!', 'LEGENDARY!'],
  quad: ['OBLITERATED!', 'ANNIHILATION!', 'PERFECTION!', 'ABSOLUTE BEAST!', 'SUPREME!'],
  combo: ['Combo x', 'On Fire x', 'Blazing x', 'Streak x'],
}

function pickMessage(linesCleared: number, combo: number): string {
  if (combo > 2) {
    const pool = MESSAGES.combo
    return pool[Math.floor(Math.random() * pool.length)] + combo
  }
  if (linesCleared >= 4) return MESSAGES.quad[Math.floor(Math.random() * MESSAGES.quad.length)]
  if (linesCleared >= 3) return MESSAGES.triple[Math.floor(Math.random() * MESSAGES.triple.length)]
  if (linesCleared >= 2) return MESSAGES.double[Math.floor(Math.random() * MESSAGES.double.length)]
  return MESSAGES.single[Math.floor(Math.random() * MESSAGES.single.length)]
}

function sizeClass(linesCleared: number, combo: number): string {
  if (combo > 2 || linesCleared >= 3) return 'affirmation--huge'
  if (linesCleared >= 2) return 'affirmation--big'
  return ''
}

let nextId = 0

type AffirmationsProps = {
  lastClear: ClearResult | null
  comboMultiplier: number
}

export default function Affirmations({ lastClear, comboMultiplier }: AffirmationsProps) {
  const [items, setItems] = useState<Affirmation[]>([])
  const [prevClear, setPrevClear] = useState<ClearResult | null>(null)

  if (lastClear !== prevClear) {
    setPrevClear(lastClear)
    if (lastClear && lastClear.linesCleared > 0) {
      const text = pickMessage(lastClear.linesCleared, comboMultiplier)
      const x = 30 + Math.random() * 40
      const y = 20 + Math.random() * 30
      setItems(prev => [...prev, { id: nextId++, text, x, y }])
    }
  }

  useEffect(() => {
    if (items.length === 0) return
    const timer = setTimeout(() => {
      setItems(prev => prev.slice(1))
    }, 1200)
    return () => clearTimeout(timer)
  }, [items])

  return (
    <div className="affirmations-layer">
      {items.map(item => (
        <div
          key={item.id}
          className={`affirmation ${sizeClass(prevClear?.linesCleared ?? 1, comboMultiplier)}`}
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
        >
          {item.text}
        </div>
      ))}
    </div>
  )
}
