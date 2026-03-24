import type { Settings, Theme } from '../hooks/useSettings'

type OptionsModalProps = {
  settings: Settings
  onUpdate: (patch: Partial<Settings>) => void
  onClose: () => void
  onRestart: () => void
}

const THEMES: { value: Theme; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'midnight', label: 'Midnight' },
  { value: 'light', label: 'Light' },
]

export default function OptionsModal({ settings, onUpdate, onClose, onRestart }: OptionsModalProps) {
  return (
    <div className="options-overlay" onClick={onClose}>
      <div className="options-panel" onClick={e => e.stopPropagation()}>
        <div className="options-header">
          <h2>Options</h2>
          <button className="options-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className="options-section">
          <div className="options-row">
            <span>Sound</span>
            <button
              className={`options-toggle${settings.soundEnabled ? ' options-toggle--on' : ''}`}
              onClick={() => onUpdate({ soundEnabled: !settings.soundEnabled })}
            >
              {settings.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {settings.soundEnabled && (
            <div className="options-row">
              <span>Volume</span>
              <input
                type="range"
                className="options-slider"
                min={0}
                max={1}
                step={0.05}
                value={settings.soundVolume}
                onChange={e => onUpdate({ soundVolume: parseFloat(e.target.value) })}
              />
            </div>
          )}

          <div className="options-row">
            <span>Vibration</span>
            <button
              className={`options-toggle${settings.vibrationEnabled ? ' options-toggle--on' : ''}`}
              onClick={() => onUpdate({ vibrationEnabled: !settings.vibrationEnabled })}
            >
              {settings.vibrationEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="options-row">
            <span>Theme</span>
            <div className="options-theme-group">
              {THEMES.map(t => (
                <button
                  key={t.value}
                  className={`options-theme-btn${settings.theme === t.value ? ' options-theme-btn--active' : ''}`}
                  onClick={() => onUpdate({ theme: t.value })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button className="options-restart" onClick={onRestart}>
          Restart Game
        </button>

        <div className="options-version">
          {import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA
            ? `Build ${import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA.slice(0, 7)}`
            : 'Local build'}
        </div>
      </div>
    </div>
  )
}
