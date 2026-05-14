import "@/app/globals.css";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/socket";
import { Card, CardSuit, CompletedTrick, PlayedCard, PublicSipaGameState, PublicSipaPlayer } from "@/game";

const suitSymbols: Record<CardSuit, string> = {
  [CardSuit.Spade]: "♠",
  [CardSuit.Heart]: "♥",
  [CardSuit.Diamond]: "♦",
  [CardSuit.Club]: "♣",
};

const redSuits = new Set<CardSuit>([CardSuit.Heart, CardSuit.Diamond]);

/**
 * Affiche une carte SIPA avec son style face visible.
 *
 * @param props.card Carte à présenter.
 * @param props.disabled Indique si la carte ne peut pas être sélectionnée.
 * @param props.compact Réduit la carte pour le plateau mobile et la table.
 * @param props.onClick Action déclenchée au clic.
 */
function PlayingCard({
  card,
  disabled,
  compact,
  onClick,
}: {
  card: Card;
  disabled?: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  const isRed = redSuits.has(card.suit);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${compact ? "h-24 w-16 p-2 sm:h-28 sm:w-20" : "h-32 w-24 p-3"} shrink-0 rounded-lg border-4 bg-white text-left shadow-[0_5px_0_#111827] transition ${
        disabled ? "cursor-not-allowed opacity-50" : "hover:-translate-y-2 hover:shadow-[0_9px_0_#111827]"
      } ${isRed ? "border-red-700 text-red-700" : "border-gray-900 text-gray-900"}`}
    >
      <div className={`${compact ? "text-lg sm:text-xl" : "text-2xl"} font-black leading-none`}>{card.value}</div>
      <div className={`${compact ? "mt-3 text-4xl sm:mt-4" : "mt-5 text-5xl"} text-center`}>{suitSymbols[card.suit]}</div>
    </button>
  );
}

/**
 * Affiche le dos d'une carte cachee sans révéler sa valeur.
 *
 * @param props.compact Réduit le dos pour les zones compactes.
 */
function HiddenCard({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`${compact ? "h-24 w-16 sm:h-28 sm:w-20" : "h-32 w-24"} flex shrink-0 items-center justify-center rounded-lg border-4 border-yellow-300 bg-emerald-950 shadow-[0_5px_0_#111827]`}
    >
      <div className="flex h-[78%] w-[76%] items-center justify-center rounded-md border-2 border-yellow-200 bg-[radial-gradient(circle_at_center,#facc15_0_12%,transparent_13%),linear-gradient(135deg,#064e3b,#022c22)] text-2xl font-black text-yellow-200">
        ?
      </div>
    </div>
  );
}

/**
 * Affiche une carte jouée avec l'identité du joueur.
 *
 * @param props.play Carte jouée sur le plateau.
 * @param props.player Joueur propriétaire de la carte.
 * @param props.position Position visuelle autour du tapis.
 */
function TablePlay({
  play,
  player,
  position,
}: {
  play: PlayedCard;
  player?: PublicSipaPlayer;
  position: string;
}) {
  return (
    <div className={`absolute ${position} flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2`}>
      <div className="rounded-full border-2 border-white/40 bg-black/25 px-3 py-1 text-center text-xs font-black text-white shadow">
        <span className="mr-1">{player?.emoji}</span>
        <span>{player?.username ?? "Joueur"}</span>
      </div>
      {play.hidden ? <HiddenCard compact /> : <PlayingCard card={play.card} compact disabled />}
    </div>
  );
}

/**
 * Donne une position stable pour chaque carte autour du centre du tapis.
 *
 * @param index Index de la carte dans l'ordre des joueurs.
 * @param total Nombre de joueurs.
 * @returns Classes Tailwind de positionnement.
 */
function getTablePosition(index: number, total: number): string {
  const layouts: Record<number, string[]> = {
    2: ["left-1/2 top-[28%]", "left-1/2 top-[72%]"],
    3: ["left-1/2 top-[24%]", "left-[24%] top-[68%]", "left-[76%] top-[68%]"],
    4: ["left-1/2 top-[22%]", "left-[22%] top-1/2", "left-1/2 top-[78%]", "left-[78%] top-1/2"],
    5: ["left-1/2 top-[20%]", "left-[22%] top-[42%]", "left-[30%] top-[76%]", "left-[70%] top-[76%]", "left-[78%] top-[42%]"],
  };

  return (layouts[total] ?? layouts[5])[index] ?? "left-1/2 top-1/2";
}

/**
 * Résout les cartes à afficher sur la table.
 *
 * @param state Etat public de la partie.
 * @returns La levée en cours ou la dernière levée terminee.
 */
function getVisibleTableTrick(state: PublicSipaGameState): {
  plays: PlayedCard[];
  trick?: CompletedTrick;
  mode: "current" | "last" | "empty";
} {
  if (state.currentTrick.length > 0) {
    return { plays: state.currentTrick, mode: "current" };
  }

  const lastTrick = state.completedTricks.at(-1);

  if (lastTrick) {
    return { plays: lastTrick.plays, trick: lastTrick, mode: "last" };
  }

  return { plays: [], mode: "empty" };
}

export default function Game() {
  const router = useRouter();
  const { channel } = router.query;
  const [gameState, setGameState] = useState<PublicSipaGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [socketId, setSocketId] = useState<string | undefined>();

  useEffect(() => {
    if (!channel || typeof channel !== "string") {
      return;
    }

    const socket = getSocket();
    socket.emit("get_game_state", channel);
    setSocketId(socket.id);

    const handleConnect = () => {
      setSocketId(socket.id);
      socket.emit("get_game_state", channel);
    };

    const handleGameState = (state: PublicSipaGameState) => {
      setGameState(state);
      setError(null);
    };

    const handleGameError = (message: string) => {
      setError(message);
    };

    socket.on("connect", handleConnect);
    socket.on("game_state", handleGameState);
    socket.on("game_error", handleGameError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("game_state", handleGameState);
      socket.off("game_error", handleGameError);
    };
  }, [channel]);

  const me = useMemo(
    () => gameState?.players.find((player) => player.id === socketId),
    [gameState, socketId],
  );
  const currentPlayer = gameState?.players.find((player) => player.id === gameState.currentPlayerId);
  const isMyTurn = Boolean(me && gameState?.currentPlayerId === me.id && gameState.status === "playing");
  const sortedPlayers = gameState?.players ?? [];
  const canAnnounceCombo789 = Boolean(
    me && gameState?.status === "playing" && gameState.comboWindowOpen && gameState.comboOptions.length > 0,
  );

  const playSelectedCard = (cardId: string) => {
    if (!channel || typeof channel !== "string") {
      return;
    }

    const socket = getSocket();
    socket.emit("play_card", { roomCode: channel, cardId });
  };

  const nextRound = () => {
    if (!channel || typeof channel !== "string") {
      return;
    }

    const socket = getSocket();
    socket.emit("next_round", { roomCode: channel });
  };

  const declareCombo789 = (suit: CardSuit) => {
    if (!channel || typeof channel !== "string") {
      return;
    }

    const socket = getSocket();
    socket.emit("declare_combo_789", { roomCode: channel, suit });
  };

  if (!gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-800 px-4 text-white">
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-black">SIPA</h1>
          <p className="text-lg">Chargement de la partie...</p>
          {error && <p className="mt-4 rounded bg-red-100 px-4 py-2 font-bold text-red-800">{error}</p>}
        </div>
      </div>
    );
  }

  const visibleTable = getVisibleTableTrick(gameState);
  const visibleTrickWinner = visibleTable.trick
    ? gameState.players.find((player) => player.id === visibleTable.trick?.winnerId)
    : undefined;
  const nextTrickIndex = Math.min(gameState.completedTricks.length + 1, 5);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#15803d,#064e3b_44%,#022c22)] text-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-emerald-950 bg-emerald-950/90 px-4 py-3 shadow-lg sm:px-6">
        <div>
          <h1 className="text-3xl font-black">SIPA</h1>
          <p className="font-mono text-sm text-emerald-100">Room {channel}</p>
        </div>
        <div className="text-right">
          <p className="text-sm uppercase tracking-wide text-emerald-100">Tour actuel</p>
          <p className="text-xl font-black">{currentPlayer ? `${currentPlayer.emoji} ${currentPlayer.username}` : "-"}</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-3 py-4 sm:px-4 lg:grid-cols-[18rem_1fr] lg:gap-6 lg:py-6">
        <aside className="overflow-hidden rounded-lg border-4 border-emerald-950 bg-white text-gray-900 shadow-[0_6px_0_#052e16]">
          <div className="border-b-4 border-emerald-950 bg-yellow-300 px-4 py-3">
            <h2 className="text-center text-lg font-black text-yellow-950 sm:text-xl">Scores</h2>
          </div>
          <div className="grid grid-cols-2 divide-x-2 divide-y-2 divide-gray-200 sm:grid-cols-3 lg:block lg:divide-x-0">
            {sortedPlayers.map((player) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 lg:p-4 ${
                  player.id === gameState.currentPlayerId ? "bg-emerald-50" : ""
                }`}
              >
                <div className="text-3xl lg:text-4xl">{player.emoji}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black">{player.username}</p>
                  <p className="text-sm font-bold text-gray-500">{player.cardsCount} cartes</p>
                </div>
                <div className="rounded bg-emerald-100 px-3 py-1 font-black text-emerald-900">
                  {player.score}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t-4 border-emerald-950 p-4 text-center text-sm font-bold text-gray-600">
            Objectif: {gameState.settings.targetScore} points
          </div>
        </aside>

        <section className="space-y-4 lg:space-y-6">
          {error && (
            <div className="rounded-lg border-4 border-red-900 bg-red-100 p-4 font-bold text-red-900">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-[2rem] border-4 border-emerald-950 bg-emerald-800 shadow-[0_8px_0_#052e16]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-emerald-950 bg-emerald-950/80 px-4 py-3">
              <div>
                <h2 className="text-2xl font-black">Table</h2>
                <p className="text-sm font-bold text-emerald-100">
                  Tour {visibleTable.mode === "last" ? visibleTable.trick?.index : nextTrickIndex}/5
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {gameState.comboWindowOpen && gameState.status === "playing" && (
                  <div className="rounded-full border-2 border-blue-200 bg-blue-100 px-4 py-2 text-sm font-black text-blue-950">
                    Annonce 7-8-9 ouverte
                  </div>
                )}
                <div className="rounded-full border-2 border-yellow-300 bg-yellow-200 px-4 py-2 text-sm font-black text-yellow-950">
                  {visibleTable.mode === "current"
                    ? "Cartes en cours"
                    : visibleTrickWinner
                      ? `Dernier tour remporte par ${visibleTrickWinner.username}`
                      : "En attente de la premiere carte"}
                </div>
              </div>
            </div>

            <div className="relative min-h-[24rem] overflow-hidden bg-[radial-gradient(circle_at_center,#16a34a_0,#047857_42%,#065f46_100%)] p-4 sm:min-h-[30rem]">
              <div className="absolute inset-6 rounded-full border-4 border-dashed border-white/20" />
              <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-yellow-300/70 bg-black/20 text-center text-sm font-black uppercase tracking-wide text-yellow-100 shadow-inner sm:h-36 sm:w-36">
                SIPA
              </div>

              {visibleTable.mode === "empty" ? (
                <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                  <p className="rounded-full bg-black/20 px-5 py-3 text-lg font-black text-emerald-50">
                    En attente de la premiere carte.
                  </p>
                </div>
              ) : (
                visibleTable.plays.map((play, index) => {
                  const player = gameState.players.find((candidate) => candidate.id === play.playerId);

                  return (
                    <TablePlay
                      key={`${visibleTable.mode}-${play.playerId}-${play.card.id}`}
                      play={play}
                      player={player}
                      position={getTablePosition(index, gameState.players.length)}
                    />
                  );
                })
              )}
            </div>
          </div>

          {gameState.completedTricks.length > 0 && (
            <div className="rounded-lg border-4 border-emerald-950 bg-white p-4 text-gray-900 shadow-[0_6px_0_#052e16]">
              <h2 className="mb-3 text-lg font-black">Historique des tours</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {gameState.completedTricks.map((trick) => {
                  const winner = gameState.players.find((player) => player.id === trick.winnerId);

                  return (
                    <div
                      key={trick.index}
                      className="min-w-44 rounded-lg border-2 border-gray-300 bg-gray-50 p-3"
                    >
                      <p className="text-sm font-black text-gray-500">Tour {trick.index}</p>
                      <p className="truncate font-black">{winner?.emoji} {winner?.username}</p>
                      <p className="mt-1 text-sm font-bold text-gray-600">
                        Carte gagnante: {trick.winningCard.value}{suitSymbols[trick.winningCard.suit]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-lg border-4 border-emerald-950 bg-white p-4 text-gray-900 shadow-[0_6px_0_#052e16] sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">Votre main</h2>
                <p className="font-bold text-gray-500">
                  {canAnnounceCombo789
                    ? "Vous pouvez annoncer 7-8-9 avant la premiere carte."
                    : isMyTurn
                      ? "A vous de jouer."
                      : "Patientez pendant le tour des autres joueurs."}
                </p>
              </div>
              {gameState.status === "round-ended" && me?.isCreator && (
                <button
                  type="button"
                  onClick={nextRound}
                  className="rounded-lg border-4 border-blue-800 bg-blue-500 px-5 py-3 font-black text-white shadow-[0_4px_0_#1e3a8a] hover:-translate-y-1"
                >
                  Manche suivante
                </button>
              )}
            </div>

            {canAnnounceCombo789 && (
              <div className="mb-4 rounded-lg border-4 border-blue-700 bg-blue-50 p-4">
                <p className="mb-3 font-black text-blue-950">
                  Annonce disponible: 7, 8 et 9 de la même famille.
                </p>
                <div className="flex flex-wrap gap-3">
                  {gameState.comboOptions.map((option) => (
                    <button
                      key={option.suit}
                      type="button"
                      onClick={() => declareCombo789(option.suit)}
                      className="rounded-lg border-4 border-blue-800 bg-blue-500 px-4 py-3 font-black text-white shadow-[0_4px_0_#1e3a8a] transition hover:-translate-y-1"
                    >
                      Annoncer 7-8-9 {suitSymbols[option.suit]} (+2 pts)
                    </button>
                  ))}
                </div>
              </div>
            )}

            {gameState.status === "finished" && (
              <div className="mb-4 rounded-lg border-4 border-yellow-700 bg-yellow-100 p-4 font-black text-yellow-950">
                Partie terminee. {gameState.players.find((player) => player.id === gameState.winnerId)?.username} gagne.
              </div>
            )}

            <div className="min-h-36 overflow-x-auto pb-3">
              <div className="flex min-w-max gap-3 sm:gap-4">
                {me?.hand?.map((card, index) => (
                  <div
                    key={card.id}
                    className="origin-bottom transition-transform sm:[&:nth-child(odd)]:rotate-[-2deg] sm:[&:nth-child(even)]:rotate-[2deg]"
                    style={{ marginLeft: index === 0 ? 0 : -10 }}
                  >
                    <PlayingCard
                      card={card}
                      disabled={!isMyTurn}
                      onClick={() => playSelectedCard(card.id)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {gameState.lastMessage && (
              <p className="mt-4 rounded bg-gray-100 px-4 py-3 font-bold text-gray-700">
                {gameState.lastMessage}
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
