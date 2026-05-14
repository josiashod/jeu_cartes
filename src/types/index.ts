import { PublicSipaGameState, SipaGameState } from "@/game";

// Player types
export interface Player {
  id: string;
  username: string;
  emoji: string;
  isCreator: boolean;
}

// Game settings
export interface GameSettings {
  roomCode: string;
  gameName?: string;
  maxPlayers: number;
  minPlayers: number;
  creatorId: string;
  status: 'waiting' | 'starting' | 'playing' | 'finished';
}

// Game state
export interface Game {
  settings: GameSettings;
  players: Player[];
  createdAt: Date;
  session?: SipaGameState;
}

// Socket event types
export interface CreateGameData {
  roomCode: string;
  username: string;
  emoji: string;
  maxPlayers: number;
  gameName?: string;
}

export interface JoinGameData {
  roomCode: string;
  username: string;
  emoji: string;
}

export interface StartGameData {
  roomCode: string;
}

export interface PlayCardData {
  roomCode: string;
  cardId: string;
}

export type { PublicSipaGameState };

// Language types
export type Language = 'en' | 'fr';

export interface Translations {
  [key: string]: string | Translations;
}
