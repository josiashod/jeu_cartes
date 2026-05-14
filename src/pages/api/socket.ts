import { Server } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HttpServer } from 'http';
import { Player, GameSettings, Game } from '@/types';
import { CardSuit, createSipaGame, declareCombo789Win, playCard, startNextRound, toPublicSipaState } from '@/game';

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
        } catch (error) {
          socket.emit('game_error', error instanceof Error ? error.message : 'Annonce refusee.');
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
}

interface ClientToServerEvents {
  create_game: (data: { roomCode: string; username: string; emoji: string; maxPlayers: number; gameName?: string }) => void;
  join_channel: (channel: string) => void;
  register_user: (data: { channel: string; username: string; emoji?: string }) => void;
  get_game_state: (channel: string) => void;
  start_game: (data: { roomCode: string }) => void;
  play_card: (data: { roomCode: string; cardId: string }) => void;
  declare_combo_789: (data: { roomCode: string; suit: CardSuit }) => void;
  next_round: (data: { roomCode: string }) => void;
  create_channel: (channel: string) => void; // Legacy
  get_users: (channel: string) => void; // Legacy
  send_message: (data: { channel: string; message: string }) => void;
}

export default ioHandler;
