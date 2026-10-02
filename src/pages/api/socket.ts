import { Server } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HttpServer } from 'http';
import { Player, GameSettings, Game } from '@/types';
import { CardSuit, createSipaGame, declareCombo789Win, declareFrop, playCard, startNextRound, toPublicSipaState } from '@/game';
import {
  BotPersonality, chooseBotCard, shouldDeclareCombo789, shouldDeclareFrop,
  pickBotName, pickBotAvatar, pickBotPersonality,
} from '@/game/botAI';

type SocketResponse = NextApiResponse & {
  socket: NonNullable<NextApiResponse["socket"]> & {
    server: HttpServer & {
      io?: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
    };
  };
};

// Type definitions for better type safety
type Games = {
  [roomCode: string]: Game;
};

interface SocketData {
  username?: string;
  emoji?: string;
  roomCode?: string;
  playerId?: string;
}

const ioHandler = (req: NextApiRequest, res: SocketResponse) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');

    const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(res.socket.server, {
      cors: {
        origin: '*', // Allow all origins (adjust for production)
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });
    res.socket.server.io = io;

    const games: Games = {};

    /** Personnalités des bots (botId → BotPersonality) */
    const botPersonalities: Record<string, BotPersonality> = {};

    /** Compteur pour générer des IDs de bots uniques */
    let botIdCounter = 0;

    /** Vérifie si un joueur est un bot */
    function isBot(playerId: string): boolean {
      return playerId.startsWith('bot-');
    }

    /** Crée un nouveau joueur bot et l'ajoute à la partie */
    function createBotPlayer(game: Game): Player {
      botIdCounter += 1;
      const botId = `bot-${botIdCounter}-${Date.now().toString(36)}`;
      const existingNames = game.players.map((p) => p.username);
      const username = pickBotName(existingNames);
      const emoji = pickBotAvatar(botIdCounter);
      const personality = pickBotPersonality();
      botPersonalities[botId] = personality;

      return {
        id: botId,
        username,
        emoji,
        isCreator: false,
      };
    }

    /**
     * Planifie le tour d'un bot avec un délai réaliste.
     * Enchaîne automatiquement si le joueur suivant est aussi un bot.
     */
    function scheduleBotTurn(roomCode: string): void {
      const game = games[roomCode];
      if (!game?.session || game.session.status !== 'playing') return;

      // D'abord, vérifier les annonces de TOUS les bots au début de la manche
      if (game.session.comboWindowOpen && game.session.currentTrick.length === 0 && game.session.completedTricks.length === 0) {
        scheduleBotsAnnouncements(roomCode);
        // Si après les annonces la manche est finie, on s'arrête
        const g = games[roomCode];
        if (!g?.session || g.session.status !== 'playing') return;
      }

      const currentId = game.session.currentPlayerId;
      if (!isBot(currentId)) return;

      const delay = 800 + Math.random() * 700; // 800-1500ms
      setTimeout(() => {
        const g = games[roomCode];
        if (!g?.session || g.session.status !== 'playing') return;
        if (g.session.currentPlayerId !== currentId) return; // Déjà joué

        const personality = botPersonalities[currentId] ?? 'malin';

        try {
          const card = chooseBotCard(g.session, currentId, personality);
          playCard(g.session, currentId, card.id);
          // playCard() mute status en interne, TS ne peut pas le détecter
          const status = g.session.status as string;
          if (status === 'finished') g.settings.status = 'finished';

          broadcastGameState(roomCode);

          // Enchaîner si le prochain joueur est un bot
          if (status === 'playing') {
            scheduleBotTurn(roomCode);
          }
        } catch (error) {
          console.error(`Bot ${currentId} error:`, error);
        }
      }, delay);
    }

    /**
     * Vérifie les annonces (combo 789, GONE) de tous les bots au début de manche.
     * Exécuté de façon synchrone puisque les annonces sont instantanées.
     */
    function scheduleBotsAnnouncements(roomCode: string): void {
      const game = games[roomCode];
      if (!game?.session || game.session.status !== 'playing') return;
      if (!game.session.comboWindowOpen) return;

      for (const player of game.session.players) {
        if (!isBot(player.id)) continue;

        // Vérifier combo 7-8-9
        const comboSuit = shouldDeclareCombo789(game.session, player.id);
        if (comboSuit) {
          declareCombo789Win(game.session, player.id, comboSuit);
          if ((game.session.status as string) === 'finished') game.settings.status = 'finished';
          broadcastGameState(roomCode);
          return; // Manche terminée par le combo
        }

        // Vérifier GONE
        const personality = botPersonalities[player.id] ?? 'malin';
        if (shouldDeclareFrop(game.session, player.id, personality)) {
          declareFrop(game.session, player.id);
          broadcastGameState(roomCode);
          // Continuer — le GONE ne termine pas la manche
        }
      }
    }

    /**
     * Ajoute ou met à jour un joueur dans une partie sans dupliquer sa socket.
     *
     * @param game Partie à modifier.
     * @param player Joueur à placer dans la liste.
     */
    const upsertPlayer = (game: Game, player: Player) => {
      const existingIndex = game.players.findIndex(existingPlayer => existingPlayer.id === player.id);

      if (existingIndex >= 0) {
        game.players[existingIndex] = player;
        return;
      }

      game.players.push(player);
    };

    /**
     * Envoie l'état complet de la partie à chaque joueur avec sa propre main.
     *
     * @param roomCode Code de la room à synchroniser.
     */
    const broadcastGameState = (roomCode: string) => {
      const game = games[roomCode];

      if (!game?.session) {
        return;
      }

      for (const player of game.players) {
        if (isBot(player.id)) continue; // Les bots n'ont pas de socket
        io.to(player.id).emit('game_state', toPublicSipaState(game.session, player.id));
      }
    };

    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);

      // Clean up user data when they disconnect
      const cleanupUser = () => {
        if (socket.data.roomCode && socket.data.playerId) {
          const game = games[socket.data.roomCode];
          if (game) {
            game.players = game.players.filter(p => p.id !== socket.data.playerId);
            io.to(socket.data.roomCode).emit('update_players', game.players);
            broadcastGameState(socket.data.roomCode);
            console.log(`Player ${socket.data.username} left room ${socket.data.roomCode}`);
          }
        }
      };

      // Create game with settings
      socket.on('create_game', ({ roomCode, username, emoji, maxPlayers, gameName }) => {
        console.log(`Creating game: ${roomCode} by ${username}`);

        socket.join(roomCode);
        socket.data.roomCode = roomCode;
        socket.data.username = username;
        socket.data.emoji = emoji;
        socket.data.playerId = socket.id;

        const player: Player = {
          id: socket.id,
          username,
          emoji,
          isCreator: true,
        };

        if (!games[roomCode]) {
          games[roomCode] = {
            settings: {
              roomCode,
              gameName,
              maxPlayers: maxPlayers || 4,
              minPlayers: 2,
              creatorId: socket.id,
              status: 'waiting',
            },
            players: [],
            createdAt: new Date(),
          };
        }

        const game = games[roomCode];

        if (game.settings.status !== 'waiting') {
          socket.emit('game_error', 'Cette partie a deja commence.');
          return;
        }

        game.settings = {
          ...game.settings,
          gameName,
          maxPlayers: maxPlayers || game.settings.maxPlayers,
          creatorId: socket.id,
        };
        game.players = game.players.map(existingPlayer => ({
          ...existingPlayer,
          isCreator: false,
        }));
        upsertPlayer(game, player);

        io.to(roomCode).emit('game_settings', game.settings);
        io.to(roomCode).emit('update_players', game.players);
        console.log(`Game ${roomCode} created with settings:`, game.settings);
      });

      // Join existing game
      socket.on('join_channel', (channel) => {
        if (typeof channel !== 'string') return;

        console.log(`User ${socket.id} joining channel: ${channel}`);
        socket.join(channel);
        socket.data.roomCode = channel;

        // Send game settings if they exist
        if (games[channel]) {
          socket.emit('game_settings', games[channel].settings);
          socket.emit('update_players', games[channel].players);
        }
      });

      // Register user in game
      socket.on('register_user', ({ channel, username, emoji }) => {
        if (typeof channel !== 'string' || typeof username !== 'string') return;

        console.log(`Registering user ${username} in channel ${channel}`);

        if (!games[channel]) {
          // Create a default game if it doesn't exist
          games[channel] = {
            settings: {
              roomCode: channel,
              maxPlayers: 4,
              minPlayers: 2,
              creatorId: socket.id,
              status: 'waiting',
            },
            players: [],
            createdAt: new Date(),
          };
        }

        socket.data.username = username;
        socket.data.emoji = emoji || '😀';
        socket.data.playerId = socket.id;
        socket.data.roomCode = channel;

        const game = games[channel];

        if (game.settings.status !== 'waiting') {
          socket.emit('game_error', 'Cette partie a deja commence.');
          return;
        }

        const alreadyRegistered = game.players.some(player => player.id === socket.id);

        if (!alreadyRegistered && game.players.length >= game.settings.maxPlayers) {
          socket.emit('game_error', 'Cette partie est complete.');
          return;
        }

        const player: Player = {
          id: socket.id,
          username,
          emoji: emoji || '😀',
          isCreator: socket.id === game.settings.creatorId,
        };

        upsertPlayer(game, player);
        io.to(channel).emit('game_settings', game.settings);
        io.to(channel).emit('update_players', game.players);
        console.log(`Player ${username} joined game ${channel}. Total players: ${game.players.length}`);
      });

      // Get game state
      socket.on('get_game_state', (channel) => {
        if (typeof channel !== 'string') return;

        if (games[channel]) {
          socket.emit('game_settings', games[channel].settings);
          socket.emit('update_players', games[channel].players);
          if (games[channel].session) {
            socket.emit('game_state', toPublicSipaState(games[channel].session, socket.id));
          }
        }
      });

      // Start game (creator only)
      socket.on('start_game', ({ roomCode }) => {
        if (typeof roomCode !== 'string') return;

        const game = games[roomCode];
        if (!game) {
          console.log(`Game ${roomCode} not found`);
          return;
        }

        // Verify the requester is the creator
        if (socket.id !== game.settings.creatorId) {
          console.log(`Unauthorized start game attempt by ${socket.id}`);
          return;
        }

        // Check minimum players
        if (game.players.length < game.settings.minPlayers) {
          console.log(`Not enough players to start game ${roomCode}`);
          return;
        }

        try {
          game.session = createSipaGame(game.players, game.settings.creatorId);
        } catch (error) {
          socket.emit('game_error', error instanceof Error ? error.message : 'Impossible de lancer la partie.');
          return;
        }

        game.settings.status = 'playing';
        io.to(roomCode).emit('game_started');
        broadcastGameState(roomCode);
        scheduleBotTurn(roomCode); // Lancer le tour du bot si c'est le premier joueur
        console.log(`Game ${roomCode} started with ${game.players.length} players`);
      });

      socket.on('play_card', ({ roomCode, cardId }) => {
        if (typeof roomCode !== 'string' || typeof cardId !== 'string') return;

        const game = games[roomCode];

        if (!game?.session) {
          socket.emit('game_error', 'Partie introuvable.');
          return;
        }

        try {
          playCard(game.session, socket.id, cardId);
          if (game.session.status === 'finished') {
            game.settings.status = 'finished';
          }
          broadcastGameState(roomCode);
          scheduleBotTurn(roomCode); // Enchaîner si le prochain joueur est un bot
        } catch (error) {
          socket.emit('game_error', error instanceof Error ? error.message : 'Coup refuse.');
        }
      });

      socket.on('declare_combo_789', ({ roomCode, suit }) => {
        if (typeof roomCode !== 'string' || typeof suit !== 'string') return;

        const game = games[roomCode];

        if (!game?.session) {
          socket.emit('game_error', 'Partie introuvable.');
          return;
        }

        if (!Object.values(CardSuit).includes(suit as CardSuit)) {
          socket.emit('game_error', 'Famille de carte invalide.');
          return;
        }

        try {
          declareCombo789Win(game.session, socket.id, suit as CardSuit);
          if (game.session.status === 'finished') {
            game.settings.status = 'finished';
          }
          broadcastGameState(roomCode);
          scheduleBotTurn(roomCode);
        } catch (error) {
          socket.emit('game_error', error instanceof Error ? error.message : 'Annonce refusee.');
        }
      });

      socket.on('declare_frop', ({ roomCode }) => {
        if (typeof roomCode !== 'string') return;

        const game = games[roomCode];

        if (!game?.session) {
          socket.emit('game_error', 'Partie introuvable.');
          return;
        }

        try {
          declareFrop(game.session, socket.id);
          broadcastGameState(roomCode);
          scheduleBotTurn(roomCode);
        } catch (error) {
          socket.emit('game_error', error instanceof Error ? error.message : 'Frop refusé.');
        }
      });

      socket.on('next_round', ({ roomCode }) => {
        if (typeof roomCode !== 'string') return;

        const game = games[roomCode];

        if (!game?.session) {
          socket.emit('game_error', 'Partie introuvable.');
          return;
        }

        if (socket.id !== game.settings.creatorId) {
          socket.emit('game_error', 'Seul le createur peut lancer la manche suivante.');
          return;
        }

        if (game.session.status !== 'round-ended') {
          socket.emit('game_error', 'La manche en cours nest pas terminee.');
          return;
        }

        game.session = startNextRound(game.session);
        broadcastGameState(roomCode);
        scheduleBotTurn(roomCode); // Lancer les bots pour la nouvelle manche
      });

      // Legacy support for old events
      socket.on('create_channel', (channel) => {
        if (typeof channel !== 'string') return;
        console.log(`Legacy create_channel: ${channel}`);
        socket.join(channel);
      });

      socket.on('get_users', (channel) => {
        if (typeof channel !== 'string') return;

        if (games[channel]) {
          socket.emit('update_players', games[channel].players);
        }
      });

      socket.on('send_message', ({ channel, message }) => {
        if (typeof channel !== 'string' || !message) return;

        io.to(channel).emit('receive_message', {
          sender: socket.data.username || 'Anonymous',
          text: message,
          timestamp: new Date().toISOString()
        });
      });

      socket.on('card_hover_start', ({ roomCode, cardIndex }) => {
        if (typeof roomCode !== 'string' || typeof cardIndex !== 'number') return;
        socket.to(roomCode).emit('opponent_card_hover', { playerId: socket.id, cardIndex });
      });

      socket.on('card_hover_end', ({ roomCode }) => {
        if (typeof roomCode !== 'string') return;
        socket.to(roomCode).emit('opponent_card_hover', { playerId: socket.id, cardIndex: null });
      });

      // ── Gestion des bots ────────────────────────────────────────────────────
      socket.on('add_bot', ({ roomCode }) => {
        if (typeof roomCode !== 'string') return;

        const game = games[roomCode];
        if (!game) return;
        if (socket.id !== game.settings.creatorId) return;
        if (game.settings.status !== 'waiting') return;
        if (game.players.length >= game.settings.maxPlayers) {
          socket.emit('game_error', 'Le nombre maximum de joueurs est atteint.');
          return;
        }

        const bot = createBotPlayer(game);
        game.players.push(bot);
        io.to(roomCode).emit('update_players', game.players);
        console.log(`Bot ${bot.username} (${bot.id}) added to room ${roomCode}`);
      });

      socket.on('remove_bot', ({ roomCode, botId }) => {
        if (typeof roomCode !== 'string' || typeof botId !== 'string') return;

        const game = games[roomCode];
        if (!game) return;
        if (socket.id !== game.settings.creatorId) return;
        if (game.settings.status !== 'waiting') return;
        if (!isBot(botId)) return;

        game.players = game.players.filter((p) => p.id !== botId);
        delete botPersonalities[botId];
        io.to(roomCode).emit('update_players', game.players);
        console.log(`Bot ${botId} removed from room ${roomCode}`);
      });

      socket.on('close_room', ({ roomCode }) => {
        if (typeof roomCode !== 'string') return;
        const game = games[roomCode];
        if (!game) return;
        if (socket.id !== game.settings.creatorId) return;
        // Nettoyer les personnalités des bots
        game.players.filter((p) => isBot(p.id)).forEach((p) => delete botPersonalities[p.id]);
        socket.to(roomCode).emit('room_closed');
        delete games[roomCode];
        console.log(`Room ${roomCode} closed by creator`);
      });

      socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        cleanupUser();
      });

      socket.on('error', (err) => {
        console.error('Socket error:', err);
      });
    });
  }
  res.end();
};

// Type definitions for events
interface ServerToClientEvents {
  update_players: (players: Player[]) => void;
  game_settings: (settings: GameSettings) => void;
  game_started: () => void;
  game_state: (state: import('@/types').PublicSipaGameState) => void;
  game_error: (message: string) => void;
  receive_message: (message: { sender: string; text: string; timestamp: string }) => void;
  update_users: (users: string[]) => void; // Legacy
  opponent_card_hover: (data: { playerId: string; cardIndex: number | null }) => void;
  room_closed: () => void;
}

interface ClientToServerEvents {
  create_game: (data: { roomCode: string; username: string; emoji: string; maxPlayers: number; gameName?: string }) => void;
  join_channel: (channel: string) => void;
  register_user: (data: { channel: string; username: string; emoji?: string }) => void;
  get_game_state: (channel: string) => void;
  start_game: (data: { roomCode: string }) => void;
  play_card: (data: { roomCode: string; cardId: string }) => void;
  declare_combo_789: (data: { roomCode: string; suit: CardSuit }) => void;
  declare_frop: (data: { roomCode: string }) => void;
  next_round: (data: { roomCode: string }) => void;
  add_bot: (data: { roomCode: string }) => void;
  remove_bot: (data: { roomCode: string; botId: string }) => void;
  create_channel: (channel: string) => void; // Legacy
  get_users: (channel: string) => void; // Legacy
  send_message: (data: { channel: string; message: string }) => void;
  card_hover_start: (data: { roomCode: string; cardIndex: number }) => void;
  card_hover_end: (data: { roomCode: string }) => void;
  close_room: (data: { roomCode: string }) => void;
}

export default ioHandler;
