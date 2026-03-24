import { useEffect, useState, type RefObject } from 'react'
import type { ClearResult, Cell } from '../game/types'
import { BOARD_SIZE } from '../game/types'
import type { ParticleCanvasHandle } from '../components/ParticleCanvas'

type UseBoardEffectsOptions = {
  lastClear: ClearResult | null
  boardRef: RefObject<HTMLDivElement | null>
  particleRef: RefObject<ParticleCanvasHandle | null>
}

export function useBoardEffects({ lastClear, boardRef, particleRef }: UseBoardEffectsOptions) {
  const [shaking, setShaking] = useState(false)
  const [clearingCells, setClearingCells] = useState<Cell[]>([])
  const [prevClear, setPrevClear] = useState<ClearResult | null>(null)

  if (lastClear !== prevClear) {
    setPrevClear(lastClear)
    if (lastClear && lastClear.linesCleared > 0) {
      setClearingCells(lastClear.clearedCells)
      if (lastClear.linesCleared >= 2) setShaking(true)
    }
  }

  useEffect(() => {
    if (!lastClear || lastClear.linesCleared === 0) return
    const el = boardRef.current
    if (!el || !particleRef.current) return

    const rect = el.getBoundingClientRect()
    const padding = parseFloat(getComputedStyle(el).padding) || 6
    const cellW = (rect.width - padding * 2) / BOARD_SIZE
    const cellH = (rect.height - padding * 2) / BOARD_SIZE

    const colors = ['#ffffff', '#ffdd44', '#ff6644', '#44ddff', '#44ff88']
    const lines = lastClear.linesCleared
    const countPerCell = lines >= 4 ? 12 : lines >= 3 ? 9 : lines >= 2 ? 6 : 3

    for (const cell of lastClear.clearedCells) {
      const x = padding + cell.col * cellW + cellW / 2
      const y = padding + cell.row * cellH + cellH / 2
      const color = lines >= 2 ? colors[Math.floor(Math.random() * colors.length)] : '#ffffff'
      const intensity = lines >= 4 ? 1.8 : lines >= 3 ? 1.4 : lines >= 2 ? 1.2 : 1
      particleRef.current.emit(x, y, color, countPerCell, intensity)
    }
  }, [lastClear, boardRef, particleRef])

  useEffect(() => {
    if (clearingCells.length === 0) return
    const timer = setTimeout(() => setClearingCells([]), 300)
    return () => clearTimeout(timer)
  }, [clearingCells])

  useEffect(() => {
    if (!shaking) return
    const timer = setTimeout(() => setShaking(false), 200)
    return () => clearTimeout(timer)
  }, [shaking])

  return { shaking, clearingCells }
}
