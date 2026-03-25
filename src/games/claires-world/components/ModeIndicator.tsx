import type { ClaireMode } from '../game/types'

type Props = {
  mode: ClaireMode
}

const MODE_LABELS: Record<ClaireMode, string> = {
  'color-crush': 'Color Crush',
  'pattern-echo': 'Pattern Echo',
  'tile-slide': 'Tile Slide',
  'speed-blitz': 'Speed Blitz',
  'mirror-world': 'Mirror World',
  'claires-challenge': "Claire's Challenge",
}

const MODE_COLORS: Record<ClaireMode, string> = {
  'color-crush': 'sky',
  'pattern-echo': 'violet',
  'tile-slide': 'mint',
  'speed-blitz': 'rose',
  'mirror-world': 'amber',
  'claires-challenge': 'rose',
}

export default function ModeIndicator({ mode }: Props) {
  const color = MODE_COLORS[mode]
  return (
    <div className={`claire-mode-indicator claire-mode-indicator--${color}`}>
      {MODE_LABELS[mode]}
    </div>
  )
}
