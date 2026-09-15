'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarConfig, FACE_COLORS, decodeAvatar } from '@/lib/avatar';

// ── Cache de textures ─────────────────────────────────────────────────────────
const avatarTexCache = new Map<string, THREE.CanvasTexture>();

// ── Dessin des yeux sur Canvas ────────────────────────────────────────────────
function drawEyes(c: CanvasRenderingContext2D, n: number, W: number) {
  const s = W / 100; // facteur d'échelle
  c.save();

  switch (n % 6) {
    case 0: { // Gros yeux ronds
      c.fillStyle = '#111';
      c.beginPath(); c.arc(35 * s, 42 * s, 9 * s, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(65 * s, 42 * s, 9 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(37.5 * s, 39.5 * s, 3.2 * s, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(67.5 * s, 39.5 * s, 3.2 * s, 0, Math.PI * 2); c.fill();
      break;
    }
    case 1: { // X eyes
      c.strokeStyle = '#111';
      c.lineWidth = 5.5 * s;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(26 * s, 34 * s); c.lineTo(44 * s, 50 * s); c.stroke();
      c.beginPath(); c.moveTo(44 * s, 34 * s); c.lineTo(26 * s, 50 * s); c.stroke();
      c.beginPath(); c.moveTo(56 * s, 34 * s); c.lineTo(74 * s, 50 * s); c.stroke();
      c.beginPath(); c.moveTo(74 * s, 34 * s); c.lineTo(56 * s, 50 * s); c.stroke();
      break;
    }
    case 2: { // Étoiles dorées
      const drawStar = (cx: number, cy: number, ro: number, ri: number) => {
        c.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI / 5) - Math.PI / 2;
          const r = i % 2 === 0 ? ro : ri;
          if (i === 0) c.moveTo((cx + r * Math.cos(a)) * s, (cy + r * Math.sin(a)) * s);
          else c.lineTo((cx + r * Math.cos(a)) * s, (cy + r * Math.sin(a)) * s);
        }
        c.closePath();
      };
      c.fillStyle = '#FBBF24';
      c.strokeStyle = '#111';
      c.lineWidth = 1.5 * s;
      drawStar(35, 42, 9.5, 4); c.fill(); c.stroke();
      drawStar(65, 42, 9.5, 4); c.fill(); c.stroke();
      break;
    }
    case 3: { // ^^ yeux fermés joyeux
      c.strokeStyle = '#111';
      c.lineWidth = 5 * s;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(24 * s, 46 * s);
      c.quadraticCurveTo(35 * s, 30 * s, 46 * s, 46 * s);
      c.stroke();
      c.beginPath();
      c.moveTo(54 * s, 46 * s);
      c.quadraticCurveTo(65 * s, 30 * s, 76 * s, 46 * s);
      c.stroke();
      break;
    }
    case 4: { // Spirales
      c.strokeStyle = '#111';
      c.fillStyle = '#111';
      for (const cx of [35, 65]) {
        c.lineWidth = 2.5 * s;
        c.beginPath(); c.arc(cx * s, 42 * s, 9.5 * s, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.arc(cx * s, 42 * s, 5.5 * s, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.arc(cx * s, 42 * s, 2 * s, 0, Math.PI * 2); c.fill();
      }
      break;
    }
    case 5: { // Cœurs
      c.fillStyle = '#FF4466';
      for (const cx of [35, 65]) {
        c.beginPath(); c.arc((cx - 4) * s, 39 * s, 5.5 * s, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc((cx + 4) * s, 39 * s, 5.5 * s, 0, Math.PI * 2); c.fill();
        c.beginPath();
        c.moveTo((cx - 10) * s, 43 * s);
        c.lineTo(cx * s, 54 * s);
        c.lineTo((cx + 10) * s, 43 * s);
        c.closePath();
        c.fill();
      }
      break;
    }
  }
  c.restore();
}

// ── Dessin de la bouche sur Canvas ────────────────────────────────────────────
function drawMouth(c: CanvasRenderingContext2D, n: number, W: number) {
  const s = W / 100;
  c.save();

  switch (n % 6) {
    case 0: { // Grand sourire à dents
      c.fillStyle = '#111';
      c.beginPath();
      c.moveTo(25 * s, 62 * s);
      c.quadraticCurveTo(50 * s, 86 * s, 75 * s, 62 * s);
      c.lineTo(75 * s, 70 * s);
      c.quadraticCurveTo(50 * s, 90 * s, 25 * s, 70 * s);
      c.closePath();
      c.fill();
      c.fillStyle = '#fff';
      c.fillRect(30 * s, 65 * s, 13 * s, 9 * s);
      c.fillRect(44 * s, 64 * s, 12 * s, 10 * s);
      c.fillRect(57 * s, 65 * s, 13 * s, 9 * s);
      break;
    }
    case 1: { // Langue tirée
      c.fillStyle = '#111';
      c.beginPath();
      c.moveTo(27 * s, 63 * s);
      c.quadraticCurveTo(50 * s, 83 * s, 73 * s, 63 * s);
      c.lineTo(73 * s, 70 * s);
      c.quadraticCurveTo(50 * s, 86 * s, 27 * s, 70 * s);
      c.closePath();
      c.fill();
      c.fillStyle = '#fff';
      c.fillRect(33 * s, 65 * s, 11 * s, 8 * s);
      c.fillRect(45 * s, 65 * s, 10 * s, 8 * s);
      c.fillRect(57 * s, 65 * s, 11 * s, 8 * s);
      c.fillStyle = '#FF6688';
      c.beginPath();
      c.ellipse(50 * s, 76 * s, 10 * s, 9 * s, 0, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 2: { // Bouche ouverte surprise
      c.fillStyle = '#111';
      c.beginPath();
      c.ellipse(50 * s, 70 * s, 15 * s, 14 * s, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#CC2233';
      c.beginPath();
      c.ellipse(50 * s, 71 * s, 11 * s, 10 * s, 0, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 3: { // Grimace
      c.strokeStyle = '#111';
      c.lineWidth = 5 * s;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(28 * s, 78 * s);
      c.quadraticCurveTo(50 * s, 60 * s, 72 * s, 78 * s);
      c.stroke();
      break;
    }
    case 4: { // Zigzag
      c.strokeStyle = '#111';
      c.lineWidth = 5 * s;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(24 * s, 66 * s);
      c.lineTo(35 * s, 57 * s);
      c.lineTo(46 * s, 68 * s);
      c.lineTo(57 * s, 57 * s);
      c.lineTo(68 * s, 68 * s);
      c.lineTo(76 * s, 62 * s);
      c.stroke();
      break;
    }
    case 5: { // Bouche de chat
      c.strokeStyle = '#111';
      c.lineWidth = 4 * s;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(36 * s, 68 * s);
      c.quadraticCurveTo(42 * s, 78 * s, 50 * s, 72 * s);
      c.quadraticCurveTo(58 * s, 78 * s, 64 * s, 68 * s);
      c.stroke();
      // Ligne verticale
      c.lineWidth = 3.5 * s;
      c.beginPath();
      c.moveTo(50 * s, 72 * s);
      c.lineTo(50 * s, 80 * s);
      c.stroke();
      // Nez
      c.fillStyle = '#111';
      c.beginPath();
      c.arc(50 * s, 64 * s, 2.5 * s, 0, Math.PI * 2);
      c.fill();
      break;
    }
  }
  c.restore();
}

// ── Génération de la texture de face ──────────────────────────────────────────
function getAvatarFaceTexture(config: AvatarConfig): THREE.CanvasTexture {
  const key = `${config.face}-${config.eyes}-${config.mouth}`;
  if (avatarTexCache.has(key)) return avatarTexCache.get(key)!;

  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const c = cv.getContext('2d')!;

  // Fond : couleur de la face
  const faceColor = FACE_COLORS[config.face % FACE_COLORS.length];
  c.fillStyle = faceColor;
  c.fillRect(0, 0, S, S);

  // Oreilles / joues (cercles latéraux)
  c.beginPath(); c.arc(S * 0.12, S * 0.52, S * 0.09, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(S * 0.88, S * 0.52, S * 0.09, 0, Math.PI * 2); c.fill();
  // Ombre joues
  c.fillStyle = 'rgba(0,0,0,0.10)';
  c.beginPath(); c.arc(S * 0.12, S * 0.54, S * 0.06, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(S * 0.88, S * 0.54, S * 0.06, 0, Math.PI * 2); c.fill();

  // Dessiner yeux et bouche
  drawEyes(c, config.eyes, S);
  drawMouth(c, config.mouth, S);

  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  avatarTexCache.set(key, tex);
  return tex;
}

// ── Tête 3D low-poly ──────────────────────────────────────────────────────────
function Avatar3DHead({ config }: { config: AvatarConfig }) {
  const faceTex = useMemo(() => getAvatarFaceTexture(config), [config]);

  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({
      map: faceTex,
      roughness: 0.7,
      metalness: 0.05,
    }),
    [faceTex]
  );

  // Géométrie sphère low-poly (8×6 segments)
  const geo = useMemo(() => new THREE.SphereGeometry(0.35, 8, 6), []);

  return <mesh geometry={geo} material={mat} castShadow />;
}

// ── Socle de pierre ───────────────────────────────────────────────────────────
function AvatarPedestal() {
  return (
    <group>
      {/* Socle principal */}
      <mesh position={[0, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 0.22, 8]} />
        <meshStandardMaterial color="#8a8070" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Base élargie */}
      <mesh position={[0, -0.62, 0]}>
        <cylinderGeometry args={[0.34, 0.38, 0.06, 8]} />
        <meshStandardMaterial color="#7a7068" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Plaque de nom ─────────────────────────────────────────────────────────────
function NamePlate({ username }: { username: string }) {
  return (
    <Html
      position={[0, -0.72, 0]}
      center
      style={{ pointerEvents: 'none' }}
    >
      <div style={{
        background: 'rgba(8,14,28,0.78)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 6,
        padding: '2px 10px',
        whiteSpace: 'nowrap',
        fontSize: 10,
        fontWeight: 700,
        color: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        letterSpacing: 0.5,
      }}>
        {username}
      </div>
    </Html>
  );
}

// ── Composant Avatar 3D assemblé ──────────────────────────────────────────────
export interface Avatar3DProps {
  emoji: string;
  username: string;
  position: [number, number, number];
  scale?: number;
}

export function Avatar3D({ emoji, username, position, scale = 1 }: Avatar3DProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const config = useMemo(() => decodeAvatar(emoji), [emoji]);

  // Animation idle : léger balancement vertical
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 1.8) * 0.015;
  });

  if (!config) {
    // Fallback : sphère grise si avatar non décodable
    return (
      <group position={position} scale={[scale, scale, scale]}>
        <mesh castShadow>
          <sphereGeometry args={[0.35, 8, 6]} />
          <meshStandardMaterial color="#888" roughness={0.7} />
        </mesh>
        <AvatarPedestal />
        <NamePlate username={username} />
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      <Avatar3DHead config={config} />
      <AvatarPedestal />
      <NamePlate username={username} />
    </group>
  );
}

export default Avatar3D;
