'use client';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Card, CardSuit, PlayedCard, PublicSipaPlayer } from '@/game';
import { AvatarDisplay } from './AvatarDisplay';

// ── Constantes ────────────────────────────────────────────────────────────────
const CW = 0.72;
const CH = 1.01;
const PLAYER_TILT    = 0.74;  // inclinaison cartes joueur (vers caméra)
const PLAYER_Y       = 0.28;  // hauteur centre carte joueur
const PLAYER_Z       = 1.35;  // profondeur main joueur (plus haut dans la vue)
const OPPONENT_TILT  = 0.58;  // inclinaison cartes adversaire (aussi debout)

const SYM: Record<CardSuit, string> = {
  [CardSuit.Spade]: '♠', [CardSuit.Heart]: '♥',
  [CardSuit.Diamond]: '♦', [CardSuit.Club]: '♣',
};
const RED = new Set([CardSuit.Heart, CardSuit.Diamond]);

// ── Textures ──────────────────────────────────────────────────────────────────
const faceCache = new Map<string, THREE.CanvasTexture>();

function getFaceTex(value: string, suit: CardSuit): THREE.CanvasTexture {
  const key = `${value}|${suit}`;
  if (faceCache.has(key)) return faceCache.get(key)!;
  const S = 3; // supersampling scale
  const W = 288, H = 404;
  const cv = document.createElement('canvas');
  cv.width = W * S; cv.height = H * S;
  const c = cv.getContext('2d')!;
  c.scale(S, S);
  const isRed = RED.has(suit);
  const col = isRed ? '#dc2626' : '#111827';
  const sym = SYM[suit];

  c.fillStyle = '#fffef8';
  c.beginPath(); c.roundRect(2, 2, W - 4, H - 4, 18); c.fill();
  c.strokeStyle = '#c8c0b0'; c.lineWidth = 3; c.stroke();

  c.fillStyle = col;
  c.textAlign = 'left';
  c.font = 'bold 58px Georgia, serif'; c.fillText(value, 16, 66);
  c.font = '36px serif'; c.fillText(sym, 22, 106);

  c.save(); c.translate(W, H); c.rotate(Math.PI);
  c.font = 'bold 58px Georgia, serif'; c.fillText(value, 16, 66);
  c.font = '36px serif'; c.fillText(sym, 22, 106);
  c.restore();

  c.textAlign = 'center';
  c.font = `${Math.round(W * 0.44)}px serif`;
  c.fillText(sym, W / 2, H / 2 + Math.round(W * 0.13));

  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 16;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  faceCache.set(key, tex);
  return tex;
}

let backTex: THREE.CanvasTexture | null = null;
function getBackTex(): THREE.CanvasTexture {
  if (backTex) return backTex;
  const S = 3;
  const W = 288, H = 404;
  const cv = document.createElement('canvas');
  cv.width = W * S; cv.height = H * S;
  const c = cv.getContext('2d')!;
  c.scale(S, S);;

  // Fond sombre
  c.fillStyle = '#12122a';
  c.beginPath(); c.roundRect(0, 0, W, H, 18); c.fill();

  // Bordure extérieure blanche
  c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 5;
  c.beginPath(); c.roundRect(9, 9, W - 18, H - 18, 12); c.stroke();

  // Bordure intérieure subtile
  c.strokeStyle = 'rgba(255,255,255,0.2)'; c.lineWidth = 1.5;
  c.beginPath(); c.roundRect(17, 17, W - 34, H - 34, 8); c.stroke();

  // Motif : grille de toutes les familles ♠♥♣♦
  const suits = ['♠', '♥', '♣', '♦'];
  const suitColors = [
    'rgba(255,255,255,0.30)',
    'rgba(210,50,50,0.38)',
    'rgba(255,255,255,0.30)',
    'rgba(210,50,50,0.38)',
  ];
  const margin = 22;
  const cols = 4;
  const tileW = (W - margin * 2) / cols;
  const tileH = tileW * 1.05;
  const rows = Math.ceil((H - margin * 2) / tileH) + 1;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = `${Math.round(tileW * 0.68)}px serif`;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = (row * 4 + col) % 4;
      c.fillStyle = suitColors[idx];
      c.fillText(
        suits[idx],
        margin + col * tileW + tileW / 2,
        margin + row * tileH + tileH / 2,
      );
    }
  }

  // Coins noirs
  c.fillStyle = 'rgba(0,0,0,0.65)';
  for (const [cx, cy] of [[13, 13], [W - 13, 13], [13, H - 13], [W - 13, H - 13]]) {
    c.beginPath(); c.arc(cx as number, cy as number, 4.5, 0, Math.PI * 2); c.fill();
  }

  backTex = new THREE.CanvasTexture(cv);
  backTex.anisotropy = 16;
  backTex.minFilter = THREE.LinearMipmapLinearFilter;
  return backTex;
}

// ── Caméra adaptative ─────────────────────────────────────────────────────────
function AdaptiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const fov = size.width < 640 ? 72 : 60;
    (camera as THREE.PerspectiveCamera).fov = fov;
    camera.position.set(0, 5.5, 6);
    camera.lookAt(0, 0, -0.5);
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, [camera, size.width]);
  return null;
}

// ── Tapis ─────────────────────────────────────────────────────────────────────
function FeltTable() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#1a5e30" roughness={0.95} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -0.3]}>
        <planeGeometry args={[8, 5.5]} />
        <meshStandardMaterial color="#1e6836" roughness={0.95} transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[5.6, 6.8, 64]} />
        <meshStandardMaterial color="#18243a" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ── Carte face visible ────────────────────────────────────────────────────────
interface FaceCardProps {
  card: Card;
  pos: [number, number, number];
  fanAngle?: number;
  tilt?: number;
  zIndex?: number;
  isPlayable?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

function FaceCard({
  card, pos, fanAngle = 0, tilt = 0, zIndex = 0,
  isPlayable, isHighlighted, onClick, onHoverStart, onHoverEnd,
}: FaceCardProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);
  const hoveredRef = useRef(false);
  const texture = useMemo(() => getFaceTex(card.value, card.suit), [card.value, card.suit]);
  const baseY = pos[1] + zIndex * 0.002;

  useFrame(() => {
    if (!meshRef.current || !matRef.current) return;
    const lift = hoveredRef.current && isPlayable ? 0.55 : 0;
    const ty = baseY + lift;
    meshRef.current.position.y += (ty - meshRef.current.position.y) * 0.14;
    const te = (hoveredRef.current && isPlayable) || isHighlighted ? 0.28 : 0;
    matRef.current.emissiveIntensity += (te - matRef.current.emissiveIntensity) * 0.15;
  });

  return (
    <mesh
      ref={meshRef}
      position={[pos[0], baseY, pos[2]]}
      rotation={[-Math.PI / 2 + tilt, fanAngle, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); isPlayable && onClick?.(); }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        hoveredRef.current = true;
        onHoverStart?.();
        document.body.style.cursor = isPlayable ? 'pointer' : 'default';
      }}
      onPointerOut={() => { hoveredRef.current = false; onHoverEnd?.(); document.body.style.cursor = 'default'; }}
    >
      <planeGeometry args={[CW, CH]} />
      <meshStandardMaterial ref={matRef} map={texture} roughness={0.45} emissive="#f59e0b" emissiveIntensity={0} side={THREE.FrontSide} />
    </mesh>
  );
}

// ── Dos de carte ──────────────────────────────────────────────────────────────
interface BackCardProps {
  pos: [number, number, number];
  fanAngle?: number;
  tilt?: number;
  zIndex?: number;
  isHighlighted?: boolean;
}

function BackCard({ pos, fanAngle = 0, tilt = 0, zIndex = 0, isHighlighted }: BackCardProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);
  const texture = useMemo(() => getBackTex(), []);
  const baseY = pos[1] + zIndex * 0.002;

  useFrame(() => {
    if (!meshRef.current || !matRef.current) return;
    const ty = baseY + (isHighlighted ? 0.5 : 0);
    meshRef.current.position.y += (ty - meshRef.current.position.y) * 0.14;
    const te = isHighlighted ? 0.32 : 0;
    matRef.current.emissiveIntensity += (te - matRef.current.emissiveIntensity) * 0.15;
  });

  return (
    <mesh
      ref={meshRef}
      position={[pos[0], baseY, pos[2]]}
      rotation={[-Math.PI / 2 + tilt, fanAngle, 0]}
    >
      <planeGeometry args={[CW, CH]} />
      <meshStandardMaterial ref={matRef} map={texture} roughness={0.45} emissive="#f59e0b" emissiveIntensity={0} side={THREE.FrontSide} />
    </mesh>
  );
}

// ── Layout éventail ───────────────────────────────────────────────────────────
function fanLayout(n: number, zBase: number) {
  const maxAngle = Math.min(22, n * 3.5) * (Math.PI / 180);
  const spread = Math.min(2.0, n * 0.40);
  return Array.from({ length: n }, (_, i) => {
    const t = n <= 1 ? 0 : (i - (n - 1) / 2) / ((n - 1) / 2);
    return { x: t * spread, z: zBase + t * t * 0.06, angle: t * maxAngle, t };
  });
}

// ── Main du joueur ────────────────────────────────────────────────────────────
interface PlayerHandProps {
  hand: Card[];
  isMyTurn: boolean;
  onPlayCard: (id: string) => void;
  onHoverCard?: (index: number | null) => void;
}

export function PlayerHand({ hand, isMyTurn, onPlayCard, onHoverCard }: PlayerHandProps) {
  const layout = useMemo(() => fanLayout(hand.length, PLAYER_Z), [hand.length]);
  if (hand.length === 0) return null;
  return (
    <group>
      {hand.map((card, i) => {
        const { x, z, angle } = layout[i];
        return (
          <FaceCard
            key={card.id} card={card}
            pos={[x, PLAYER_Y, z]}
            fanAngle={-angle} tilt={PLAYER_TILT} zIndex={i}
            isPlayable={isMyTurn}
            onClick={() => onPlayCard(card.id)}
            onHoverStart={() => onHoverCard?.(i)}
            onHoverEnd={() => onHoverCard?.(null)}
          />
        );
      })}
    </group>
  );
}

// ── Main adversaire ───────────────────────────────────────────────────────────
interface OpponentHandProps {
  count: number;
  basePos: [number, number, number];
  hoveredIndex?: number | null;
  mirrorAngle?: boolean;
  player: PublicSipaPlayer;
}

export function OpponentHand({ count, basePos, hoveredIndex, mirrorAngle, player }: OpponentHandProps) {
  const n = Math.max(1, count);
  const layout = useMemo(() => fanLayout(n, 0), [n]);
  return (
    <group>
      {layout.map(({ x, z, angle }, i) => (
        <BackCard
          key={i}
          pos={[basePos[0] + x, basePos[1], basePos[2] + z]}
          fanAngle={mirrorAngle ? angle : -angle}
          tilt={OPPONENT_TILT}
          zIndex={i}
          isHighlighted={hoveredIndex === i}
        />
      ))}
      {/* Badge joueur en HTML 3D */}
      <Html
        position={[basePos[0], basePos[1] + 0.25, basePos[2] - 0.75]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(8,14,28,0.72)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 100,
          padding: '3px 10px 3px 4px',
          backdropFilter: 'blur(10px)',
          whiteSpace: 'nowrap',
          fontSize: 11, fontWeight: 700, color: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
        }}>
          <AvatarDisplay emoji={player.emoji} size={22} />
          {player.username}
        </div>
      </Html>
    </group>
  );
}

// ── Pli en cours ──────────────────────────────────────────────────────────────
interface TrickAreaProps { plays: PlayedCard[]; players: PublicSipaPlayer[]; }
function TrickArea({ plays }: TrickAreaProps) {
  if (plays.length === 0) return null;
  const n = plays.length;
  return (
    <group>
      {plays.map((play, i) => {
        const a = (i / n) * Math.PI * 2;
        const r = Math.min(0.45, n * 0.11);
        const scatter = Math.sin(i * 7.3) * 0.07;
        const x = Math.sin(a) * r + scatter;
        const z = -Math.cos(a) * r * 0.55;
        return play.hidden ? (
          <BackCard key={play.playerId} pos={[x, 0.01, z]} fanAngle={scatter * 0.5} zIndex={i} />
        ) : (
          <FaceCard key={play.playerId} card={play.card} pos={[x, 0.01 + i * 0.003, z]} fanAngle={scatter * 0.5} zIndex={i} />
        );
      })}
    </group>
  );
}

// ── Pile de plis ──────────────────────────────────────────────────────────────
function TrickPile({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <group position={[-3.0, 0, 0]}>
      {Array.from({ length: Math.min(count, 7) }, (_, i) => (
        <BackCard key={i} pos={[i * 0.04 - 0.12, 0.01, i * 0.02]} fanAngle={(i % 3 - 1) * 0.07} zIndex={i} />
      ))}
      <Html position={[0.2, 0.06, -0.55]} center style={{ pointerEvents: 'none' }}>
        <div style={{
          background: '#f59e0b', color: '#111', borderRadius: '50%',
          width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 11, border: '2px solid #d97706',
        }}>{count}</div>
      </Html>
    </group>
  );
}

// ── Positions adversaires ─────────────────────────────────────────────────────
function opponentPositions(n: number): [number, number, number][] {
  const y = 0.32; // raised to keep card bottom above table when tilted
  if (n === 1) return [[0, y, -3.0]];
  if (n === 2) return [[-2.2, y, -2.4], [2.2, y, -2.4]];
  return [[-2.8, y, -1.5], [0, y, -3.2], [2.8, y, -1.5]];
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface GameSceneProps {
  me: PublicSipaPlayer | undefined;
  opponents: PublicSipaPlayer[];
  isMyTurn: boolean;
  visiblePlays: PlayedCard[];
  completedTricksCount: number;
  opponentHovers: Record<string, number | null>;
  onPlayCard: (cardId: string) => void;
  onHoverCard: (index: number | null) => void;
}

// ── Scène ─────────────────────────────────────────────────────────────────────
function Scene({ me, opponents, isMyTurn, visiblePlays, completedTricksCount, opponentHovers, onPlayCard, onHoverCard }: GameSceneProps) {
  const positions = useMemo(() => opponentPositions(opponents.length), [opponents.length]);

  return (
    <>
      <AdaptiveCamera />
      <ambientLight intensity={0.68} />
      <directionalLight position={[0, 10, 4]} intensity={0.52} color="#fff6e0" castShadow />
      <pointLight position={[-4, 6, 3]} intensity={0.2} color="#a8e0ff" />
      <pointLight position={[4, 6, 3]} intensity={0.2} color="#ffe8a0" />

      <FeltTable />
      <TrickPile count={completedTricksCount} />
      <TrickArea plays={visiblePlays} players={[...(me ? [me] : []), ...opponents]} />

      {opponents.map((opp, idx) => (
        <OpponentHand
          key={opp.id}
          count={opp.cardsCount}
          basePos={positions[idx]}
          hoveredIndex={opponentHovers[opp.id]}
          mirrorAngle={positions[idx][0] === 0}
          player={opp}
        />
      ))}

      {me && (
        <PlayerHand
          hand={me.hand ?? []}
          isMyTurn={isMyTurn}
          onPlayCard={onPlayCard}
          onHoverCard={onHoverCard}
        />
      )}
    </>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function GameScene(props: GameSceneProps) {
  return (
    <Canvas
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      shadows
      gl={{ antialias: true, alpha: false }}
      resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
    >
      <color attach="background" args={['#0d3d1f']} />
      <fog attach="fog" args={['#0d3d1f', 16, 26]} />
      <Scene {...props} />
    </Canvas>
  );
}
