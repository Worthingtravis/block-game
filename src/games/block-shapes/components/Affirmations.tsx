import { useCallback } from 'react'
import SharedAffirmations, { pickRandom } from '../../../shared/Affirmations'
import type { ClearResult } from '../game/types'

const MESSAGES = {
  single: ['Nice!', 'Clean!', 'Sweet!', 'Smooth!', 'Yes!', 'Tidy!', 'Snug fit!'],
  double: ['Amazing!', 'Fantastic!', 'Brilliant!', 'Double Kill!', 'Wow!', 'Two for one!', 'Double trouble!'],
  triple: ['INCREDIBLE!', 'UNSTOPPABLE!', 'TRIPLE THREAT!', 'GODLIKE!', 'LEGENDARY!', 'HAT TRICK!', 'Three\'s company!'],
  quad: ['OBLITERATED!', 'ANNIHILATION!', 'PERFECTION!', 'ABSOLUTE BEAST!', 'SUPREME!', 'FOUR HORSEMEN!', 'THE QUAD GOD!'],
  combo: ['Combo x', 'On Fire x', 'Blazing x', 'Streak x', 'Hot streak x'],
}

// Special messages for unique situations
const SPECIALS = {
  crossClear: ['CROSSFIRE!', 'Cross clear!', 'X marks the spot!'],
  comboMilestones: {
    5: ['FIVE ALIVE!', 'Penta-streak!', 'CAN\'T BE STOPPED!'],
    7: ['SEVEN HEAVEN!', 'Lucky seven!', 'WHAT A RUN!'],
    10: ['DOUBLE DIGITS!', 'TEN STREAK?!', 'ARE YOU A MACHINE?!'],
  } as Record<number, string[]>,
}

function pickMessage(clear: ClearResult, combo: number): string {
  // Row + column clear at the same time
  if (clear.clearedRows.length > 0 && clear.clearedCols.length > 0) {
    return pickRandom(SPECIALS.crossClear)
  }

  // Combo milestones
  const milestone = SPECIALS.comboMilestones[combo]
  if (milestone) return pickRandom(milestone)

  // High combo
  if (combo > 10) return 'BEYOND COMPREHENSION x' + combo
  if (combo > 2) return pickRandom(MESSAGES.combo) + combo

  // Lines cleared
  if (clear.linesCleared >= 4) return pickRandom(MESSAGES.quad)
  if (clear.linesCleared >= 3) return pickRandom(MESSAGES.triple)
  if (clear.linesCleared >= 2) return pickRandom(MESSAGES.double)
  return pickRandom(MESSAGES.single)
}

function computeSizeClass(clear: ClearResult, combo: number): string {
  if (combo >= 5 || clear.linesCleared >= 3) return 'affirmation--huge'
  if (combo > 2 || clear.linesCleared >= 2 || (clear.clearedRows.length > 0 && clear.clearedCols.length > 0)) return 'affirmation--big'
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
      text: pickMessage(lastClear, comboMultiplier),
      sizeClass: computeSizeClass(lastClear, comboMultiplier),
    }
  }, [lastClear, comboMultiplier])

  return <SharedAffirmations trigger={lastClear} getText={getText} />
}
