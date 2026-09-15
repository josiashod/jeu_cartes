'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Textures procédurales ─────────────────────────────────────────────────────

/** Texture bois avec grain et gravures géométriques */
function createWoodTexture(width = 512, height = 512, baseColor = '#8B6914', withEngravings = false): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = width; cv.height = height;
  const c = cv.getContext('2d')!;

  // Fond bois de base
  c.fillStyle = baseColor;
  c.fillRect(0, 0, width, height);

  // Grain de bois : lignes horizontales semi-transparentes
  for (let i = 0; i < height; i += 2) {
    const alpha = 0.03 + Math.sin(i * 0.15) * 0.02 + Math.random() * 0.02;
    c.fillStyle = `rgba(0,0,0,${alpha})`;
    c.fillRect(0, i, width, 1);
  }
  // Veines de bois plus larges
  for (let i = 0; i < 12; i++) {
    const y = Math.random() * height;
    const thickness = 1 + Math.random() * 3;
    c.fillStyle = `rgba(60,30,10,${0.06 + Math.random() * 0.06})`;
    c.fillRect(0, y, width, thickness);
  }

  // Gravures géométriques (bordure dorée)
  if (withEngravings) {
    const m = 16; // marge
    c.strokeStyle = 'rgba(218,175,80,0.35)';
    c.lineWidth = 2;
    // Cadre extérieur
    c.strokeRect(m, m, width - m * 2, height - m * 2);
    // Cadre intérieur
    c.strokeRect(m + 8, m + 8, width - (m + 8) * 2, height - (m + 8) * 2);
    // Motifs en losange dans les coins
    const dSize = 14;
    for (const [cx, cy] of [[m + 20, m + 20], [width - m - 20, m + 20], [m + 20, height - m - 20], [width - m - 20, height - m - 20]]) {
      c.beginPath();
      c.moveTo(cx, cy - dSize); c.lineTo(cx + dSize, cy);
      c.lineTo(cx, cy + dSize); c.lineTo(cx - dSize, cy);
      c.closePath();
      c.fillStyle = 'rgba(218,175,80,0.2)';
      c.fill();
      c.stroke();
    }
    // Petits chevrons le long des bords
    c.strokeStyle = 'rgba(218,175,80,0.2)';
    c.lineWidth = 1.5;
    for (let x = m + 50; x < width - m - 50; x += 30) {
      c.beginPath(); c.moveTo(x, m + 4); c.lineTo(x + 6, m + 10); c.lineTo(x + 12, m + 4); c.stroke();
      c.beginPath(); c.moveTo(x, height - m - 4); c.lineTo(x + 6, height - m - 10); c.lineTo(x + 12, height - m - 4); c.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** Texture feutre avec tissage subtil */
function createFeltTexture(): THREE.CanvasTexture {
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = S; cv.height = S;
  const c = cv.getContext('2d')!;

  // Fond vert feutrine
  c.fillStyle = '#1a5e30';
  c.fillRect(0, 0, S, S);

  // Micro-bruit de tissu
  for (let y = 0; y < S; y += 2) {
    for (let x = 0; x < S; x += 2) {
      const noise = Math.random() * 0.06;
      c.fillStyle = `rgba(0,0,0,${noise})`;
      c.fillRect(x, y, 2, 2);
    }
  }

  // Trame tissée : lignes croisées subtiles
  c.globalAlpha = 0.04;
  c.strokeStyle = '#0d3d1f';
  c.lineWidth = 1;
  for (let i = 0; i < S; i += 6) {
    c.beginPath(); c.moveTo(i, 0); c.lineTo(i, S); c.stroke();
    c.beginPath(); c.moveTo(0, i); c.lineTo(S, i); c.stroke();
  }
  c.globalAlpha = 1;

  // Bordure intérieure subtile du feutre (ligne de couture)
  c.strokeStyle = 'rgba(30,104,54,0.5)';
  c.lineWidth = 3;
  const bm = 30;
  c.beginPath();
  c.roundRect(bm, bm, S - bm * 2, S - bm * 2, 12);
  c.stroke();

  // Motifs ornementaux dans les coins du feutre
  c.strokeStyle = 'rgba(30,104,54,0.35)';
  c.lineWidth = 2;
  const cm = 50;
  const cl = 35;
  // Coins : petites volutes
  for (const [ox, oy, sx, sy] of [[cm, cm, 1, 1], [S - cm, cm, -1, 1], [cm, S - cm, 1, -1], [S - cm, S - cm, -1, -1]] as [number, number, number, number][]) {
    c.save();
    c.translate(ox, oy);
    c.scale(sx, sy);
    c.beginPath();
    c.moveTo(0, -cl); c.quadraticCurveTo(0, 0, cl, 0);
    c.stroke();
    c.beginPath();
    c.moveTo(0, -cl + 8); c.quadraticCurveTo(8, 8, cl - 8, 0);
    c.stroke();
    c.restore();
  }

  // Flèches décoratives le long des bords
  c.strokeStyle = 'rgba(30,104,54,0.25)';
  c.lineWidth = 1.5;
  for (let x = cm + 30; x < S - cm - 30; x += 40) {
    // Haut
    c.beginPath(); c.moveTo(x, bm + 10); c.lineTo(x + 8, bm + 18); c.lineTo(x + 16, bm + 10); c.stroke();
    // Bas
    c.beginPath(); c.moveTo(x, S - bm - 10); c.lineTo(x + 8, S - bm - 18); c.lineTo(x + 16, S - bm - 10); c.stroke();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** Texture du médaillon central ornementé */
function createMedallionTexture(): THREE.CanvasTexture {
  const S = 1024;
  const cv = document.createElement('canvas');
  cv.width = S; cv.height = S;
  const c = cv.getContext('2d')!;
  const cx = S / 2, cy = S / 2;

  // Fond transparent
  c.clearRect(0, 0, S, S);

  // Anneaux concentriques
  const rings = [
    { r: 80, w: 4, alpha: 0.5 },
    { r: 130, w: 3, alpha: 0.4 },
    { r: 180, w: 5, alpha: 0.45 },
    { r: 240, w: 3, alpha: 0.35 },
    { r: 300, w: 4, alpha: 0.3 },
    { r: 370, w: 3, alpha: 0.25 },
    { r: 420, w: 2, alpha: 0.2 },
  ];
  for (const { r, w, alpha } of rings) {
    c.strokeStyle = `rgba(30,104,54,${alpha})`;
    c.lineWidth = w;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
  }

  // Étoile centrale (8 branches)
  c.strokeStyle = 'rgba(30,104,54,0.5)';
  c.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const inner = 30, outer = 100;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    c.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    c.stroke();
  }

  // Petits losanges entre les anneaux
  c.fillStyle = 'rgba(30,104,54,0.25)';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r = 210;
    const ds = 10;
    c.save();
    c.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    c.rotate(a);
    c.beginPath();
    c.moveTo(0, -ds); c.lineTo(ds * 0.6, 0);
    c.lineTo(0, ds); c.lineTo(-ds * 0.6, 0);
    c.closePath();
    c.fill();
    c.restore();
  }

  // Petits arcs décoratifs
  c.strokeStyle = 'rgba(30,104,54,0.3)';
  c.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    c.beginPath();
    c.arc(cx, cy, 155, a - 0.15, a + 0.15);
    c.stroke();
  }

  // Points cardinaux : petites flèches
  c.fillStyle = 'rgba(30,104,54,0.35)';
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
    const r = 340;
    const s = 12;
    c.save();
    c.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    c.rotate(a + Math.PI / 2);
    c.beginPath();
    c.moveTo(0, -s); c.lineTo(s * 0.7, s * 0.5); c.lineTo(-s * 0.7, s * 0.5);
    c.closePath();
    c.fill();
    c.restore();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  return tex;
}

/** Texture de pierre avec craquelures */
function createStoneTexture(base = '#9E9E9E'): THREE.CanvasTexture {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = S; cv.height = S;
  const c = cv.getContext('2d')!;

  c.fillStyle = base;
  c.fillRect(0, 0, S, S);

  // Bruit granuleux
  for (let y = 0; y < S; y += 2) {
    for (let x = 0; x < S; x += 2) {
      c.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
      c.fillRect(x, y, 2, 2);
    }
  }
  // Craquelures
  c.strokeStyle = 'rgba(0,0,0,0.08)';
  c.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    c.beginPath();
    c.moveTo(Math.random() * S, Math.random() * S);
    c.lineTo(Math.random() * S, Math.random() * S);
    c.stroke();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ── Cache de textures (créées une seule fois) ─────────────────────────────────
let _woodTex: THREE.CanvasTexture | null = null;
let _woodEngraveTex: THREE.CanvasTexture | null = null;
let _darkWoodTex: THREE.CanvasTexture | null = null;
let _feltTex: THREE.CanvasTexture | null = null;
let _medallionTex: THREE.CanvasTexture | null = null;
let _stoneTex: THREE.CanvasTexture | null = null;

function getWoodTex() { return _woodTex ??= createWoodTexture(512, 512, '#8B6914', false); }
function getWoodEngraveTex() { return _woodEngraveTex ??= createWoodTexture(512, 512, '#8B6914', true); }
function getDarkWoodTex() { return _darkWoodTex ??= createWoodTexture(512, 256, '#5C4033', false); }
function getFeltTex() { return _feltTex ??= createFeltTexture(); }
function getMedallionTex() { return _medallionTex ??= createMedallionTexture(); }
function getStoneTex() { return _stoneTex ??= createStoneTexture(); }

// ── Plateau de jeu 3D ─────────────────────────────────────────────────────────
export function GameBoard3D() {
  const woodTex = useMemo(() => getWoodTex(), []);
  const woodEngraveTex = useMemo(() => getWoodEngraveTex(), []);
  const darkWoodTex = useMemo(() => getDarkWoodTex(), []);
  const feltTex = useMemo(() => getFeltTex(), []);

  return (
    <group>
      {/* Base inférieure — bois foncé massif */}
      <mesh position={[0, -0.4, 0]} receiveShadow castShadow>
        <boxGeometry args={[11.2, 0.3, 9.2]} />
        <meshStandardMaterial map={darkWoodTex} roughness={0.85} metalness={0.02} />
      </mesh>

      {/* Couche intermédiaire — chanfrein */}
      <mesh position={[0, -0.2, 0]} receiveShadow castShadow>
        <boxGeometry args={[10.8, 0.12, 8.8]} />
        <meshStandardMaterial map={darkWoodTex} roughness={0.8} metalness={0.03} />
      </mesh>

      {/* Cadre bois gravé — rail supérieur (4 côtés) */}
      {/* Avant */}
      <mesh position={[0, 0.04, 4.05]} receiveShadow castShadow>
        <boxGeometry args={[10.1, 0.28, 0.4]} />
        <meshStandardMaterial map={woodEngraveTex} roughness={0.55} metalness={0.12} />
      </mesh>
      {/* Arrière */}
      <mesh position={[0, 0.04, -4.05]} receiveShadow castShadow>
        <boxGeometry args={[10.1, 0.28, 0.4]} />
        <meshStandardMaterial map={woodEngraveTex} roughness={0.55} metalness={0.12} />
      </mesh>
      {/* Gauche */}
      <mesh position={[-4.85, 0.04, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 0.28, 8.5]} />
        <meshStandardMaterial map={woodEngraveTex} roughness={0.55} metalness={0.12} />
      </mesh>
      {/* Droite */}
      <mesh position={[4.85, 0.04, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 0.28, 8.5]} />
        <meshStandardMaterial map={woodEngraveTex} roughness={0.55} metalness={0.12} />
      </mesh>

      {/* Filet intérieur doré (fine ligne le long du cadre) */}
      <mesh position={[0, 0.1, 3.77]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9.3, 0.04]} />
        <meshStandardMaterial color="#d4a830" emissive="#d4a830" emissiveIntensity={0.15} metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.1, -3.77]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9.3, 0.04]} />
        <meshStandardMaterial color="#d4a830" emissive="#d4a830" emissiveIntensity={0.15} metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[-4.58, 0.1, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[7.5, 0.04]} />
        <meshStandardMaterial color="#d4a830" emissive="#d4a830" emissiveIntensity={0.15} metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[4.58, 0.1, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[7.5, 0.04]} />
        <meshStandardMaterial color="#d4a830" emissive="#d4a830" emissiveIntensity={0.15} metalness={0.4} roughness={0.3} />
      </mesh>

      {/* Blocs d'angle renforcés — bois tourné */}
      {([[-4.85, 4.05], [4.85, 4.05], [-4.85, -4.05], [4.85, -4.05]] as [number, number][]).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
            <boxGeometry args={[0.65, 0.35, 0.65]} />
            <meshStandardMaterial map={woodTex} color="#6B4226" roughness={0.7} metalness={0.05} />
          </mesh>
          {/* Bouton décoratif sur chaque coin */}
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.06, 8]} />
            <meshStandardMaterial color="#d4a830" metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Surface en feutre texturé */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9.3, 7.7]} />
        <meshStandardMaterial map={feltTex} roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
}

// ── Médaillon central ornementé ───────────────────────────────────────────────
export function FeltMedallion() {
  const tex = useMemo(() => getMedallionTex(), []);

  return (
    <mesh position={[0, 0.012, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[4.2, 4.2]} />
      <meshBasicMaterial map={tex} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Cristal animé ─────────────────────────────────────────────────────────────
interface CrystalProps {
  position: [number, number, number];
  color?: string;
  scale?: number;
}

export function Crystal({ position, color = '#2DD4BF', scale = 1 }: CrystalProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const seed = useMemo(() => position[0] * 7.3 + position[2] * 3.1, [position]);

  // Rotation lente + léger bob vertical
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.4 + seed;
    meshRef.current.position.y = position[1] + Math.sin(t * 1.2 + seed) * 0.02;
  });

  return (
    <group>
      <mesh ref={meshRef} position={position} castShadow>
        <octahedronGeometry args={[0.15 * scale, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.7}
          transparent
          opacity={0.82}
          roughness={0.15}
          metalness={0.35}
        />
      </mesh>
      {/* Halo lumineux au sol */}
      <mesh position={[position[0], 0.013, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3 * scale, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>
      <pointLight position={position} color={color} intensity={0.18} distance={3} />
    </group>
  );
}

// ── Lanterne avec flamme vacillante ───────────────────────────────────────────
interface LanternProps {
  position: [number, number, number];
}

export function Lantern({ position }: LanternProps) {
  const lightRef = useRef<THREE.PointLight>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const seed = useMemo(() => position[0] * 5.7 + position[2] * 2.3, [position]);

  // Vacillement de lumière
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const flicker = 0.25 + Math.sin(t * 8 + seed) * 0.05 + Math.sin(t * 13 + seed * 2) * 0.03;
    if (lightRef.current) lightRef.current.intensity = flicker;
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + Math.sin(t * 6 + seed) * 0.15;
    }
  });

  return (
    <group position={position}>
      {/* Plaque de base */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 0.04, 6]} />
        <meshStandardMaterial color="#4a3520" roughness={0.85} />
      </mesh>
      {/* Poteau */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.4, 6]} />
        <meshStandardMaterial color="#4a3520" roughness={0.8} />
      </mesh>
      {/* Corps vitré de la lampe */}
      <mesh ref={glowRef} position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[0.14, 0.18, 0.14]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={0.5}
          transparent
          opacity={0.88}
          roughness={0.2}
        />
      </mesh>
      {/* Chapeau */}
      <mesh position={[0, 0.59, 0]} castShadow>
        <boxGeometry args={[0.2, 0.04, 0.2]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Pointe du chapeau */}
      <mesh position={[0, 0.64, 0]}>
        <coneGeometry args={[0.05, 0.08, 4]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Halo lumineux au sol */}
      <mesh position={[0, 0.013, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 16]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.06} />
      </mesh>
      {/* Lumière */}
      <pointLight ref={lightRef} position={[0, 0.48, 0]} color="#f5a623" intensity={0.3} distance={4} />
    </group>
  );
}

// ── Arche en pierre texturée ──────────────────────────────────────────────────
interface StoneArchProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

export function StoneArch({ position, rotation = [0, 0, 0] }: StoneArchProps) {
  const stoneTex = useMemo(() => getStoneTex(), []);

  return (
    <group position={position} rotation={rotation}>
      {/* Pilier gauche */}
      <mesh position={[-0.2, 0.225, 0]} castShadow>
        <boxGeometry args={[0.12, 0.45, 0.12]} />
        <meshStandardMaterial map={stoneTex} color="#b0a898" roughness={0.9} />
      </mesh>
      {/* Base pilier gauche */}
      <mesh position={[-0.2, 0.01, 0]}>
        <boxGeometry args={[0.16, 0.03, 0.16]} />
        <meshStandardMaterial map={stoneTex} color="#9a9080" roughness={0.9} />
      </mesh>
      {/* Pilier droit */}
      <mesh position={[0.2, 0.225, 0]} castShadow>
        <boxGeometry args={[0.12, 0.45, 0.12]} />
        <meshStandardMaterial map={stoneTex} color="#b0a898" roughness={0.9} />
      </mesh>
      {/* Base pilier droit */}
      <mesh position={[0.2, 0.01, 0]}>
        <boxGeometry args={[0.16, 0.03, 0.16]} />
        <meshStandardMaterial map={stoneTex} color="#9a9080" roughness={0.9} />
      </mesh>
      {/* Arche supérieure */}
      <mesh position={[0, 0.46, 0]} castShadow>
        <torusGeometry args={[0.2, 0.06, 6, 12, Math.PI]} />
        <meshStandardMaterial map={stoneTex} color="#c0b8a8" roughness={0.85} />
      </mesh>
      {/* Clé de voûte */}
      <mesh position={[0, 0.66, 0]} castShadow>
        <boxGeometry args={[0.08, 0.08, 0.08]} />
        <meshStandardMaterial map={stoneTex} color="#d4c8b0" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ── Pilier de pierre ──────────────────────────────────────────────────────────
interface StonePillarProps {
  position: [number, number, number];
  height?: number;
}

export function StonePillar({ position, height = 0.4 }: StonePillarProps) {
  const stoneTex = useMemo(() => getStoneTex(), []);

  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.2, 0.04, 0.2]} />
        <meshStandardMaterial map={stoneTex} color="#7a7a7a" roughness={0.9} />
      </mesh>
      {/* Fût */}
      <mesh position={[0, height / 2 + 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.085, height, 6]} />
        <meshStandardMaterial map={stoneTex} color="#8a8a8a" roughness={0.85} />
      </mesh>
      {/* Chapiteau */}
      <mesh position={[0, height + 0.06, 0]} castShadow>
        <boxGeometry args={[0.18, 0.06, 0.18]} />
        <meshStandardMaterial map={stoneTex} color="#9a9a9a" roughness={0.8} />
      </mesh>
      {/* Détail : petite sphère décorative au sommet */}
      <mesh position={[0, height + 0.12, 0]}>
        <sphereGeometry args={[0.04, 6, 4]} />
        <meshStandardMaterial color="#b0a898" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ── Champignon stylisé ────────────────────────────────────────────────────────
interface MushroomProps {
  position: [number, number, number];
  scale?: number;
}

export function Mushroom({ position, scale = 1 }: MushroomProps) {
  return (
    <group position={position}>
      {/* Tige */}
      <mesh position={[0, 0.075 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.025 * scale, 0.04 * scale, 0.15 * scale, 6]} />
        <meshStandardMaterial color="#d4c5a0" roughness={0.8} />
      </mesh>
      {/* Chapeau */}
      <mesh position={[0, 0.16 * scale, 0]} castShadow>
        <sphereGeometry args={[0.09 * scale, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c06040" roughness={0.75} />
      </mesh>
      {/* Petits points sur le chapeau */}
      {[0, 1.5, 3, 4.5].map((a, i) => (
        <mesh key={i} position={[
          Math.cos(a) * 0.055 * scale,
          (0.18 + Math.sin(a) * 0.01) * scale,
          Math.sin(a) * 0.055 * scale
        ]}>
          <sphereGeometry args={[0.012 * scale, 4, 4]} />
          <meshStandardMaterial color="#e8d8c0" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ── Rocher géométrique ────────────────────────────────────────────────────────
interface GeometricRockProps {
  position: [number, number, number];
  scale?: number;
  seed?: number;
}

export function GeometricRock({ position, scale = 1, seed = 0 }: GeometricRockProps) {
  const stoneTex = useMemo(() => getStoneTex(), []);
  const scaleVec = useMemo<[number, number, number]>(() => [
    1 + Math.sin(seed) * 0.3,
    0.65 + Math.cos(seed) * 0.25,
    1 + Math.sin(seed * 2) * 0.25,
  ], [seed]);
  const color = useMemo(() => {
    const base = 0x7a7a6e;
    const r = ((base >> 16) & 0xff) + Math.sin(seed * 3) * 15;
    const g = ((base >> 8) & 0xff) + Math.cos(seed * 5) * 10;
    const b = (base & 0xff) + Math.sin(seed * 7) * 12;
    return new THREE.Color(r / 255, g / 255, b / 255);
  }, [seed]);

  return (
    <mesh position={position} scale={scaleVec} castShadow>
      <dodecahedronGeometry args={[0.08 * scale, 0]} />
      <meshStandardMaterial map={stoneTex} color={color} roughness={0.9} />
    </mesh>
  );
}

// ── Assemblage complet des décorations ────────────────────────────────────────
export function TableDecorations() {
  return (
    <group>
      {/* Lanternes (4, une par coin) */}
      <Lantern position={[-4.45, 0.05, 3.65]} />
      <Lantern position={[4.45, 0.05, 3.65]} />
      <Lantern position={[-4.45, 0.05, -3.65]} />
      <Lantern position={[4.45, 0.05, -3.65]} />

      {/* Cristaux teal */}
      <Crystal position={[-4.25, 0.2, 1.5]} scale={1.2} />
      <Crystal position={[4.25, 0.2, -1.5]} scale={1.0} />
      {/* Petit cristal secondaire teal */}
      <Crystal position={[-4.0, 0.15, 1.8]} scale={0.6} />

      {/* Cristaux ambre */}
      <Crystal position={[4.25, 0.2, 1.5]} color="#FBBF24" scale={1.1} />
      <Crystal position={[-4.25, 0.2, -1.5]} color="#FBBF24" scale={0.9} />
      {/* Petit cristal secondaire ambre */}
      <Crystal position={[4.0, 0.15, 1.8]} color="#FBBF24" scale={0.55} />

      {/* Arches */}
      <StoneArch position={[-4.25, 0.05, 0]} rotation={[0, Math.PI / 2, 0]} />
      <StoneArch position={[4.25, 0.05, 0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Piliers */}
      <StonePillar position={[-3.5, 0.05, 3.5]} height={0.45} />
      <StonePillar position={[3.5, 0.05, 3.5]} height={0.4} />
      <StonePillar position={[-3.5, 0.05, -3.5]} height={0.38} />
      <StonePillar position={[3.5, 0.05, -3.5]} height={0.42} />

      {/* Champignons */}
      <Mushroom position={[-4.5, 0.05, 2.5]} scale={1.0} />
      <Mushroom position={[4.6, 0.05, -2.2]} scale={0.85} />
      <Mushroom position={[-4.5, 0.05, -2.8]} scale={0.7} />
      <Mushroom position={[3.8, 0.05, 3.2]} scale={1.1} />
      {/* Petits champignons supplémentaires */}
      <Mushroom position={[-3.9, 0.05, -3.3]} scale={0.5} />
      <Mushroom position={[4.3, 0.05, 2.5]} scale={0.55} />

      {/* Rochers */}
      <GeometricRock position={[-4.3, 0.05, 0.5]} scale={1.0} seed={1} />
      <GeometricRock position={[4.5, 0.05, 0.8]} scale={0.8} seed={2} />
      <GeometricRock position={[-3.8, 0.05, -3.0]} scale={1.2} seed={3} />
      <GeometricRock position={[3.9, 0.05, -3.2]} scale={0.7} seed={4} />
      <GeometricRock position={[-4.6, 0.05, -0.5]} scale={0.9} seed={5} />
      <GeometricRock position={[4.3, 0.05, 2.8]} scale={1.1} seed={6} />
      {/* Petits rochers supplémentaires près des cristaux */}
      <GeometricRock position={[-4.4, 0.05, 1.2]} scale={0.5} seed={7} />
      <GeometricRock position={[4.4, 0.05, -1.2]} scale={0.5} seed={8} />
      <GeometricRock position={[-4.1, 0.05, 2.0]} scale={0.4} seed={9} />
      <GeometricRock position={[4.1, 0.05, -2.0]} scale={0.45} seed={10} />
    </group>
  );
}
