import { useState, useCallback } from 'react'
import { setSoundEnabled, setMasterVolume } from '../audio/sounds'
import { setVibrationEnabled } from '../audio/haptics'

export type Theme = 'dark' | 'midnight' | 'light'

export type Settings = {
  soundEnabled: boolean
  soundVolume: number
  vibrationEnabled: boolean
  theme: Theme
}

const SETTINGS_KEY = 'block-game-settings'

const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  soundVolume: 0.7,
  vibrationEnabled: true,
  theme: 'dark',
}

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (!stored) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch { return DEFAULT_SETTINGS }
}

function saveSettings(settings: Settings): void {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { /* localStorage unavailable */ }
}

function applySettings(s: Settings): void {
  setSoundEnabled(s.soundEnabled)
  setMasterVolume(s.soundVolume)
  setVibrationEnabled(s.vibrationEnabled)
  document.documentElement.setAttribute('data-theme', s.theme)
}

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    const s = loadSettings()
    applySettings(s)
    return s
  })

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      applySettings(next)
      return next
    })
  }, [])

  return { settings, update }
}
