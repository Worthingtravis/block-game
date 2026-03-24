import { useState, useEffect, useRef } from 'react'
import type { MergeResult, Phase } from '../game/types'
import { formatValue } from '../game/values'

type Affirmation = {
  id: number
  text: string
  sizeClass: string
  x: number
  y: number
  expiresAt: number
}

const MESSAGES = {
  merge: ['Nice!', 'Clean!', 'Sweet!', 'Smooth!', 'Yes!'],
  big: ['Amazing!', 'Fantastic!', 'Brilliant!', 'Wow!', 'Huge!'],
  chain: ['COMBO!', 'CHAIN!', 'UNSTOPPABLE!', 'ON FIRE!', 'BLAZING!'],
  epic: ['INCREDIBLE!', 'LEGENDARY!', 'GODLIKE!', 'SUPREME!', 'PERFECTION!'],
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickMessage(merge: MergeResult, chainStep: number): string {
  if (chainStep >= 4) return pickRandom(MESSAGES.epic)
  if (chainStep >= 2) return pickRandom(MESSAGES.chain) + ` x${chainStep}`
  if (merge.groupSize >= 3) return pickRandom(MESSAGES.big)
  if (merge.resultValue >= 64) return formatValue(merge.resultValue) + '!'
  return pickRandom(MESSAGES.merge)
}

function sizeClass(merge: MergeResult, chainStep: number): string {
  if (chainStep >= 4 || merge.resultValue >= 512) return 'affirmation--huge'
  if (chainStep >= 2 || merge.groupSize >= 3 || merge.resultValue >= 64) return 'affirmation--big'
  return ''
}

const DURATION = 1200
const MAX_ITEMS = 10

let nextId = 0

type AffirmationsProps = {
  currentMerge: MergeResult | null
  chainStep: number
  phase: Phase
}

export default function Affirmations({ currentMerge, chainStep, phase }: AffirmationsProps) {
  const [items, setItems] = useState<Affirmation[]>([])
  const prevMergeRef = useRef<MergeResult | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (currentMerge !== prevMergeRef.current) {
    prevMergeRef.current = currentMerge
    if (currentMerge && phase === 'merging') {
      const text = pickMessage(currentMerge, chainStep)
      const sc = sizeClass(currentMerge, chainStep)
      setItems(prev => {
        const next = [...prev, {
          id: nextId++,
          text,
          sizeClass: sc,
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
