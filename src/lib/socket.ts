import { io } from 'socket.io-client'

let socket;

export const getSocket = () => {
  if (!socket) {
    fetch('/api/socket');
    socket = io();
  }

  return socket
}