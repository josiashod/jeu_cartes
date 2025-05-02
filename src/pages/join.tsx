import "@/app/globals.css";
import { useRouter } from 'next/router';
import { useState } from 'react';
import { getSocket } from '@/lib/socket';

const socket = getSocket();

export default function JoinChannel() {
  const router = useRouter();
  const { channel } = router.query;
  const [username, setUsername] = useState('');

  const joinChannel = () => {
    if (username) {
      socket.emit('join_channel', channel);
      socket.emit('register_user', { channel, username });
      router.push(`/channel?channel=${channel}`);
    } else {
      alert('Veuillez entrer un nom d’utilisateur.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Rejoindre le canal</h1>
      <p className="mb-4">Canal : <strong>{channel}</strong></p>
      <input
        type="text"
        placeholder="Entrez votre nom d’utilisateur"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="px-4 py-2 border rounded mb-4"
      />
      <button
        onClick={joinChannel}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Rejoindre
      </button>
    </div>
  );
}