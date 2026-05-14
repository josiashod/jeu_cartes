import { CARD_SUITS, CARD_VALUES, Card } from "./card";

export const SIPA_HAND_SIZE = 5;

/**
 * Crée le paquet SIPA de 28 cartes, du 7 au Roi dans chaque couleur.
 *
 * @returns Paquet ordonné de cartes SIPA.
 */
export function createDeck(): Card[] {
  return CARD_SUITS.flatMap((suit) =>
    CARD_VALUES.map((value) => ({
      id: `${value}-${suit}`,
      suit,
      value,
    })),
  );
}

/**
 * Mélange un paquet avec l'algorithme de Fisher-Yates.
 *
 * @param cards Cartes à mélanger.
 * @returns Nouveau tableau de cartes mélangées.
 */
export function shuffleDeck(cards: Card[]): Card[] {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

/**
 * Indique si le paquet SIPA contient assez de cartes pour distribuer une main.
 *
 * @param playerCount Nombre de joueurs à servir.
 * @param cardsPerPlayer Nombre de cartes par joueur.
 * @returns `true` si la distribution est possible.
 */
export function isDeckShareable(playerCount: number, cardsPerPlayer = SIPA_HAND_SIZE): boolean {
  return playerCount > 0 && playerCount * cardsPerPlayer <= createDeck().length;
}

/**
 * Distribue les cartes SIPA en deux passes, 3 cartes puis 2 cartes.
 *
 * @param playerIds Identifiants des joueurs dans l'ordre de table.
 * @param deck Paquet déjà mélangé.
 * @returns Les mains par joueur et le talon restant.
 */
export function dealSipaHands(
  playerIds: string[],
  deck: Card[],
): { hands: Record<string, Card[]>; remainingDeck: Card[] } {
  if (!isDeckShareable(playerIds.length)) {
    throw new Error("Le paquet SIPA ne permet pas de servir tous les joueurs.");
  }

  const hands = Object.fromEntries(playerIds.map((id) => [id, [] as Card[]]));
  const remainingDeck = [...deck];

  for (const chunkSize of [3, 2]) {
    for (const playerId of playerIds) {
      const cards = remainingDeck.splice(0, chunkSize);
      hands[playerId].push(...cards);
    }
  }

  return { hands, remainingDeck };
}
