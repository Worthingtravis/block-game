import { useMemo } from 'react'
import Cell from './Cell'
import type { Board as BoardType, BlockColor, Cell as CellType } from '../game/types'

type BoardProps = {
  board: BoardType
  previewCells?: CellType[]
  previewColor?: BlockColor | null
  previewValid?: boolean | null
  clearingCells?: CellType[]
  bombMode?: boolean
}

export default function Board({ board, previewCells, previewColor, previewValid, clearingCells, bombMode }: BoardProps) {
  const previewSet = useMemo(() => {
    if (!previewCells) return new Set<string>()
    return new Set(previewCells.map(c => `${c.row},${c.col}`))
  }, [previewCells])

  const clearingSet = useMemo(() => {
    if (!clearingCells) return new Set<string>()
    return new Set(clearingCells.map(c => `${c.row},${c.col}`))
  }, [clearingCells])

  return (
    <div className={`board${bombMode ? ' board--bomb-target' : ''}`}>
      {board.flatMap((row, r) =>
        row.map((cell, c) => {
          const isPreview = previewSet.has(`${r},${c}`) && previewValid !== null
          const isClearing = clearingSet.has(`${r},${c}`)
          return (
            <div key={`${r}-${c}`} className={isClearing ? 'cell--clearing' : ''}>
              <Cell
                color={cell}
                preview={isPreview ? previewColor : null}
                invalid={isPreview && previewValid === false}
              />
            </div>
          )
        })
      )}
    </div>
  )
}
