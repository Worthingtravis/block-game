import { useState, useEffect, useRef } from 'react'

type Affirmation = {
  id: number
  text: string
  sizeClass: string
  x: number
  y: number
  expiresAt: number
}

const DURATION = 1200
const MAX_ITEMS = 10

let nextId = 0

type AffirmationsProps = {
  trigger: unknown
  getText: () => { text: string; sizeClass: string } | null
}

export default function Affirmations({ trigger, getText }: AffirmationsProps) {
  const [items, setItems] = useState<Affirmation[]>([])
  const prevTriggerRef = useRef<unknown>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (trigger !== prevTriggerRef.current) {
    prevTriggerRef.current = trigger
    const result = getText()
    if (result) {
      setItems(prev => {
        const next = [...prev, {
          id: nextId++,
          text: result.text,
          sizeClass: result.sizeClass,
          x: 30 + Math.random() * 40,
          y: 20 + Math.random() * 30,
          expiresAt: Date.now() + DURATION,
        }]
        return next.length > MAX_ITEMS ? next.slice(-MAX_ITEMS) : next
      })
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
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
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

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
