import type { HexCellVM } from '../block-hex.vm'
import HexCell from './HexCell'

type HexBoardProps = {
  cells: HexCellVM[]
  onCellClick: (index: number) => void
}

export default function HexBoard({ cells, onCellClick }: HexBoardProps) {
  return (
    <div className="hex-board">
      {cells.map(cell => (
        <HexCell key={cell.index} cell={cell} onClick={onCellClick} />
      ))}
    </div>
  )
}
