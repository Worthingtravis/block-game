import { useCallback } from 'react'
import SharedAffirmations, { pickRandom } from '../../../shared/Affirmations'
import type { MergeResult, Phase } from '../game/types'
import { formatValue } from '../game/values'

const MESSAGES = {
  merge: ['Nice!', 'Clean!', 'Sweet!', 'Smooth!', 'Yes!', 'Tidy!', 'Click!'],
  big: ['Amazing!', 'Fantastic!', 'Brilliant!', 'Wow!', 'Huge!', 'Massive!', 'Monster merge!'],
  chain: ['COMBO!', 'CHAIN!', 'UNSTOPPABLE!', 'ON FIRE!', 'BLAZING!', 'ROLLING!', 'KEEP GOING!'],
  epic: ['INCREDIBLE!', 'LEGENDARY!', 'GODLIKE!', 'SUPREME!', 'PERFECTION!', 'TRANSCENDENT!', 'ASCENDED!'],
}

// Special messages for unique situations
const SPECIALS = {
  firstMerge: ['First blood!', 'Here we go!', 'And so it begins...'],
  powerOf2Milestone: {
    64: ['Sixty-four! Getting serious.', 'Now we\'re cooking!'],
    128: ['Triple digits baby!', 'The big leagues!'],
    256: ['A quarter K!', 'Stacking up nicely!'],
    512: ['Half a K! Respect.', 'This board fears you.'],
    1024: ['ONE K! You absolute unit!', '1K CLUB!'],
    2048: ['THE 2048! What a legend!', '2K! Is this even legal?'],
    4096: ['4K ULTRA HD!', 'Beyond mortal comprehension!'],
    8192: ['8K?! Are you human?', 'The numbers Mason!'],
  } as Record<number, string[]>,
  fiveGroup: ['FIVE-WAY MERGE!', 'PENTA MERGE!', 'The whole squad!'],
  fourGroup: ['QUAD MERGE!', 'Four of a kind!', 'Squad goals!'],
}

function pickMessage(merge: MergeResult, chainStep: number, totalMerges: number): string {
  // First ever merge
  if (totalMerges === 1 && chainStep <= 1) return pickRandom(SPECIALS.firstMerge)

  // New milestone values
  const milestone = SPECIALS.powerOf2Milestone[merge.resultValue]
  if (milestone) return pickRandom(milestone)

  // Five-way merge
  if (merge.groupSize >= 5) return pickRandom(SPECIALS.fiveGroup)

  // Four-way merge
  if (merge.groupSize === 4) return pickRandom(SPECIALS.fourGroup)

  // Epic chain (4+)
  if (chainStep >= 6) return 'IS THIS REAL LIFE?!'
  if (chainStep >= 5) return pickRandom(MESSAGES.epic) + '!!'
  if (chainStep >= 4) return pickRandom(MESSAGES.epic)

  // Chain with gravity
  if (chainStep >= 2) return pickRandom(MESSAGES.chain) + ` x${chainStep}`

  // Big group
  if (merge.groupSize >= 3) return pickRandom(MESSAGES.big)

  // High value
  if (merge.resultValue >= 64) return formatValue(merge.resultValue) + '!'

  return pickRandom(MESSAGES.merge)
}

function sizeClass(merge: MergeResult, chainStep: number): string {
  if (chainStep >= 4 || merge.resultValue >= 512 || merge.groupSize >= 5) return 'affirmation--huge'
  if (chainStep >= 2 || merge.groupSize >= 3 || merge.resultValue >= 64) return 'affirmation--big'
  return ''
}

type Props = {
  currentMerge: MergeResult | null
  chainStep: number
  totalMerges: number
  phase: Phase
}

export default function Affirmations({ currentMerge, chainStep, totalMerges, phase }: Props) {
  const getText = useCallback(() => {
    if (!currentMerge || phase !== 'merging') return null
    return {
      text: pickMessage(currentMerge, chainStep, totalMerges),
      sizeClass: sizeClass(currentMerge, chainStep),
    }
  }, [currentMerge, chainStep, totalMerges, phase])

  return <SharedAffirmations trigger={currentMerge} getText={getText} />
}
