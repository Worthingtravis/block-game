type GameOverProps = {
  score: number
  highScore: number
  onNewGame: () => void
}

export default function GameOver({ score, highScore, onNewGame }: GameOverProps) {
  return (
    <div className="game-over-overlay">
      <div className="game-over-panel">
        <h1>Game Over</h1>
        <div className="game-over-panel__score">Score: {score}</div>
        <div className="game-over-panel__best">Best: {highScore}</div>
        <button onClick={onNewGame}>Play Again</button>
      </div>
    </div>
  )
}
