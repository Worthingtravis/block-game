import { useState, useCallback } from 'react'
import { BlockHexView } from './BlockHex'
import { useGameState } from './hooks/useGameState'
import { useAudio } from './hooks/useAudio'
import { useSettings } from '../../shared/useSettings'
import { buildCells, buildTiles } from './block-hex.vm'
import type { BlockHexVM } from './block-hex.vm'

type BlockHexConnectedProps = {
  onBack: () => void
}

export default function BlockHexConnected({ onBack }: BlockHexConnectedProps) {
  const { state, placeTileAt, newGame } = useGameState()
  const { settings, update: updateSettings } = useSettings()
  const [optionsOpen, setOptionsOpen] = useState(false)

  useAudio(state)

  const handleRestart = useCallback(() => {
    setOptionsOpen(false)
    newGame()
  }, [newGame])

  const vm: BlockHexVM = {
    cells: buildCells(state.board, state.lastMatch),
    phase: state.phase,
    tiles: buildTiles(state.queue),
    score: state.score,
    highScore: state.highScore,
    comboMultiplier: state.chainStep > 0 ? state.chainStep + 1 : 1,
    gameOver: state.gameOver,
    isNewBest: state.score >= state.highScore && state.score > 0,
    totalClears: state.totalClears,
    onCellClick: placeTileAt,
    onBack,
    onNewGame: newGame,
    onOptionsOpen: () => setOptionsOpen(true),
    onOptionsClose: () => setOptionsOpen(false),
    onOptionsUpdate: updateSettings,
    onRestart: handleRestart,
    optionsOpen,
    settings,
  }

  return <BlockHexView {...vm} />
}
