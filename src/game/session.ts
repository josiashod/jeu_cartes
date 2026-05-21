import { Card, CardSuit, CardValue, compareCardValue, isSameCard } from "./card";
import { SIPA_HAND_SIZE, createDeck, dealSipaHands, shuffleDeck } from "./deck";

export interface SipaPlayer {
  id: string;
  username: string;
  emoji: string;
  isCreator: boolean;
  hand: Card[];
  score: number;
}

export interface PlayedCard {
  playerId: string;
  card: Card;
  hidden: boolean;
}

export interface CompletedTrick {
  index: number;
  leadSuit: CardSuit;
  plays: PlayedCard[];
  winnerId: string;
  winningCard: Card;
}

export interface SipaGameSettings {
  targetScore: number;
}

export interface Combo789Option {
  suit: CardSuit;
  cards: Card[];
}

export interface SipaGameState {
  players: SipaPlayer[];
  dealerId: string;
  currentPlayerId: string;
  currentTrick: PlayedCard[];
  completedTricks: CompletedTrick[];
  comboWindowOpen: boolean;
  status: "playing" | "round-ended" | "finished";
  settings: SipaGameSettings;
  lastMessage?: string;
  winnerId?: string;
}

export interface PublicSipaPlayer {
  id: string;
  username: string;
  emoji: string;
  isCreator: boolean;
  score: number;
  cardsCount: number;
  hand?: Card[];
}

export interface PublicSipaGameState {
  players: PublicSipaPlayer[];
  dealerId: string;
  currentPlayerId: string;
  currentTrick: PlayedCard[];
  completedTricks: CompletedTrick[];
  comboWindowOpen: boolean;
  comboOptions: Combo789Option[];
  status: SipaGameState["status"];
  settings: SipaGameSettings;
  lastMessage?: string;
  winnerId?: string;
}

/**
 * Construit une nouvelle manche SIPA à partir des joueurs du lobby.
 *
 * @param players Joueurs inscrits dans la room.
 * @param creatorId Identifiant du créateur.
 * @param targetScore Score cible de la partie.
 * @returns État initial d'une partie SIPA.
 */
export function createSipaGame(
  players: Array<{ id: string; username: string; emoji: string }>,
  creatorId: string,
  targetScore = 12,
): SipaGameState {
  if (players.length < 2) {
    throw new Error("Il faut au moins deux joueurs pour lancer une partie.");
  }

  const deck = shuffleDeck(createDeck());
  const playerIds = players.map((player) => player.id);
  const { hands } = dealSipaHands(playerIds, deck);
  const dealerId = playerIds[0];

  return {
    players: players.map((player) => ({
      id: player.id,
      username: player.username,
      emoji: player.emoji,
      isCreator: player.id === creatorId,
      hand: hands[player.id],
      score: 0,
    })),
    dealerId,
    currentPlayerId: dealerId,
    currentTrick: [],
    completedTricks: [],
    comboWindowOpen: true,
    status: "playing",
    settings: { targetScore },
    lastMessage: "La partie commence. Les annonces 7-8-9 sont ouvertes.",
  };
}

/**
 * Transforme l'état serveur en état public adapté à un joueur.
 *
 * @param state État complet côté serveur.
 * @param viewerId Joueur qui reçoit l'état.
 * @returns État public avec uniquement la main du joueur concerné.
 */
export function toPublicSipaState(
  state: SipaGameState,
  viewerId: string,
): PublicSipaGameState {
  const viewer = state.players.find((player) => player.id === viewerId);

  return {
    ...state,
    players: state.players.map((player) => ({
      id: player.id,
      username: player.username,
      emoji: player.emoji,
      isCreator: player.isCreator,
      score: player.score,
      cardsCount: player.hand.length,
      hand: player.id === viewerId ? player.hand : undefined,
    })),
    comboOptions: state.comboWindowOpen
      ? findCombo789Options(viewer?.hand ?? [])
      : [],
  };
}

/**
 * Joue une carte et applique les règles de levée SIPA.
 *
 * @param state État mutable de la partie.
 * @param playerId Joueur qui joue.
 * @param cardId Identifiant de la carte jouée.
 * @returns Nouvel état après validation et application du coup.
 */
export function playCard(state: SipaGameState, playerId: string, cardId: string): SipaGameState {
  if (state.status !== "playing") {
    throw new Error("La partie n'est pas en cours.");
  }

  if (state.currentPlayerId !== playerId) {
    throw new Error("Ce n'est pas votre tour.");
  }

  const player = findPlayer(state, playerId);
  const card = player.hand.find((candidate) => candidate.id === cardId);

  if (!card) {
    throw new Error("Cette carte n'est pas dans votre main.");
  }

  const leadSuit = getLeadSuit(state.currentTrick);
  const mustFollowSuit = Boolean(leadSuit && player.hand.some((candidate) => candidate.suit === leadSuit));

  if (mustFollowSuit && card.suit !== leadSuit) {
    throw new Error("Vous devez fournir la couleur demandée.");
  }

  // Hors couleur, la carte est automatiquement cachée et ne peut pas gagner la levée.
  const hidden = Boolean(leadSuit && card.suit !== leadSuit);
  player.hand = player.hand.filter((candidate) => !isSameCard(candidate, card));
  state.currentTrick.push({ playerId, card, hidden });
  state.comboWindowOpen = false;

  if (state.currentTrick.length === state.players.length) {
    completeCurrentTrick(state);
  } else {
    state.currentPlayerId = nextPlayerId(state, playerId);
  }

  return state;
}

/**
 * Annonce une combinaison 7-8-9 de même famille au début d'une manche.
 *
 * @param state État mutable de la partie.
 * @param playerId Joueur qui annonce la combinaison.
 * @param suit Couleur de la combinaison 7-8-9.
 * @returns État après attribution des points.
 */
export function declareCombo789Win(
  state: SipaGameState,
  playerId: string,
  suit: CardSuit,
): SipaGameState {
  if (state.status !== "playing") {
    throw new Error("La partie n'est pas en cours.");
  }

  if (!state.comboWindowOpen || state.currentTrick.length > 0 || state.completedTricks.length > 0) {
    throw new Error("L'annonce 7-8-9 est possible uniquement au debut de la manche.");
  }

  const player = findPlayer(state, playerId);
  const combo = findCombo789Options(player.hand).find((option) => option.suit === suit);

  if (!combo) {
    throw new Error("Vous n'avez pas 7, 8 et 9 de cette famille.");
  }

  const points = 2;
  player.score += points;
  state.comboWindowOpen = false;
  state.currentPlayerId = playerId; // Le gagnant du combo commence la prochaine manche
  state.status = player.score >= state.settings.targetScore ? "finished" : "round-ended";
  state.winnerId = state.status === "finished" ? player.id : undefined;
  state.lastMessage = `${player.username} annonce 7-8-9 ${formatSuitName(suit)} et marque ${points} points.`;

  return state;
}

/**
 * Lance une nouvelle manche en conservant les scores courants.
 *
 * @param state État à réinitialiser pour une nouvelle manche.
 * @returns État prêt pour la manche suivante.
 */
export function startNextRound(state: SipaGameState): SipaGameState {
  const previousScores = new Map(state.players.map((player) => [player.id, player.score]));
  const deck = shuffleDeck(createDeck());
  const playerIds = state.players.map((player) => player.id);
  const { hands } = dealSipaHands(playerIds, deck);

  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      hand: hands[player.id],
      score: previousScores.get(player.id) ?? 0,
    })),
    currentPlayerId: state.currentPlayerId, // Le gagnant de la manche précédente commence
    currentTrick: [],
    completedTricks: [],
    comboWindowOpen: true,
    status: "playing",
    lastMessage: "Nouvelle manche. Les annonces 7-8-9 sont ouvertes.",
    winnerId: undefined,
  };
}

function completeCurrentTrick(state: SipaGameState): void {
  const trickIndex = state.completedTricks.length + 1;
  const winnerPlay = findWinningPlay(state.currentTrick);

  state.completedTricks.push({
    index: trickIndex,
    leadSuit: getLeadSuit(state.currentTrick)!,
    plays: [...state.currentTrick],
    winnerId: winnerPlay.playerId,
    winningCard: winnerPlay.card,
  });

  state.currentTrick = [];
  state.currentPlayerId = winnerPlay.playerId;

  if (trickIndex === SIPA_HAND_SIZE) {
    scoreRound(state, winnerPlay);
  } else {
    state.lastMessage = `${findPlayer(state, winnerPlay.playerId).username} remporte ce tour.`;
  }
}

function findWinningPlay(plays: PlayedCard[]): PlayedCard {
  const leadSuit = getLeadSuit(plays);
  const visibleLeadSuitPlays = plays.filter((play) => !play.hidden && play.card.suit === leadSuit);

  return visibleLeadSuitPlays.reduce((winner, play) =>
    compareCardValue(play.card, winner.card) > 0 ? play : winner,
  );
}

function scoreRound(state: SipaGameState, lastWinnerPlay: PlayedCard): void {
  const player = findPlayer(state, lastWinnerPlay.playerId);
  const previousTrick = state.completedTricks.at(-2);
  const foprrrr =
    previousTrick?.winnerId === player.id &&
    previousTrick.winningCard.value === CardValue.Seven &&
    lastWinnerPlay.card.value === CardValue.Seven;

  const points = foprrrr ? 4 : lastWinnerPlay.card.value === CardValue.Seven ? 2 : 1;
  player.score += points;
  state.status = player.score >= state.settings.targetScore ? "finished" : "round-ended";
  state.winnerId = state.status === "finished" ? player.id : undefined;
  state.lastMessage = `${player.username} marque ${points} point${points > 1 ? "s" : ""}.`;
}

function findPlayer(state: SipaGameState, playerId: string): SipaPlayer {
  const player = state.players.find((candidate) => candidate.id === playerId);

  if (!player) {
    throw new Error("Joueur introuvable.");
  }

  return player;
}

function getLeadSuit(plays: PlayedCard[]): CardSuit | undefined {
  return plays.find((play) => !play.hidden)?.card.suit;
}

function nextPlayerId(state: SipaGameState, playerId: string): string {
  const currentIndex = state.players.findIndex((player) => player.id === playerId);
  const nextIndex = (currentIndex + 1) % state.players.length;

  return state.players[nextIndex].id;
}

function findCombo789Options(hand: Card[]): Combo789Option[] {
  return Object.values(CardSuit).flatMap((suit) => {
    const cards = [CardValue.Seven, CardValue.Eight, CardValue.Nine]
      .map((value) => hand.find((card) => card.suit === suit && card.value === value));

    return cards.every(Boolean)
      ? [{ suit, cards: cards as Card[] }]
      : [];
  });
}

function formatSuitName(suit: CardSuit): string {
  const labels: Record<CardSuit, string> = {
    [CardSuit.Spade]: "pique",
    [CardSuit.Heart]: "coeur",
    [CardSuit.Diamond]: "carreau",
    [CardSuit.Club]: "trefle",
  };

  return labels[suit];
}
