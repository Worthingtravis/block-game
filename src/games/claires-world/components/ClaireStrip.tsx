import ClaireAvatar from './ClaireAvatar'
import ClaireSpeechBubble from './ClaireSpeechBubble'
import type { ClaireMood } from '../game/types'

type Props = {
  mood: ClaireMood
  message: string | null
}

export default function ClaireStrip({ mood, message }: Props) {
  return (
    <div className="claire-strip">
      <ClaireAvatar mood={mood} />
      <ClaireSpeechBubble message={message} />
    </div>
  )
}
