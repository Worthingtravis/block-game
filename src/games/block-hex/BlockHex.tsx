import type { BlockHexVM } from './block-hex.vm'
import HexBoard from './components/HexBoard'
import MergeOverlay from './components/MergeOverlay'
import TileQueue from './components/TileQueue'
import ScoreDisplay from '../block-shapes/components/ScoreDisplay'
import OptionsModal from '../block-shapes/components/OptionsModal'

/** Pure presentation — takes a VM, renders UI. No hooks. */
export function BlockHexView(vm: BlockHexVM) {
  return (
    <div className="game-container">
      <div className="top-bar">
        <button className="back-btn" onClick={vm.onBack} aria-label="Back to menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <ScoreDisplay
          score={vm.score}
          highScore={vm.highScore}
          comboMultiplier={vm.comboMultiplier}
        />
        <button className="options-btn" onClick={vm.onOptionsOpen} aria-label="Options">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      <div className="board-wrapper">
        <HexBoard cells={vm.cells} onCellClick={vm.onCellClick} />
        <MergeOverlay cells={vm.cells} lastMatch={vm.lastMatch} phase={vm.phase} />
      </div>

      <div className="bottom-controls">
        <TileQueue tiles={vm.tiles} />
      </div>

      {vm.gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-panel">
            {vm.isNewBest && <div className="game-over-panel__crown">New Best!</div>}
            <h1>Game Over</h1>
            <div className={`game-over-panel__score${vm.isNewBest ? ' game-over-panel__score--best' : ''}`}>
              Score: {vm.score.toLocaleString('en-US')}
            </div>
            <div className="game-over-panel__best">Best: {vm.highScore.toLocaleString('en-US')}</div>
            <div className="game-over-panel__stats">
              <span>{vm.totalClears} clears</span>
            </div>
            <div className="game-over-panel__actions">
              <button onClick={vm.onNewGame}>Play Again</button>
            </div>
          </div>
        </div>
      )}

      {vm.optionsOpen && (
        <OptionsModal
          settings={vm.settings}
          onUpdate={vm.onOptionsUpdate}
          onClose={vm.onOptionsClose}
          onRestart={vm.onRestart}
        />
      )}
    </div>
  )
}
