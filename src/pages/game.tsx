import "@/app/globals.css";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { getSocket } from "@/lib/socket";
import { CardSuit, PublicSipaGameState } from "@/game";
import type { GameSceneProps } from "@/components/GameScene";
import { AvatarDisplay } from "@/components/AvatarDisplay";
import RulesButton from "@/components/RulesButton";

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
      style={{ background: "rgba(15,23,42,0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl overflow-hidden animate-scaleIn"
        style={{ background: "rgba(255,255,255,0.96)", border: "2px solid rgba(255,255,255,0.72)" }}>

        <div className="px-6 py-5 text-center border-b-2" style={{ background: "var(--green-primary)", borderColor: "var(--green-dark)" }}>
          <div className="text-3xl mb-1">{isFinished ? "🏆" : "🎴"}</div>
          <h2 className="text-xl font-black text-white" style={{ fontFamily: "Georgia, serif" }}>
            {isFinished ? "Partie terminée !" : "Fin de manche"}
          </h2>
          {isFinished && winner && (
            <p className="text-sm font-bold mt-1 flex items-center justify-center gap-2" style={{ color: "rgba(255,255,255,0.8)" }}>
              <AvatarDisplay emoji={winner.emoji} size={24} />
              {winner.username} remporte la partie !
            </p>
          )}
        </div>

        {gameState.lastMessage && (
          <div className="px-5 pt-4 pb-2">
            <p className="text-center font-bold text-base px-3 py-2 rounded-lg"
              style={{ background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.3)", color: "var(--gold-dark)" }}>
              {gameState.lastMessage}
            </p>
          </div>
        )}

        <div className="px-5 py-4 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--green-dark)" }}>Recap des points</p>
          {sortedPlayers.map((player, rank) => {
            const pct = Math.min(100, Math.round((player.score / targetScore) * 100));
            const isLeader = rank === 0 && player.score > 0;
            return (
              <div
                key={player.id}
                className="overflow-hidden rounded-xl"
                style={{
                  background: isLeader ? "rgba(245,158,11,0.13)" : player.id === socketId ? "rgba(24,163,84,0.1)" : "#fff",
                  border: "1px solid rgba(17,24,39,0.1)",
                }}
              >
                <div className="flex items-center gap-3 px-3 py-2">
                  <AvatarDisplay emoji={player.emoji} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black" style={{ color: "var(--text-dark)" }}>
                      {isLeader ? "★ " : ""}{player.username}
                    </p>
                    <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                      Objectif {targetScore} pts
                    </p>
                  </div>
                  <div className="text-3xl font-black leading-none" style={{ color: isLeader ? "var(--gold-dark)" : "var(--green-dark)" }}>
                    {player.score}
                  </div>
                </div>
                <div className="h-2 overflow-hidden" style={{ background: "var(--cream-border)" }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: isLeader ? "var(--gold)" : "var(--green-primary)" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-5 pb-5 pt-2">
          {isFinished ? (
            <button onClick={onClose}
              className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
              style={{ background: "var(--green-primary)", border: "2px solid var(--green-dark)", boxShadow: "0 4px 0 var(--green-dark)" }}>
              Fermer
            </button>
          ) : isCreator ? (
            <button onClick={onNextRound}
              className="w-full py-3 rounded-xl font-black text-xl text-white transition-all hover:opacity-90"
              style={{ background: "var(--green-primary)", border: "2px solid var(--green-dark)", boxShadow: "0 4px 0 var(--green-dark)" }}>
              ▶ Manche suivante
            </button>
          ) : (
            <p className="text-center text-sm font-bold py-2" style={{ color: "var(--text-muted)" }}>
              ⏳ En attente de l'hôte…
            </p>
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
  const prevStatusRef = useRef<string | null>(null);

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

  const me = useMemo(() => gameState?.players.find(p => p.id === socketId), [gameState, socketId]);
  const isMyTurn = Boolean(me && gameState?.currentPlayerId === me.id && gameState?.status === "playing");
  const canAnnounceCombo789 = Boolean(me && gameState?.status === "playing" && gameState?.comboWindowOpen && gameState?.comboOptions.length > 0);

  const opponents = useMemo(() => {
    if (!gameState) return [];
    const meIdx = gameState.players.findIndex(p => p.id === socketId);
    if (meIdx < 0) return gameState.players;
    return [...gameState.players.slice(meIdx + 1), ...gameState.players.slice(0, meIdx)];
  }, [gameState, socketId]);

  const playCard = (cardId: string) => {
    if (typeof channel !== "string") return;
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
  const endGame = () => {
    if (!confirm("Terminer la partie et retourner à l'accueil ?")) return;
    if (typeof channel === "string") getSocket().emit("close_room", { roomCode: channel });
    router.push("/");
  };

  // Cartes visibles sur la table
  const visiblePlays = gameState
    ? gameState.currentTrick
    : [];
  const visibleMode = gameState
    ? (gameState.currentTrick.length > 0 ? "current" : "empty")
    : "empty";
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
    visibleWinnerId: undefined,
    myWonPlays,
    completedTricksCount: otherCompletedTricksCount,
    opponentHovers,
    onPlayCard: playCard,
    onHoverCard: handleHoverCard,
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

        {/* ── Scores très visibles ───────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            width: 220,
            maxWidth: "calc(100vw - 24px)",
            borderRadius: 18,
            background: "rgba(255,255,255,0.94)",
            border: "2px solid rgba(255,255,255,0.65)",
            overflow: "hidden",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              padding: "9px 12px",
              background: "var(--green-primary)",
              borderBottom: "2px solid var(--green-dark)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Points
          </div>
          <div>
            {gameState.players.map((p, index) => {
              const isActive = p.id === gameState.currentPlayerId;
              const isMe = p.id === socketId;
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 10px",
                    background: isActive ? "rgba(245,158,11,0.16)" : isMe ? "rgba(24,163,84,0.1)" : "#fff",
                    borderTop: index > 0 ? "1px solid rgba(17,24,39,0.08)" : "none",
                  }}
                >
                  <AvatarDisplay emoji={p.emoji} size={38} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        color: "var(--text-dark)",
                        fontSize: 13,
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {p.username}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 800 }}>
                      {isActive ? "À jouer" : isMe ? "Toi" : `${p.cardsCount} cartes`}
                    </div>
                  </div>
                  <div
                    style={{
                      minWidth: 48,
                      textAlign: "center",
                      color: isActive ? "var(--gold-dark)" : "var(--green-dark)",
                      fontSize: 30,
                      fontWeight: 1000,
                      lineHeight: 1,
                    }}
                  >
                    {p.score}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Actions haut droite ────────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            pointerEvents: "auto",
          }}
        >
          <RulesButton compact />
        </div>

        {/* ── Header flottant glassmorphism ────────────────────────────────────── */}
        <div style={{
          position: "absolute", top: 12, left: "50%",
          transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(8,14,28,0.55)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 100,
          padding: "5px 14px 5px 10px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
          pointerEvents: "auto",
          whiteSpace: "nowrap",
          maxWidth: "calc(100vw - 24px)",
          flexWrap: "wrap",
          justifyContent: "center",
          rowGap: 4,
        }}>
          {/* Logo */}
          <span style={{ color: "var(--gold)", fontWeight: 900, fontFamily: "Georgia, serif", letterSpacing: "0.12em", fontSize: 15, marginRight: 2 }}>♠</span>
          {/* Séparateur */}
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.15)", marginRight: 4 }} />

          {/* Séparateur */}
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.15)", marginLeft: 2 }} />

          {/* Tour + pli */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {currentPlayer && (
              <span style={{
                fontSize: 11, fontWeight: 800,
                color: isMyTurn ? "#4ade80" : "rgba(255,255,255,0.6)",
                textShadow: isMyTurn ? "0 0 10px rgba(74,222,128,0.6)" : "none",
              }}>
                {isMyTurn ? "▶ À vous" : currentPlayer.username}
              </span>
            )}
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: "var(--gold)", opacity: 0.75,
            }}>
              {gameState.completedTricks.length + (gameState.currentTrick.length > 0 ? 1 : 0)}/5
            </span>
          </div>

          {/* Bouton fin de partie (créateur uniquement) */}
          {me?.isCreator && (
            <>
              <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.15)" }} />
              <button type="button" onClick={endGame}
                style={{
                  background: "rgba(220,38,38,0.18)", border: "1px solid rgba(220,38,38,0.4)",
                  color: "#fca5a5", borderRadius: 100, padding: "3px 10px",
                  fontSize: 10, fontWeight: 800, cursor: "pointer",
                }}>
                ⏹ Fin
              </button>
            </>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div style={{
            position: "absolute", top: 64, left: "50%", transform: "translateX(-50%)",
            padding: "8px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700,
            background: "rgba(220,38,38,0.22)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5",
            pointerEvents: "auto",
          }}>
            {error}
          </div>
        )}

        {/* ── Bouton combo 7-8-9 (flottant, centré) ────────────────────────────── */}
        {canAnnounceCombo789 && (
          <div style={{
            position: "absolute", bottom: "28%", left: "50%",
            transform: "translateX(-50%)",
            display: "flex", gap: 8, pointerEvents: "auto",
          }}>
            {gameState.comboOptions.map(option => (
              <button key={option.suit} type="button" onClick={() => declareCombo789(option.suit)}
                className="animate-popIn"
                style={{
                  padding: "10px 18px",
                  borderRadius: 100,
                  fontWeight: 900, fontSize: 13, color: "#fff",
                  background: "rgba(37,99,235,0.85)",
                  border: "2px solid rgba(147,197,253,0.5)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 0 20px rgba(59,130,246,0.55), 0 4px 12px rgba(0,0,0,0.4)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}>
                ✦ 7-8-9 {suitSymbols[option.suit]}
              </button>
            ))}
          </div>
        )}

        {/* ── Zone basse : message + scores ────────────────────────────────────── */}
        <div style={{
          position: "absolute", bottom: 12, left: "50%",
          transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          pointerEvents: "none",
          width: "min(480px, calc(100vw - 24px))",
        }}>
          {/* Message fin de pli */}
          {(gameState.lastMessage || gameState.status === "round-ended" || gameState.status === "finished") && !showModal && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 16px",
              borderRadius: 100,
              background: "rgba(8,14,28,0.62)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 12, color: "rgba(255,255,255,0.65)",
              pointerEvents: "auto",
            }}>
              {gameState.lastMessage && <span>{gameState.lastMessage}</span>}
              {(gameState.status === "round-ended" || gameState.status === "finished") && (
                <button type="button" onClick={() => setShowModal(true)}
                  style={{
                    padding: "4px 12px", borderRadius: 100,
                    background: "var(--gold-dark)", border: "1px solid var(--gold)",
                    color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer",
                  }}>
                  📊 Scores
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
