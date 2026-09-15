import "@/app/globals.css";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { getSocket } from "@/lib/socket";
import { CardSuit, PlayedCard, PublicSipaGameState } from "@/game";
import type { GameSceneProps } from "@/components/GameScene";
import { AvatarDisplay } from "@/components/AvatarDisplay";
import RulesButton from "@/components/RulesButton";
import SettingsButton from "@/components/SettingsButton";
import { useSipaSound, useSoundSettings } from "@/lib/sound";

// Chargé uniquement côté client (Three.js ne supporte pas SSR)
const GameScene = dynamic(() => import("@/components/GameScene"), { ssr: false });

const suitSymbols: Record<CardSuit, string> = {
  [CardSuit.Spade]: "♠",
  [CardSuit.Heart]: "♥",
  [CardSuit.Diamond]: "♦",
  [CardSuit.Club]: "♣",
};

// ── Popup fin de manche / partie ──────────────────────────────────────────────
function RoundEndModal({
  gameState, socketId, onNextRound, onClose,
}: {
  gameState: PublicSipaGameState;
  socketId: string | undefined;
  onNextRound: () => void;
  onClose: () => void;
}) {
  const isFinished = gameState.status === "finished";
  const winner = isFinished ? gameState.players.find(p => p.id === gameState.winnerId) : null;
  const me = gameState.players.find(p => p.id === socketId);
  const isCreator = Boolean(me?.isCreator);
  const targetScore = gameState.settings.targetScore;
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.78)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm animate-scaleIn" style={{
        background: "#071a0e", border: "2px solid #1a5e30",
        boxShadow: "6px 6px 0 #000", borderRadius: 12, overflow: "hidden",
      }}>
        <div style={{ background: "#0f2819", borderBottom: "2px solid #1a5e30", padding: "16px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>{isFinished ? "🏆" : "🎴"}</div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "Georgia, serif" }}>
            {isFinished ? "Partie terminée !" : "Fin de manche"}
          </h2>
          {isFinished && winner && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 6 }}>
              <AvatarDisplay emoji={winner.emoji} size={22} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b" }}>{winner.username} remporte la partie !</span>
            </div>
          )}
        </div>

        {gameState.lastMessage && (
          <div style={{ padding: "10px 16px 0" }}>
            <div style={{
              padding: "8px 12px", borderRadius: 6,
              background: "#1c3824", border: "2px solid #2d6a3a",
              borderLeft: "4px solid #f59e0b",
              fontSize: 12, fontWeight: 700, color: "#f59e0b",
            }}>
              {gameState.lastMessage}
            </div>
          </div>
        )}

        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.15em", color: "#4ade80", textTransform: "uppercase", marginBottom: 2 }}>
            Récap des points
          </div>
          {sortedPlayers.map((player, rank) => {
            const pct = Math.min(100, Math.round((player.score / targetScore) * 100));
            const isLeader = rank === 0 && player.score > 0;
            return (
              <div key={player.id} style={{
                background: isLeader ? "#1c3010" : player.id === socketId ? "#0f2819" : "#0a1c10",
                border: "2px solid " + (isLeader ? "#365c1a" : "#1a5e30"),
                borderLeft: "4px solid " + (isLeader ? "#f59e0b" : player.id === socketId ? "#4ade80" : "#1a5e30"),
                borderRadius: 8, overflow: "hidden",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
                  <AvatarDisplay emoji={player.emoji} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {isLeader ? "★ " : ""}{player.username}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>Objectif {targetScore} pts</div>
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: isLeader ? "#f59e0b" : "#4ade80", fontFamily: "Georgia, serif" }}>
                    {player.score}
                  </div>
                </div>
                <div style={{ height: 4, background: "#0d2a15" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: isLeader ? "#f59e0b" : "#4ade80", transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "4px 16px 16px" }}>
          {isFinished ? (
            <button onClick={onClose} style={{
              width: "100%", padding: "12px", borderRadius: 8,
              background: "#1a5e30", border: "2px solid #166534",
              boxShadow: "3px 3px 0 #000",
              color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer",
            }}>Fermer</button>
          ) : isCreator ? (
            <button onClick={onNextRound} style={{
              width: "100%", padding: "12px", borderRadius: 8,
              background: "#1a5e30", border: "2px solid #166534",
              boxShadow: "3px 3px 0 #000",
              color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
            }}>▶ Manche suivante</button>
          ) : (
            <div style={{ textAlign: "center", padding: "8px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
              ⏳ En attente de l'hôte…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page de jeu ───────────────────────────────────────────────────────────────
export default function Game() {
  const router = useRouter();
  const { channel } = router.query;
  const [gameState, setGameState] = useState<PublicSipaGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [socketId, setSocketId] = useState<string | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [opponentHovers, setOpponentHovers] = useState<Record<string, number | null>>({});
  const [displayedTrick, setDisplayedTrick] = useState<PlayedCard[]>([]);
  const [displayedMode, setDisplayedMode] = useState<'current' | 'last' | 'empty'>('empty');
  const [displayedWinnerId, setDisplayedWinnerId] = useState<string | undefined>();
  const trickDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTrickCountRef = useRef(0);
  const prevStatusRef = useRef<string | null>(null);
  const prevAudioRef = useRef<{ ready: boolean; trickCount: number; status: string | null }>({
    ready: false,
    trickCount: 0,
    status: null,
  });
  const { enabled: soundsEnabled, setEnabled: setSoundsEnabled } = useSoundSettings();
  const playSound = useSipaSound(soundsEnabled);

  useEffect(() => {
    if (!channel || typeof channel !== "string") return;
    const socket = getSocket();
    socket.emit("get_game_state", channel);
    setSocketId(socket.id);

    const handleConnect = () => { setSocketId(socket.id); socket.emit("get_game_state", channel); };
    socket.on("connect", handleConnect);
    socket.on("game_state", (state: PublicSipaGameState) => { setGameState(state); setError(null); });
    socket.on("game_error", (msg: string) => setError(msg));
    socket.on("opponent_card_hover", ({ playerId, cardIndex }: { playerId: string; cardIndex: number | null }) => {
      setOpponentHovers(prev => ({ ...prev, [playerId]: cardIndex }));
    });
    socket.on("room_closed", () => router.push("/"));

    return () => {
      socket.off("connect", handleConnect);
      socket.off("game_state");
      socket.off("game_error");
      socket.off("opponent_card_hover");
      socket.off("room_closed");
    };
  }, [channel]);

  useEffect(() => {
    if (!gameState) return;
    if (
      (gameState.status === "round-ended" || gameState.status === "finished") &&
      prevStatusRef.current === "playing"
    ) setShowModal(true);
    if (gameState.status === "playing") setShowModal(false);
    prevStatusRef.current = gameState.status;
  }, [gameState?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!gameState || !socketId) return;

    const previous = prevAudioRef.current;
    const currentTrickCount = gameState.completedTricks.length;
    if (!previous.ready) {
      prevAudioRef.current = { ready: true, trickCount: currentTrickCount, status: gameState.status };
      return;
    }

    const didWinGame = previous.status !== "finished" && gameState.status === "finished" && gameState.winnerId === socketId;
    const lastTrick = gameState.completedTricks.at(-1);
    if (didWinGame) {
      playSound("win-game");
    } else if (currentTrickCount > previous.trickCount && lastTrick?.winnerId === socketId) {
      playSound("win-trick");
    }

    prevAudioRef.current = { ready: true, trickCount: currentTrickCount, status: gameState.status };
  }, [gameState, playSound, socketId]);

  // Delayed trick display: show played cards for 2s before flying to winner
  useEffect(() => {
    if (!gameState) return;
    const trickCount = gameState.completedTricks.length;

    if (gameState.currentTrick.length > 0) {
      if (trickDelayRef.current) clearTimeout(trickDelayRef.current);
      setDisplayedTrick(gameState.currentTrick);
      setDisplayedMode('current');
      setDisplayedWinnerId(undefined);
    } else if (trickCount > prevTrickCountRef.current) {
      const lastTrick = gameState.completedTricks.at(-1)!;
      if (trickDelayRef.current) clearTimeout(trickDelayRef.current);
      setDisplayedTrick(lastTrick.plays);
      setDisplayedMode('last');
      setDisplayedWinnerId(lastTrick.winnerId);
      trickDelayRef.current = setTimeout(() => {
        setDisplayedMode('empty');
        setDisplayedTrick([]);
      }, 2000);
    } else if (trickCount === 0 && prevTrickCountRef.current > 0) {
      if (trickDelayRef.current) clearTimeout(trickDelayRef.current);
      setDisplayedMode('empty');
      setDisplayedTrick([]);
    }

    prevTrickCountRef.current = trickCount;
  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  const me = useMemo(() => gameState?.players.find(p => p.id === socketId), [gameState, socketId]);
  const isMyTurn = Boolean(me && gameState?.currentPlayerId === me.id && gameState?.status === "playing");
  const canAnnounceCombo789 = Boolean(me && gameState?.status === "playing" && gameState?.comboWindowOpen && gameState?.comboOptions.length > 0);
  const canDeclareFrop = Boolean(me && gameState?.status === "playing" && gameState?.comboWindowOpen && !gameState?.fropPlayerId);

  const opponents = useMemo(() => {
    if (!gameState) return [];
    const meIdx = gameState.players.findIndex(p => p.id === socketId);
    if (meIdx < 0) return gameState.players;
    return [...gameState.players.slice(meIdx + 1), ...gameState.players.slice(0, meIdx)];
  }, [gameState, socketId]);

  const playCard = (cardId: string) => {
    if (typeof channel !== "string") return;
    playSound("play-card");
    getSocket().emit("play_card", { roomCode: channel, cardId });
  };
  const nextRound = () => {
    if (typeof channel !== "string") return;
    getSocket().emit("next_round", { roomCode: channel });
  };
  const declareCombo789 = (suit: CardSuit) => {
    if (typeof channel !== "string") return;
    getSocket().emit("declare_combo_789", { roomCode: channel, suit });
  };
  const handleHoverCard = (index: number | null) => {
    if (typeof channel !== "string") return;
    if (index !== null) getSocket().emit("card_hover_start", { roomCode: channel, cardIndex: index });
    else getSocket().emit("card_hover_end", { roomCode: channel });
  };
  const declareFrop = () => {
    if (typeof channel !== "string") return;
    getSocket().emit("declare_frop", { roomCode: channel });
  };
  const endGame = () => {
    if (!confirm("Terminer la partie et retourner à l'accueil ?")) return;
    if (typeof channel === "string") getSocket().emit("close_room", { roomCode: channel });
    router.push("/");
  };

  // Cartes visibles sur la table (avec délai de 2s après complétion du pli)
  const visiblePlays = displayedTrick;
  const visibleMode = displayedMode;
  const myWonPlays = gameState?.completedTricks
    .filter((trick) => trick.winnerId === socketId)
    .flatMap((trick) => trick.plays) ?? [];
  const otherCompletedTricksCount = gameState?.completedTricks
    .filter((trick) => trick.winnerId !== socketId)
    .length ?? 0;

  const currentPlayer = gameState?.players.find(p => p.id === gameState?.currentPlayerId);

  // ── Écran de chargement ─────────────────────────────────────────────────────
  if (!gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center felt-table">
        <div className="text-center">
          <div className="text-6xl font-black mb-3" style={{ color: "var(--gold)", fontFamily: "Georgia, serif", letterSpacing: "0.3em" }}>SIPA</div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em" }}>CHARGEMENT…</p>
          {error && <div className="mt-4 px-5 py-3 rounded-lg text-sm font-bold" style={{ background: "rgba(220,38,38,0.2)", color: "#fca5a5" }}>{error}</div>}
        </div>
      </div>
    );
  }

  const sceneProps: GameSceneProps = {
    me,
    opponents,
    isMyTurn,
    visiblePlays,
    visibleMode,
    visibleWinnerId: displayedWinnerId,
    myWonPlays,
    completedTricksCount: otherCompletedTricksCount,
    opponentHovers,
    onPlayCard: playCard,
    onHoverCard: handleHoverCard,
    onPlayableCardHover: () => playSound("hover"),
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", background: "#0d3d1f" }}>

      {/* ── Canvas Three.js ──────────────────────────────────────────────────── */}
      <GameScene {...sceneProps} />

      {/* ── Popup fin de manche ──────────────────────────────────────────────── */}
      {showModal && (
        <RoundEndModal
          gameState={gameState}
          socketId={socketId}
          onNextRound={() => { nextRound(); setShowModal(false); }}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* ── Overlay HTML ─────────────────────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}>

        {/* ── Panneau scores — haut gauche ──────────────────────────────────── */}
        <div style={{
          position: "absolute", top: 12, left: 12,
          width: 200, maxWidth: "calc(50vw - 20px)",
          background: "#071a0e",
          border: "2px solid #1a5e30",
          boxShadow: "4px 4px 0 #000",
          borderRadius: 10, overflow: "hidden",
          pointerEvents: "auto",
        }}>
          <div style={{
            padding: "6px 10px",
            background: "#0f2819",
            borderBottom: "2px solid #1a5e30",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ color: "#f59e0b", fontSize: 10, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>
              ♠ Points
            </span>
            <span style={{ color: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 700 }}>
              {gameState.completedTricks.length}/5 plis
            </span>
          </div>
          {gameState.players.map((p, i) => {
            const isActive = p.id === gameState.currentPlayerId;
            const isMe = p.id === socketId;
            const isFrop = p.id === gameState.fropPlayerId;
            return (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 8px",
                background: isActive ? "#1c3824" : isMe ? "#0f2819" : "#071a0e",
                borderTop: i > 0 ? "1px solid #0d2a15" : "none",
                borderLeft: isActive ? "3px solid #f59e0b" : isMe ? "3px solid #4ade80" : "3px solid transparent",
              }}>
                <AvatarDisplay emoji={p.emoji} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.username}
                    {isFrop && <span style={{ marginLeft: 5, fontSize: 9, fontWeight: 900, color: "#f59e0b", background: "#92400e", padding: "1px 4px", borderRadius: 3 }}>FROP</span>}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: isActive ? "#f59e0b" : isMe ? "#4ade80" : "rgba(255,255,255,0.32)" }}>
                    {isActive ? "▶ À jouer" : isMe ? "Toi" : `${p.cardsCount} cartes`}
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, minWidth: 32, textAlign: "right", color: isActive ? "#f59e0b" : isMe ? "#4ade80" : "rgba(255,255,255,0.5)", fontFamily: "Georgia, serif" }}>
                  {p.score}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Barre centrale — tour + pli ───────────────────────────────────── */}
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 8,
          background: "#071a0e",
          border: "2px solid #1a5e30",
          boxShadow: "3px 3px 0 #000",
          borderRadius: 8, padding: "7px 14px",
          pointerEvents: "auto", whiteSpace: "nowrap",
        }}>
          {currentPlayer && (
            <span style={{ fontSize: 12, fontWeight: 900, color: isMyTurn ? "#4ade80" : "rgba(255,255,255,0.65)" }}>
              {isMyTurn ? "▶ À vous de jouer" : `${currentPlayer.username}…`}
            </span>
          )}
          {me?.isCreator && (
            <>
              <div style={{ width: 1, height: 14, background: "#1a5e30" }} />
              <button type="button" onClick={endGame} style={{
                background: "#7f1d1d", border: "2px solid #991b1b",
                boxShadow: "2px 2px 0 #000",
                color: "#fca5a5", borderRadius: 6, padding: "2px 8px",
                fontSize: 10, fontWeight: 900, cursor: "pointer",
              }}>
                ⏹ Fin
              </button>
            </>
          )}
        </div>

        {/* ── Actions haut droite ───────────────────────────────────────────── */}
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6, pointerEvents: "auto" }}>
          <RulesButton compact />
          <SettingsButton soundsEnabled={soundsEnabled} onSoundsEnabledChange={setSoundsEnabled} />
        </div>

        {/* ── Message de tour — sous les boutons droite ─────────────────────── */}
        {gameState.lastMessage && !showModal && gameState.status === "playing" && (
          <div style={{ position: "absolute", top: 52, right: 12, pointerEvents: "none", maxWidth: 230 }}>
            <div style={{
              padding: "6px 10px 6px 12px",
              background: "#071a0e",
              border: "2px solid #1a5e30",
              borderLeft: "4px solid #4ade80",
              boxShadow: "3px 3px 0 #000",
              borderRadius: 6,
              fontSize: 11, fontWeight: 700,
              color: "rgba(255,255,255,0.8)",
            }}>
              {gameState.lastMessage}
            </div>
          </div>
        )}

        {/* ── Erreur ────────────────────────────────────────────────────────── */}
        {error && (
          <div style={{
            position: "absolute", top: 52, left: "50%", transform: "translateX(-50%)",
            padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700,
            background: "#7f1d1d", border: "2px solid #991b1b",
            boxShadow: "3px 3px 0 #000", color: "#fca5a5", pointerEvents: "auto",
          }}>
            {error}
          </div>
        )}

        {/* ── Bouton combo 7-8-9 ────────────────────────────────────────────── */}
        {canAnnounceCombo789 && (
          <div style={{ position: "absolute", bottom: "28%", left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, pointerEvents: "auto" }}>
            {gameState.comboOptions.map(option => (
              <button key={option.suit} type="button" onClick={() => declareCombo789(option.suit)}
                className="animate-popIn"
                style={{
                  padding: "10px 18px", borderRadius: 8,
                  fontWeight: 900, fontSize: 13, color: "#fff",
                  background: "#1e3a8a", border: "2px solid #2563eb",
                  boxShadow: "3px 3px 0 #000",
                  cursor: "pointer", whiteSpace: "nowrap",
                }}>
                ✦ 7-8-9 {suitSymbols[option.suit]}
              </button>
            ))}
          </div>
        )}

        {/* ── Bouton FROP ───────────────────────────────────────────────────── */}
        {canDeclareFrop && (
          <div style={{ position: "absolute", bottom: "calc(28% + 52px)", left: "50%", transform: "translateX(-50%)", pointerEvents: "auto" }}>
            <button type="button" onClick={declareFrop}
              className="animate-popIn"
              style={{
                padding: "10px 22px", borderRadius: 8,
                fontWeight: 900, fontSize: 13, color: "#fff",
                background: "#92400e", border: "2px solid #b45309",
                boxShadow: "3px 3px 0 #000",
                cursor: "pointer", whiteSpace: "nowrap",
              }}>
              ♦ Jouer en FROP (+4 pts)
            </button>
          </div>
        )}

        {/* ── Bouton scores fin de manche ───────────────────────────────────── */}
        {(gameState.status === "round-ended" || gameState.status === "finished") && !showModal && (
          <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", pointerEvents: "auto" }}>
            <button type="button" onClick={() => setShowModal(true)} style={{
              padding: "10px 26px", borderRadius: 8,
              background: "#92400e", border: "2px solid #b45309",
              boxShadow: "4px 4px 0 #000",
              color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer",
            }}>
              📊 Voir les scores
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
