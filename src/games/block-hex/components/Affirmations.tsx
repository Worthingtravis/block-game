import { useCallback } from 'react'
import SharedAffirmations, { pickRandom } from '../../../shared/Affirmations'
import type { MatchResult } from '../game/types'

const MESSAGES = {
  match: ['Nice!', 'Matched!', 'Clean!'],
  chain: ['CHAIN!', 'COMBO!', 'CASCADING!'],
  big: ['HUGE CLEAR!', 'MASSIVE!', 'BOARD SWEEP!'],
}

function pickMessage(match: MatchResult): string {
  if (match.chainDepth >= 3) return pickRandom(MESSAGES.big)
  if (match.chainDepth >= 2) return pickRandom(MESSAGES.chain)
  return pickRandom(MESSAGES.match)
}

function computeSizeClass(match: MatchResult): string {
  if (match.chainDepth >= 3 || match.cellIndices.length >= 6) return 'affirmation--huge'
  if (match.chainDepth >= 2 || match.cellIndices.length >= 4) return 'affirmation--big'
  return ''
}

type Props = {
  lastMatch: MatchResult | null
}

export default function Affirmations({ lastMatch }: Props) {
  const getText = useCallback(() => {
    if (!lastMatch) return null
    return {
      text: pickMessage(lastMatch),
      sizeClass: computeSizeClass(lastMatch),
    }
  }, [lastMatch])

  return <SharedAffirmations trigger={lastMatch} getText={getText} />
}
