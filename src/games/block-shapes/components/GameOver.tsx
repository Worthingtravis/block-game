type GameOverProps = {
  score: number
  highScore: number
  onNewGame: () => void
  onReview?: () => void
  moveCount?: number
  maxCombo?: number
}

export default function GameOver({ score, highScore, onNewGame, onReview, moveCount, maxCombo }: GameOverProps) {
  const isNewBest = score >= highScore && score > 0

  return (
    <div className="game-over-overlay">
      <div className="game-over-panel">
        {isNewBest && <div className="game-over-panel__crown">New Best!</div>}
        <h1>Game Over</h1>
        <div className={`game-over-panel__score${isNewBest ? ' game-over-panel__score--best' : ''}`}>
          Score: {score}
        </div>
        <div className="game-over-panel__best">Best: {highScore}</div>
        {(moveCount != null || maxCombo != null) && (
          <div className="game-over-panel__stats">
            {moveCount != null && <span>{moveCount} moves</span>}
            {maxCombo != null && maxCombo > 1 && <span>Max combo x{maxCombo}</span>}
          </div>
        )}
        <div className="game-over-panel__actions">
          <button onClick={onNewGame}>Play Again</button>
          {onReview && (
            <button className="btn--secondary" onClick={onReview}>Review Game</button>
          )}
        </div>
      </div>
    </div>
  )
}
