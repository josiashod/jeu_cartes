import { useState } from 'react';
import { useRouter } from 'next/router';
import "@/app/globals.css";
import { io } from 'socket.io-client';

const socket = io();

export default function CreateChannel() {
  const [channelCode, setChannelCode] = useState('');
  const router = useRouter();

  const generateChannel = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setChannelCode(code);
    localStorage.setItem('channelCode', code);

    // Inform the server about the new channel
    socket.emit('create_channel', code);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/join?channel=${channelCode}`;
    navigator.clipboard.writeText(link);
    alert('Lien copié dans le presse-papier !');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Créer un canal</h1>
      <button
        onClick={generateChannel}
        className="px-4 py-2 bg-blue-500 text-white rounded mb-4"
      >
        Générer un canal
      </button>
      {channelCode && (
        <div className="text-center">
          <p className="mb-2">Code du canal : <strong>{channelCode}</strong></p>
          <button
            onClick={copyLink}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Copier le lien
          </button>
        </div>
      )}
    </div>
  );
}