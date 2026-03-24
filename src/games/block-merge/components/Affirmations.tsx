import { useCallback } from 'react'
import SharedAffirmations, { pickRandom } from '../../../shared/Affirmations'
import type { MergeResult, Phase } from '../game/types'
import { formatValue } from '../game/values'

const MESSAGES = {
  merge: ['Nice!', 'Clean!', 'Sweet!', 'Smooth!', 'Yes!'],
  big: ['Amazing!', 'Fantastic!', 'Brilliant!', 'Wow!', 'Huge!'],
  chain: ['COMBO!', 'CHAIN!', 'UNSTOPPABLE!', 'ON FIRE!', 'BLAZING!'],
  epic: ['INCREDIBLE!', 'LEGENDARY!', 'GODLIKE!', 'SUPREME!', 'PERFECTION!'],
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

type Props = {
  currentMerge: MergeResult | null
  chainStep: number
  phase: Phase
}

export default function Affirmations({ currentMerge, chainStep, phase }: Props) {
  const getText = useCallback(() => {
    if (!currentMerge || phase !== 'merging') return null
    return { text: pickMessage(currentMerge, chainStep), sizeClass: sizeClass(currentMerge, chainStep) }
  }, [currentMerge, chainStep, phase])

  return <SharedAffirmations trigger={currentMerge} getText={getText} />
}
