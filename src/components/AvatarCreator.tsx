'use client';
import { useState, useCallback } from 'react';
import {
  AvatarConfig, DEFAULT_AVATAR, FACE_COLORS,
  EYE_COUNT, MOUTH_COUNT, COLOR_COUNT,
  encodeAvatar, decodeAvatar,
} from '@/lib/avatar';
import { AvatarSvg } from './AvatarDisplay';

interface AvatarCreatorProps {
  value?: string;
  onChange: (encoded: string) => void;
}

// ── Bouton fléché compact ─────────────────────────────────────────────────────
function Arr({ dir, onClick, color }: { dir: '‹' | '›'; onClick: () => void; color: string }) {
  const [down, setDown] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      onMouseLeave={() => setDown(false)}
      style={{
        width: 34, height: 34, borderRadius: 10,
        border: `2.5px solid #111`,
        background: '#fff',
        cursor: 'pointer',
        fontWeight: 900,
        fontSize: 26,
        lineHeight: '30px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
        transform: down ? 'translateY(2px)' : 'none',
        boxShadow: down ? `0 1px 0 #111` : `0 3px 0 #111`,
        transition: 'transform 0.06s, box-shadow 0.06s',
        color,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >{dir}</button>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function AvatarCreator({ value, onChange }: AvatarCreatorProps) {
  const [config, setConfig] = useState<AvatarConfig>(() => {
    if (value) { const d = decodeAvatar(value); if (d) return d; }
    return { ...DEFAULT_AVATAR };
  });

  const update = useCallback((key: keyof AvatarConfig, val: number) => {
    setConfig(prev => {
      const next = { ...prev, [key]: val };
      onChange(encodeAvatar(next));
      return next;
    });
  }, [onChange]);

  // Avatar size in pixels
  const AV = 148;
  // In the 100x100 viewBox:
  // Eyes at y≈42 → pixel = 42/100 * AV ≈ 62
  // Mouth at y≈68 → pixel = 68/100 * AV ≈ 101
  const eyeTop = Math.round((42 / 100) * AV) - 17; // center button on eye
  const mouthTop = Math.round((68 / 100) * AV) - 16;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>

      {/* Avatar + overlaid controls */}
      <div style={{ position: 'relative', width: AV + 80, height: AV }}>

        {/* Avatar centered */}
        <div style={{ position: 'absolute', left: 40, top: 0 }}>
          <AvatarSvg config={config} size={AV} />
        </div>

        {/* ── Yeux ── */}
        <div style={{ position: 'absolute', left: 0, top: eyeTop, display: 'flex', alignItems: 'center' }}>
          <Arr dir="‹" color="#60A5FA" onClick={() => update('eyes', (config.eyes - 1 + EYE_COUNT) % EYE_COUNT)} />
        </div>
        <div style={{ position: 'absolute', right: 0, top: eyeTop, display: 'flex', alignItems: 'center' }}>
          <Arr dir="›" color="#60A5FA" onClick={() => update('eyes', (config.eyes + 1) % EYE_COUNT)} />
        </div>

        {/* ── Bouche ── */}
        <div style={{ position: 'absolute', left: 0, top: mouthTop, display: 'flex', alignItems: 'center' }}>
          <Arr dir="‹" color="#F87171" onClick={() => update('mouth', (config.mouth - 1 + MOUTH_COUNT) % MOUTH_COUNT)} />
        </div>
        <div style={{ position: 'absolute', right: 0, top: mouthTop, display: 'flex', alignItems: 'center' }}>
          <Arr dir="›" color="#F87171" onClick={() => update('mouth', (config.mouth + 1) % MOUTH_COUNT)} />
        </div>
      </div>

      {/* Couleur — ligne compacte en dessous */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: AV + 80 }}>
        <Arr dir="‹" color="#C084FC" onClick={() => update('face', (config.face - 1 + COLOR_COUNT) % COLOR_COUNT)} />
        <div style={{ flex: 1, display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
          {FACE_COLORS.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => update('face', i)}
              style={{
                width: i === config.face % COLOR_COUNT ? 26 : 18,
                height: i === config.face % COLOR_COUNT ? 26 : 18,
                borderRadius: '50%',
                background: c,
                border: i === config.face % COLOR_COUNT ? '2.5px solid #fff' : '1.5px solid rgba(255,255,255,0.2)',
                boxShadow: i === config.face % COLOR_COUNT ? '0 0 0 1.5px rgba(0,0,0,0.5)' : 'none',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.1s',
              }}
            />
          ))}
        </div>
        <Arr dir="›" color="#C084FC" onClick={() => update('face', (config.face + 1) % COLOR_COUNT)} />
      </div>

    </div>
  );
}
