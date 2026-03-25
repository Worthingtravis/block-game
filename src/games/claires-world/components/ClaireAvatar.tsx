import type { ClaireMood } from '../game/types'

type Props = {
  mood: ClaireMood
}

export default function ClaireAvatar({ mood }: Props) {
  return (
    <div
      className={`claire-avatar claire-avatar--${mood}`}
      aria-label={`Claire is ${mood}`}
      role="img"
    >
      <div className="claire-avatar__face">
        <div className="claire-avatar__eyes">
          <div className="claire-avatar__eye claire-avatar__eye--left" />
          <div className="claire-avatar__eye claire-avatar__eye--right" />
        </div>
        <div className="claire-avatar__mouth" />
      </div>
    </div>
  )
}
