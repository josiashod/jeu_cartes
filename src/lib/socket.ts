import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'

let socket: Socket | undefined;

export const getSocket = () => {
  if (!socket) {
    fetch('/api/socket');
    socket = io();
  }

  return socket
}
