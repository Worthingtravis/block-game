import { useState, useEffect, useRef } from 'react'
import type { ClearResult } from '../game/types'

type Affirmation = {
  id: number
  text: string
  sizeClass: string
  x: number
  y: number
  expiresAt: number
}

const MESSAGES = {
  single: ['Nice!', 'Clean!', 'Sweet!', 'Smooth!', 'Yes!'],
  double: ['Amazing!', 'Fantastic!', 'Brilliant!', 'Double Kill!', 'Wow!'],
  triple: ['INCREDIBLE!', 'UNSTOPPABLE!', 'TRIPLE THREAT!', 'GODLIKE!', 'LEGENDARY!'],
  quad: ['OBLITERATED!', 'ANNIHILATION!', 'PERFECTION!', 'ABSOLUTE BEAST!', 'SUPREME!'],
  combo: ['Combo x', 'On Fire x', 'Blazing x', 'Streak x'],
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickMessage(linesCleared: number, combo: number): string {
  if (combo > 2) return pickRandom(MESSAGES.combo) + combo
  if (linesCleared >= 4) return pickRandom(MESSAGES.quad)
  if (linesCleared >= 3) return pickRandom(MESSAGES.triple)
  if (linesCleared >= 2) return pickRandom(MESSAGES.double)
  return pickRandom(MESSAGES.single)
}

function computeSizeClass(linesCleared: number, combo: number): string {
  if (combo > 2 || linesCleared >= 3) return 'affirmation--huge'
  if (linesCleared >= 2) return 'affirmation--big'
  return ''
}

const DURATION = 1200

let nextId = 0

type AffirmationsProps = {
  lastClear: ClearResult | null
  comboMultiplier: number
}

export default function Affirmations({ lastClear, comboMultiplier }: AffirmationsProps) {
  const [items, setItems] = useState<Affirmation[]>([])
  const [prevClear, setPrevClear] = useState<ClearResult | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (lastClear !== prevClear) {
    setPrevClear(lastClear)
    if (lastClear && lastClear.linesCleared > 0) {
      const text = pickMessage(lastClear.linesCleared, comboMultiplier)
      const sc = computeSizeClass(lastClear.linesCleared, comboMultiplier)
      setItems(prev => [...prev, {
        id: nextId++,
        text,
        sizeClass: sc,
        x: 30 + Math.random() * 40,
        y: 20 + Math.random() * 30,
        expiresAt: Date.now() + DURATION,
      }])
    }
  }

  useEffect(() => {
    if (items.length === 0) return

    const now = Date.now()
    const nextExpiry = Math.min(...items.map(i => i.expiresAt))
    const delay = Math.max(0, nextExpiry - now)

    timerRef.current = setTimeout(() => {
      setItems(prev => prev.filter(i => i.expiresAt > Date.now()))
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [items])

  return (
    <div className="affirmations-layer">
      {items.map(item => (
        <div
          key={item.id}
          className={`affirmation ${item.sizeClass}`}
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
        >
          {item.text}
        </div>
      ))}
    </div>
  )
}
