const posterCards = [
  ['A♠', 'K♥', '7♦', 'Q♣', '9♠', '10♥', 'J♦', '8♣'],
  ['7♠', '8♠', '9♠', 'K♦', 'Q♥', 'A♣', '10♠', 'J♥'],
  ['K♣', '7♥', '8♥', '9♥', 'Q♦', 'J♣', '10♦', 'A♥'],
  ['9♣', '8♦', '7♣', 'K♠', 'Q♠', 'J♠', '10♣', 'A♦'],
];

/**
 * Affiche un mur de cartes inclinées avec un voile sombre lisible.
 */
export default function CardPosterBackground() {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '-10vh -8vw',
          overflow: 'hidden',
          transform: 'rotate(-13deg) scale(1.12)',
          transformOrigin: 'center',
        }}
      >
        {posterCards.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'flex',
              gap: 18,
              marginBottom: 18,
              transform: `translateX(${rowIndex % 2 === 0 ? '-6%' : '-18%'})`,
            }}
          >
            {[...row, ...row].map((label, cardIndex) => {
              const [value, suit] = [label.slice(0, -1), label.slice(-1)];
              const isRed = suit === '♥' || suit === '♦';

              return (
                <div
                  key={`${rowIndex}-${cardIndex}-${label}`}
                  style={{
                    width: 'clamp(112px, 12vw, 210px)',
                    aspectRatio: '2 / 3',
                    flex: '0 0 auto',
                    borderRadius: 14,
                    background: '#fffef8',
                    border: '2px solid rgba(15,23,42,0.38)',
                    boxShadow: '0 20px 38px rgba(0,0,0,0.58)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 10,
                      border: '2px solid rgba(15,23,42,0.14)',
                      borderRadius: 10,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: 18,
                      top: 16,
                      color: isRed ? '#dc2626' : '#111827',
                      fontFamily: 'Georgia, serif',
                      fontWeight: 900,
                      fontSize: 'clamp(26px, 3vw, 48px)',
                      lineHeight: 0.9,
                      textShadow: '0 2px 12px rgba(255,255,255,0.38)',
                    }}
                  >
                    <div>{value}</div>
                    <div>{suit}</div>
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isRed ? 'rgba(220,38,38,0.82)' : 'rgba(17,24,39,0.82)',
                      fontFamily: 'Georgia, serif',
                      fontWeight: 900,
                      fontSize: 'clamp(58px, 7vw, 128px)',
                      transform: 'translateY(8%)',
                    }}
                  >
                    {suit}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(2,6,23,0.28) 0%, rgba(2,6,23,0.66) 54%, rgba(0,0,0,0.92) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.18) 38%, rgba(0,0,0,0.72) 100%)',
        }}
      />
    </>
  );
}
