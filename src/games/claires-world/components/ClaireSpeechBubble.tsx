import { useState, useEffect, useRef } from 'react'

type Props = {
  message: string | null
}

const TYPEWRITER_SPEED_MS = 35
const AUTO_DISMISS_MS = 3000

export default function ClaireSpeechBubble({ message }: Props) {
  const [displayed, setDisplayed] = useState('')
  const [visible, setVisible] = useState(false)
  const typeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const indexRef = useRef(0)

  useEffect(() => {
    if (!message) {
      setVisible(false)
      setDisplayed('')
      return
    }

    // Clear any pending timers
    if (typeTimerRef.current) clearTimeout(typeTimerRef.current)
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)

    setDisplayed('')
    indexRef.current = 0
    setVisible(true)

    const typeNext = () => {
      indexRef.current += 1
      setDisplayed(message.slice(0, indexRef.current))
      if (indexRef.current < message.length) {
        typeTimerRef.current = setTimeout(typeNext, TYPEWRITER_SPEED_MS)
      } else {
        // All text shown — schedule dismiss
        dismissTimerRef.current = setTimeout(() => {
          setVisible(false)
        }, AUTO_DISMISS_MS)
      }
    }

    typeTimerRef.current = setTimeout(typeNext, TYPEWRITER_SPEED_MS)

    return () => {
      if (typeTimerRef.current) clearTimeout(typeTimerRef.current)
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [message])

  if (!visible && !displayed) return null

  return (
    <div className={`claire-bubble${visible ? ' claire-bubble--visible' : ' claire-bubble--hiding'}`}>
      <span className="claire-bubble__text">{displayed}</span>
      <span className="claire-bubble__cursor" aria-hidden="true">|</span>
    </div>
  )
}
