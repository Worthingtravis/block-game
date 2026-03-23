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

    for (const cell of lastClear.clearedCells) {
      const x = padding + cell.col * cellW + cellW / 2
      const y = padding + cell.row * cellH + cellH / 2
      particleRef.current.emit(x, y, '#ffffff', lastClear.linesCleared >= 2 ? 6 : 3)
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
