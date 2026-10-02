import { Card, CardSuit, CardValue, compareCardValue } from "./card";
import { SipaGameState, PlayedCard } from "./session";

// ── Types ─────────────────────────────────────────────────────────────────────

export type BotPersonality = "prudent" | "agressif" | "malin";

// ── Noms et avatars de bots ───────────────────────────────────────────────────

/** Prénoms ouest-africains pour les bots */
// export const BOT_NAMES = [
//   "Kofi", "Ama", "Kwame", "Akosua", "Yao",
//   "Adjoa", "Kojo", "Efua", "Kodjo", "Abla",
//   "Mensah", "Sena", "Foli", "Afi", "Edem",
// ];
let nb_bots = 1;


/** Combinaisons d'avatar prédéfinies pour les bots (face, eyes, mouth) */
const BOT_AVATARS: Array<{ face: number; eyes: number; mouth: number }> = [
  { face: 1, eyes: 0, mouth: 0 }, // Bleu, gros yeux, sourire
  { face: 3, eyes: 3, mouth: 3 }, // Orange, yeux joyeux, grimace
  { face: 4, eyes: 2, mouth: 1 }, // Rouge, étoiles, langue
  { face: 5, eyes: 4, mouth: 4 }, // Teal, spirales, zigzag
  { face: 2, eyes: 5, mouth: 5 }, // Jaune, cœurs, chat
  { face: 0, eyes: 1, mouth: 2 }, // Vert, X eyes, surprise
  { face: 1, eyes: 3, mouth: 0 }, // Bleu, joyeux, sourire
  { face: 4, eyes: 0, mouth: 3 }, // Rouge, gros yeux, grimace
];

/** Génère un nom de bot unique parmi ceux non encore utilisés */
export function pickBotName(existingNames: string[]): string {
  // const available = BOT_NAMES.filter((n) => !existingNames.includes(n));
  // if (available.length === 0) {
  //   // Tous les noms pris, ajouter un numéro
  //   return `Bot-${Math.floor(Math.random() * 900 + 100)}`;
  // }
  // return available[Math.floor(Math.random() * available.length)];
  return `Bot ${nb_bots++}`
}

/** Génère un emoji d'avatar aléatoire (encodé JSON) */
export function pickBotAvatar(index: number): string {
  const avatar = BOT_AVATARS[index % BOT_AVATARS.length];
  return JSON.stringify(avatar);
}

/** Attribue une personnalité aléatoire au bot */
export function pickBotPersonality(): BotPersonality {
  const personalities: BotPersonality[] = ["prudent", "agressif", "malin"];
  return personalities[Math.floor(Math.random() * personalities.length)];
}

// ── Logique IA ────────────────────────────────────────────────────────────────

/**
 * Vérifie si le bot devrait déclarer un combo 7-8-9 au début de la manche.
 * Retourne la couleur du combo, ou null si aucun combo disponible.
 */
export function shouldDeclareCombo789(
  state: SipaGameState,
  botId: string,
): CardSuit | null {
  if (!state.comboWindowOpen || state.currentTrick.length > 0 || state.completedTricks.length > 0) {
    return null;
  }

  const bot = state.players.find((p) => p.id === botId);
  if (!bot) return null;

  // Chercher un combo 7-8-9 dans la main du bot
  for (const suit of Object.values(CardSuit)) {
    const has7 = bot.hand.some((c) => c.suit === suit && c.value === CardValue.Seven);
    const has8 = bot.hand.some((c) => c.suit === suit && c.value === CardValue.Eight);
    const has9 = bot.hand.some((c) => c.suit === suit && c.value === CardValue.Nine);
    if (has7 && has8 && has9) {
      return suit; // Toujours déclarer le combo, c'est 2 pts gratuits
    }
  }

  return null;
}

/**
 * Décide si le bot devrait déclarer GONE (frop).
 * Seuls les bots "agressifs" le font, et uniquement avec une très bonne main.
 */
export function shouldDeclareFrop(
  state: SipaGameState,
  botId: string,
  personality: BotPersonality,
): boolean {
  if (personality !== "agressif") return false;
  if (!state.comboWindowOpen || state.currentTrick.length > 0 || state.completedTricks.length > 0) {
    return false;
  }
  if (state.fropPlayerId) return false;

  const bot = state.players.find((p) => p.id === botId);
  if (!bot) return false;

  // Évaluer la force de la main
  const strength = evaluateHandStrength(bot.hand);

  // GONE seulement si la main est très forte (>= 28 sur 35 max)
  return strength >= 28;
}

/**
 * Choisit la meilleure carte à jouer pour le bot.
 * C'est le cœur de l'IA.
 */
export function chooseBotCard(
  state: SipaGameState,
  botId: string,
  personality: BotPersonality,
): Card {
  const bot = state.players.find((p) => p.id === botId);
  if (!bot || bot.hand.length === 0) {
    throw new Error("Bot sans cartes");
  }

  const hand = bot.hand;
  const trickIndex = state.completedTricks.length + 1; // Pli actuel (1 à 5)
  const isLastTrick = trickIndex === 5;
  const isPenultimateTrick = trickIndex === 4;
  const leadSuit = getLeadSuit(state.currentTrick);
  const isLeading = state.currentTrick.length === 0;

  // Cartes jouables (respect du suivi de couleur)
  const playable = getPlayableCards(hand, leadSuit);

  if (playable.length === 1) {
    return playable[0]; // Pas de choix
  }

  // ── Dernier pli (5ème) — critique pour le scoring ──────────────────────
  if (isLastTrick) {
    return chooseForLastTrick(playable, leadSuit, state, botId, personality);
  }

  // ── Avant-dernier pli (4ème) — préparer le 5ème ───────────────────────
  if (isPenultimateTrick) {
    return chooseForPenultimateTrick(playable, leadSuit, state, botId, personality);
  }

  // ── Plis 1-3 — jeu conservateur ────────────────────────────────────────
  return chooseForEarlyTrick(playable, leadSuit, state, botId, personality);
}

// ── Stratégies par phase ──────────────────────────────────────────────────────

/** Stratégie pour le 5ème et dernier pli (seul pli qui rapporte des points) */
function chooseForLastTrick(
  playable: Card[],
  leadSuit: CardSuit | undefined,
  state: SipaGameState,
  botId: string,
  personality: BotPersonality,
): Card {
  // Priorité 1 : jouer un 7 si possible (vaut 2 points au lieu de 1)
  const sevens = playable.filter((c) => c.value === CardValue.Seven);
  if (sevens.length > 0 && leadSuit) {
    // Si on a un 7 de la bonne couleur, le jouer
    const sevenInSuit = sevens.find((c) => c.suit === leadSuit);
    if (sevenInSuit) return sevenInSuit;
  }

  if (leadSuit) {
    // On suit la couleur : essayer de gagner avec la carte la plus forte
    const inSuit = playable.filter((c) => c.suit === leadSuit);
    if (inSuit.length > 0) {
      const currentWinner = findCurrentWinner(state.currentTrick, leadSuit);
      const canWin = inSuit.filter((c) =>
        !currentWinner || compareCardValue(c, currentWinner.card) > 0,
      );

      if (canWin.length > 0) {
        // On peut gagner ! Jouer un 7 en priorité, sinon la plus forte
        const winSeven = canWin.find((c) => c.value === CardValue.Seven);
        if (winSeven) return winSeven;
        return strongest(canWin);
      }

      // On ne peut pas gagner, jouer la plus faible
      return weakest(inSuit);
    }
  }

  // On ouvre le pli ou on défausse
  if (!leadSuit) {
    // On ouvre : jouer un 7 (vaut double) si on en a, sinon la plus forte
    if (sevens.length > 0) return sevens[0];
    return strongest(playable);
  }

  // Défausse : jouer la carte la plus faible
  return weakest(playable);
}

/** Stratégie pour le 4ème pli (avant-dernier, préparer la finale) */
function chooseForPenultimateTrick(
  playable: Card[],
  leadSuit: CardSuit | undefined,
  state: SipaGameState,
  botId: string,
  personality: BotPersonality,
): Card {
  // Stratégie du "malin" : essayer de gagner le 4ème pli avec un 7
  // pour le combo Foprrrr (4 pts) si on gagne aussi le 5ème avec un 7
  if (personality === "malin") {
    const sevens = playable.filter((c) => c.value === CardValue.Seven);
    const bot = state.players.find((p) => p.id === botId)!;
    const otherSevens = bot.hand.filter(
      (c) => c.value === CardValue.Seven && !playable.includes(c),
    );

    // Si on a 2 sept (un jouable maintenant, un gardé pour le pli 5)
    if (sevens.length > 0 && (sevens.length + otherSevens.length) >= 2) {
      if (leadSuit) {
        const sevenInSuit = sevens.find((c) => c.suit === leadSuit);
        if (sevenInSuit) {
          const currentWinner = findCurrentWinner(state.currentTrick, leadSuit);
          // Seulement si le 7 peut gagner (c'est une carte faible)
          if (!currentWinner || compareCardValue(sevenInSuit, currentWinner.card) > 0) {
            return sevenInSuit;
          }
        }
      } else {
        // On ouvre avec un 7
        return sevens[0];
      }
    }
  }

  // Sinon, jeu standard : essayer de gagner si possible, sinon jouer faible
  if (leadSuit) {
    const inSuit = playable.filter((c) => c.suit === leadSuit);
    if (inSuit.length > 0) {
      const currentWinner = findCurrentWinner(state.currentTrick, leadSuit);
      if (personality === "agressif") {
        // Agressif : toujours tenter de gagner
        const canWin = inSuit.filter(
          (c) => !currentWinner || compareCardValue(c, currentWinner.card) > 0,
        );
        if (canWin.length > 0) return weakest(canWin); // Gagner au moindre coût
      }
      // Prudent/malin : jouer la plus faible
      return weakest(inSuit);
    }
  }

  // Ouvre le pli ou défausse : jouer la plus faible, garder les 7
  return weakestNonSeven(playable);
}

/** Stratégie pour les plis 1-3 (jeu conservateur, préserver les cartes fortes) */
function chooseForEarlyTrick(
  playable: Card[],
  leadSuit: CardSuit | undefined,
  state: SipaGameState,
  botId: string,
  personality: BotPersonality,
): Card {
  if (leadSuit) {
    const inSuit = playable.filter((c) => c.suit === leadSuit);
    if (inSuit.length > 0) {
      if (personality === "agressif") {
        // Agressif : essayer de gagner tôt pour prendre la main
        const currentWinner = findCurrentWinner(state.currentTrick, leadSuit);
        const canWin = inSuit.filter(
          (c) => !currentWinner || compareCardValue(c, currentWinner.card) > 0,
        );
        if (canWin.length > 0) return weakest(canWin);
      }
      // Prudent/malin : jouer la plus faible pour économiser
      return weakest(inSuit);
    }
    // Défausse : cartes les plus faibles, garder les 7
    return weakestNonSeven(playable);
  }

  // On ouvre le pli : jouer une carte moyenne/faible
  if (personality === "agressif") {
    // Agressif : ouvrir avec une carte forte pour forcer les adversaires
    return strongest(playable.filter((c) => c.value !== CardValue.Seven));
  }

  // Prudent/malin : ouvrir avec la plus faible (pas un 7)
  return weakestNonSeven(playable);
}

// ── Utilitaires ───────────────────────────────────────────────────────────────

/** Retourne les cartes que le bot peut légalement jouer */
function getPlayableCards(hand: Card[], leadSuit: CardSuit | undefined): Card[] {
  if (!leadSuit) return [...hand];

  const inSuit = hand.filter((c) => c.suit === leadSuit);
  return inSuit.length > 0 ? inSuit : [...hand];
}

/** Retourne la couleur du pli en cours, ou undefined si vide */
function getLeadSuit(currentTrick: PlayedCard[]): CardSuit | undefined {
  return currentTrick.find((p) => !p.hidden)?.card.suit;
}

/** Trouve le joueur qui gagne actuellement le pli */
function findCurrentWinner(
  currentTrick: PlayedCard[],
  leadSuit: CardSuit,
): PlayedCard | undefined {
  const visible = currentTrick.filter((p) => !p.hidden && p.card.suit === leadSuit);
  if (visible.length === 0) return undefined;
  return visible.reduce((best, play) =>
    compareCardValue(play.card, best.card) > 0 ? play : best,
  );
}

/** Évalue la force d'une main (0-35, 5 cartes × 7 max) */
function evaluateHandStrength(hand: Card[]): number {
  const STRENGTH: Record<CardValue, number> = {
    [CardValue.Seven]: 1,
    [CardValue.Eight]: 2,
    [CardValue.Nine]: 3,
    [CardValue.Ten]: 4,
    [CardValue.Jack]: 5,
    [CardValue.Queen]: 6,
    [CardValue.King]: 7,
  };
  return hand.reduce((sum, c) => sum + STRENGTH[c.value], 0);
}

/** La carte la plus forte d'un ensemble */
function strongest(cards: Card[]): Card {
  return cards.reduce((best, c) =>
    compareCardValue(c, best) > 0 ? c : best,
  );
}

/** La carte la plus faible d'un ensemble */
function weakest(cards: Card[]): Card {
  return cards.reduce((best, c) =>
    compareCardValue(c, best) < 0 ? c : best,
  );
}

/** La carte la plus faible qui n'est pas un 7 (on préserve les 7 pour le pli 5) */
function weakestNonSeven(cards: Card[]): Card {
  const nonSevens = cards.filter((c) => c.value !== CardValue.Seven);
  if (nonSevens.length === 0) return weakest(cards);
  return weakest(nonSevens);
}
