import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io();

export default function Channel() {
  const router = useRouter();
  const { channel } = router.query;
  const [users, setUsers] = useState<string[]>([]);

  useEffect(() => {
    socket.emit('get_users', channel);

    socket.on('update_users', (userList) => {
      setUsers(userList);
    });

    return () => {
      socket.off('update_users');
    };
  }, [channel]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Canal : {channel}</h1>
      <h2 className="text-xl mb-4">Membres inscrits :</h2>
      <ul className="list-disc">
        {users.map((user, index) => (
          <li key={index}>{user}</li>
        ))}
      </ul>
    </div>
  );
}