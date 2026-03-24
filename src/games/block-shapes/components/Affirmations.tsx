import { useCallback } from 'react'
import SharedAffirmations, { pickRandom } from '../../../shared/Affirmations'
import type { ClearResult } from '../game/types'

const MESSAGES = {
  single: ['Nice!', 'Clean!', 'Sweet!', 'Smooth!', 'Yes!'],
  double: ['Amazing!', 'Fantastic!', 'Brilliant!', 'Double Kill!', 'Wow!'],
  triple: ['INCREDIBLE!', 'UNSTOPPABLE!', 'TRIPLE THREAT!', 'GODLIKE!', 'LEGENDARY!'],
  quad: ['OBLITERATED!', 'ANNIHILATION!', 'PERFECTION!', 'ABSOLUTE BEAST!', 'SUPREME!'],
  combo: ['Combo x', 'On Fire x', 'Blazing x', 'Streak x'],
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

type Props = {
  lastClear: ClearResult | null
  comboMultiplier: number
}

export default function Affirmations({ lastClear, comboMultiplier }: Props) {
  const getText = useCallback(() => {
    if (!lastClear || lastClear.linesCleared <= 0) return null
    return {
      text: pickMessage(lastClear.linesCleared, comboMultiplier),
      sizeClass: computeSizeClass(lastClear.linesCleared, comboMultiplier),
    }
  }, [lastClear, comboMultiplier])

  return <SharedAffirmations trigger={lastClear} getText={getText} />
}
