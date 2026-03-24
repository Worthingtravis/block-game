type GameOverProps = {
  score: number
  highScore: number
  onNewGame: () => void
  onReview?: () => void
}

export default function GameOver({ score, highScore, onNewGame, onReview }: GameOverProps) {
  return (
    <div className="game-over-overlay">
      <div className="game-over-panel">
        <h1>Game Over</h1>
        <div className="game-over-panel__score">Score: {score}</div>
        <div className="game-over-panel__best">Best: {highScore}</div>
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
