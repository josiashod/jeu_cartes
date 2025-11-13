"use client";
// import Image from "next/image";
import { useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useRouter } from 'next/navigation';

const socket = getSocket();

export default function Home() {
  const [channelCode, setChannelCode] = useState('');
  const [ isAlertVisible, setIsAlertVisible ] = useState(false);
  const [username, setUsername] = useState('');
  const router = useRouter();

  const createPrivateRoom = () => {
    if(!username) {
      alert('Veuillez entrer un nom d’utilisateur.');
      return;
    }
    let code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setChannelCode(code);
    // Inform the server about the new channel
    socket.emit('create_channel', code);
    socket.emit('join_channel', code);
    socket.emit('register_user', { code, username });
    router.push(`/join?channel=${code}`);
    // localStorage.setItem('channelCode', code);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/join?channel=${channelCode}`;
    navigator.clipboard.writeText(link);
    setIsAlertVisible(true);
    setTimeout(() => { setIsAlertVisible(false);}, 800);
  };

  return (
    <div className="flex flex-col items-center justify-center bg-teal-600 h-screen">
      <div className="max-w-lg shadow-md absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
        <div className="h-40 bg-red-500 rounded-t-md bg-cover bg-center" style={{ backgroundImage: 'url("https://www.francebleu.fr/pikapi/images/5848d73a-7dfe-4bac-b074-b4743014d1e1/1200x680?webp=false")' }}
        ></div>
        <div className="px-6 py-2 bg-white rounded-b-md bg-opacity-80 bakdrop-blur-md">
          <h1 className="text-2xl font-bold mb-4">Create a private game play room</h1>
        
          <input
            type="text"
            placeholder="Entrez votre nom d’utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="px-4 py-2 border rounded mb-4 w-full"
          />

          {/* {channelCode && (
            <div className="">
              <p className="mb-4">Code du canal : <strong>{channelCode}</strong>
                <button 
                  onClick={copyLink}
                  className="ml-2 text-gray">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard" viewBox="0 0 16 16">
                    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
                  </svg>
                </button>
              </p>

              {isAlertVisible && <div className="flex rounded-md items-center p-4 mb-4 text-sm text-green-700 rounded-base bg-green-200" role="alert">
                <svg className="w-4 h-4 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                Lien copié.
              </div>}
            </div>
          )} */}

          <button
            onClick={createPrivateRoom}
            className="px-4 py-2 bg-teal-500 text-white rounded mb-4 w-full"
          >
            Créer une partie privée
          </button>
        </div>
      </div>
    </div>
  );
}
