"use client";
// import Image from "next/image";
import { getSocket } from '@/lib/socket';
import { useRouter } from 'next/navigation';

const socket = getSocket();

export default function Home() {
  const router = useRouter();
    // useEffect(() => {

    //   // socket.on('connectsocket', (data) => {
    //   //   console.log('connected', data)
    //   // })

    //   return () => {
    //     // socket.off('connectsocket')
    //   }
    // }, [])

  const generateChannel = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    // Inform the server about the new channel
    socket.emit('create_channel', code);
    localStorage.setItem('channelCode', code);
    router.push(`/join?channel=${code}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Create a private game play room</h1>
      <button
        onClick={generateChannel}
        className="px-4 py-2 bg-blue-500 text-white rounded mb-4"
      >
        Générer un canal 
      </button>
    </div>
  );
}
