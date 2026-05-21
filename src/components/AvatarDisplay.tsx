import { useMemo } from 'react';
import { AvatarConfig, FACE_COLORS, decodeAvatar } from '@/lib/avatar';

// ── Helpers ───────────────────────────────────────────────────────────────────
function star5(cx: number, cy: number, ro: number, ri: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI / 5) - Math.PI / 2;
    const r = i % 2 === 0 ? ro : ri;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

// ── Yeux ──────────────────────────────────────────────────────────────────────
function Eyes({ n }: { n: number }) {
  switch (n % 6) {
    case 0: return ( // Gros yeux ronds
      <>
        <circle cx="35" cy="42" r="9" fill="#111" />
        <circle cx="65" cy="42" r="9" fill="#111" />
        <circle cx="37.5" cy="39.5" r="3.2" fill="#fff" />
        <circle cx="67.5" cy="39.5" r="3.2" fill="#fff" />
      </>
    );
    case 1: return ( // X eyes — comme la référence
      <>
        <line x1="26" y1="34" x2="44" y2="50" stroke="#111" strokeWidth="5.5" strokeLinecap="round" />
        <line x1="44" y1="34" x2="26" y2="50" stroke="#111" strokeWidth="5.5" strokeLinecap="round" />
        <line x1="56" y1="34" x2="74" y2="50" stroke="#111" strokeWidth="5.5" strokeLinecap="round" />
        <line x1="74" y1="34" x2="56" y2="50" stroke="#111" strokeWidth="5.5" strokeLinecap="round" />
      </>
    );
    case 2: return ( // Étoiles
      <>
        <polygon points={star5(35, 42, 9.5, 4)} fill="#FBBF24" stroke="#111" strokeWidth="1.5" />
        <polygon points={star5(65, 42, 9.5, 4)} fill="#FBBF24" stroke="#111" strokeWidth="1.5" />
      </>
    );
    case 3: return ( // ^^ yeux fermés joyeux
      <>
        <path d="M24 46 Q35 30 46 46" stroke="#111" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M54 46 Q65 30 76 46" stroke="#111" strokeWidth="5" fill="none" strokeLinecap="round" />
      </>
    );
    case 4: return ( // Spirales
      <>
        <circle cx="35" cy="42" r="9.5" fill="none" stroke="#111" strokeWidth="2.5" />
        <circle cx="35" cy="42" r="5.5" fill="none" stroke="#111" strokeWidth="2.5" />
        <circle cx="35" cy="42" r="2" fill="#111" />
        <circle cx="65" cy="42" r="9.5" fill="none" stroke="#111" strokeWidth="2.5" />
        <circle cx="65" cy="42" r="5.5" fill="none" stroke="#111" strokeWidth="2.5" />
        <circle cx="65" cy="42" r="2" fill="#111" />
      </>
    );
    case 5: return ( // Cœurs
      <>
        <circle cx="31" cy="39" r="5.5" fill="#FF4466" />
        <circle cx="39" cy="39" r="5.5" fill="#FF4466" />
        <polygon points="25,43 35,54 45,43" fill="#FF4466" />
        <circle cx="61" cy="39" r="5.5" fill="#FF4466" />
        <circle cx="69" cy="39" r="5.5" fill="#FF4466" />
        <polygon points="55,43 65,54 75,43" fill="#FF4466" />
      </>
    );
    default: return null;
  }
}

// ── Bouche ────────────────────────────────────────────────────────────────────
function Mouth({ n }: { n: number }) {
  switch (n % 6) {
    case 0: return ( // Grand sourire à dents — référence
      <>
        <path d="M25 62 Q50 86 75 62 L75 70 Q50 90 25 70 Z" fill="#111" />
        <rect x="30" y="65" width="13" height="9" rx="1" fill="#fff" />
        <rect x="44" y="64" width="12" height="10" rx="1" fill="#fff" />
        <rect x="57" y="65" width="13" height="9" rx="1" fill="#fff" />
      </>
    );
    case 1: return ( // Langue tirée
      <>
        <path d="M27 63 Q50 83 73 63 L73 70 Q50 86 27 70 Z" fill="#111" />
        <rect x="33" y="65" width="11" height="8" rx="1" fill="#fff" />
        <rect x="45" y="65" width="10" height="8" rx="1" fill="#fff" />
        <rect x="57" y="65" width="11" height="8" rx="1" fill="#fff" />
        <ellipse cx="50" cy="76" rx="10" ry="9" fill="#FF6688" />
      </>
    );
    case 2: return ( // Bouche ouverte surprise
      <>
        <ellipse cx="50" cy="70" rx="15" ry="14" fill="#111" />
        <ellipse cx="50" cy="71" rx="11" ry="10" fill="#CC2233" />
      </>
    );
    case 3: return ( // Grimace
      <path d="M28 78 Q50 60 72 78" stroke="#111" strokeWidth="5" fill="none" strokeLinecap="round" />
    );
    case 4: return ( // Zigzag
      <polyline
        points="24,66 35,57 46,68 57,57 68,68 76,62"
        stroke="#111" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
    );
    case 5: return ( // Bouche de chat
      <>
        <path d="M36 68 Q42 78 50 72 Q58 78 64 68" stroke="#111" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50 72 L50 80" stroke="#111" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="50" cy="64" r="2.5" fill="#111" />
      </>
    );
    default: return null;
  }
}

// ── SVG complet ───────────────────────────────────────────────────────────────
export function AvatarSvg({ config, size }: { config: AvatarConfig; size: number }) {
  const color = FACE_COLORS[config.face % FACE_COLORS.length];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      {/* Corps visible en bas */}
      <rect x="31" y="77" width="38" height="23" rx="7" fill={color} stroke="#111" strokeWidth="3.5" />

      {/* Oreilles/joues latérales */}
      <circle cx="17" cy="52" r="10" fill={color} stroke="#111" strokeWidth="3.5" />
      <circle cx="83" cy="52" r="10" fill={color} stroke="#111" strokeWidth="3.5" />
      {/* Ombre joues */}
      <circle cx="17" cy="54" r="6" fill="rgba(0,0,0,0.12)" />
      <circle cx="83" cy="54" r="6" fill="rgba(0,0,0,0.12)" />

      {/* Tête */}
      <circle cx="50" cy="46" r="34" fill={color} stroke="#111" strokeWidth="4" />

      {/* Expressions */}
      <Eyes n={config.eyes} />
      <Mouth n={config.mouth} />
    </svg>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────
export function AvatarDisplay({ emoji, size = 48 }: { emoji: string; size?: number }) {
  const config = useMemo(() => decodeAvatar(emoji), [emoji]);

  if (!config) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.round(size * 0.55), flexShrink: 0,
      }}>
        {emoji}
      </div>
    );
  }
  return <AvatarSvg config={config} size={size} />;
}

export default AvatarDisplay;
