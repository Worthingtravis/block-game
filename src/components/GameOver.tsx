type GameOverProps = {
  score: number
  highScore: number
  onNewGame: () => void
}

export default function GameOver({ score, highScore, onNewGame }: GameOverProps) {
  return (
    <div
      className="game-over-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 100,
        animation: 'fadeIn 300ms ease-out',
      }}
    >
      <div style={{
        textAlign: 'center',
        padding: '32px',
        borderRadius: '16px',
        backgroundColor: 'var(--bg-board)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <h1 style={{ fontSize: '36px', marginBottom: '16px' }}>Game Over</h1>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>Score: {score}</div>
        <div style={{ fontSize: '18px', opacity: 0.7, marginBottom: '24px' }}>
          Best: {highScore}
        </div>
        <button
          onClick={onNewGame}
          style={{
            padding: '12px 32px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: 'var(--green)',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Play Again
        </button>
      </div>
    </div>
  )
}
