export enum CardValue {
  Seven = "7",
  Eight = "8",
  Nine = "9",
  Ten = "10",
  Jack = "J",
  Queen = "Q",
  King = "K",
}

export enum CardSuit {
  Spade = "spade",
  Heart = "heart",
  Diamond = "diamond",
  Club = "club",
}

export interface Card {
  id: string;
  suit: CardSuit;
  value: CardValue;
}

export const CARD_VALUES = [
  CardValue.Seven,
  CardValue.Eight,
  CardValue.Nine,
  CardValue.Ten,
  CardValue.Jack,
  CardValue.Queen,
  CardValue.King,
] as const;

export const CARD_SUITS = [
  CardSuit.Spade,
  CardSuit.Heart,
  CardSuit.Diamond,
  CardSuit.Club,
] as const;

const CARD_STRENGTH: Record<CardValue, number> = {
  [CardValue.Seven]: 1,
  [CardValue.Eight]: 2,
  [CardValue.Nine]: 3,
  [CardValue.Ten]: 4,
  [CardValue.Jack]: 5,
  [CardValue.Queen]: 6,
  [CardValue.King]: 7,
};

/**
 * Compare deux cartes SIPA selon leur valeur uniquement.
 *
 * @param left Première carte à comparer.
 * @param right Deuxième carte à comparer.
 * @returns Un nombre positif si `left` est plus forte que `right`.
 */
export function compareCardValue(left: Card, right: Card): number {
  return CARD_STRENGTH[left.value] - CARD_STRENGTH[right.value];
}

/**
 * Vérifie si deux cartes représentent exactement la même carte du paquet.
 *
 * @param left Première carte.
 * @param right Deuxième carte.
 * @returns `true` si les identifiants des cartes sont identiques.
 */
export function isSameCard(left: Card, right: Card): boolean {
  return left.id === right.id;
}

/**
 * Formate une carte pour l'interface et les logs.
 *
 * @param card Carte à afficher.
 * @returns Libellé compact de la carte.
 */
export function formatCard(card: Card): string {
  const suitLabel: Record<CardSuit, string> = {
    [CardSuit.Spade]: "♠",
    [CardSuit.Heart]: "♥",
    [CardSuit.Diamond]: "♦",
    [CardSuit.Club]: "♣",
  };

  return `${card.value}${suitLabel[card.suit]}`;
}
