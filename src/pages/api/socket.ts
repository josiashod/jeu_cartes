import { Server } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';

// Type definitions for better type safety
type ChannelUsers = {
  [channel: string]: string[];
};

interface SocketData {
  username?: string;
  channels?: string[];
}

const ioHandler = (req: NextApiRequest, res: NextApiResponse) => {
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

    const users: ChannelUsers = {};

    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);
      socket.data.channels = [];
      
      // Clean up user data when they disconnect
      const cleanupUser = () => {
        if (socket.data.channels) {
          socket.data.channels.forEach(channel => {
            if (users[channel] && socket.data.username) {
              users[channel] = users[channel].filter(u => u !== socket.data.username);
              io.to(channel).emit('update_users', users[channel]);
            }
          });
        }
      };

      socket.on('create_channel', (channel) => {
        if (typeof channel !== 'string') return;
        
        console.log(`Received create_channel event for channel: ${channel}`);
        socket.join(channel);
        socket.data.channels?.push(channel);
        console.log(`Channel created: ${channel}`);
        
        if (!users[channel]) {
          users[channel] = [];
        }
      });

      socket.on('join_channel', (channel) => {
        if (typeof channel !== 'string') return;
        
        console.log(`Received join_channel event for channel: ${channel}`);
        socket.join(channel);
        socket.data.channels?.push(channel);
        console.log(`User ${socket.id} joined channel ${channel}`);

        if (!users[channel]) {
          users[channel] = [];
        }
      });

      socket.on('register_user', ({ channel, username }) => {
        if (typeof channel !== 'string' || typeof username !== 'string') return;
        
        console.log(`Received register_user event for channel: ${channel}, username: ${username}`);
        if (!users[channel]) {
          users[channel] = [];
        }
        
        if (!users[channel].includes(username)) {
          users[channel].push(username);
          socket.data.username = username;
          io.to(channel).emit('update_users', users[channel]);
          console.log(`User ${username} registered in channel ${channel}`);
        }
      });

      socket.on('get_users', (channel) => {
        if (typeof channel !== 'string') return;
        
        if (users[channel]) {
          socket.emit('update_users', users[channel]);
        }
      });

      socket.on('send_message', ({ channel, message }) => {
        if (typeof channel !== 'string' || !message) return;
        
        if (users[channel]) {
          io.to(channel).emit('receive_message', {
            sender: socket.data.username || 'Anonymous',
            text: message,
            timestamp: new Date().toISOString()
          });
          console.log(`Message sent to channel ${channel}:`, message);
        }
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
  update_users: (users: string[]) => void;
  receive_message: (message: { sender: string; text: string; timestamp: string }) => void;
}

interface ClientToServerEvents {
  create_channel: (channel: string) => void;
  join_channel: (channel: string) => void;
  register_user: (data: { channel: string; username: string }) => void;
  get_users: (channel: string) => void;
  send_message: (data: { channel: string; message: string }) => void;
}

export default ioHandler;