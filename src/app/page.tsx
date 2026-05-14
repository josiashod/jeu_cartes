"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  const handleCreateGame = () => {
    router.push('/create-game');
  };

  const handleJoinGame = () => {
    if (roomCode.trim()) {
      router.push(`/join?channel=${roomCode.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div></div>
        <LanguageSwitcher />
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center px-4 pt-12">
        {/* Logo */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="inline-block bg-white border-4 border-gray-800 rounded-2xl px-12 py-6 shadow-[0_8px_0_#2c3e50] mb-8">
            <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              SIPA
            </h1>
          </div>
          <p className="text-2xl text-gray-700 font-semibold">
            {t('home.subtitle')}
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-6 w-full max-w-lg mb-12">
          {/* Create Game Button */}
          <button
            onClick={handleCreateGame}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold py-5 px-8 rounded-xl border-4 border-blue-700 shadow-[0_6px_0_#1e40af] hover:shadow-[0_8px_0_#1e40af] hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#1e40af] transition-all duration-150"
          >
            🎮 {t('home.createGame')}
          </button>

          {/* Join Game Section */}
          {!showJoinInput ? (
            <button
              onClick={() => setShowJoinInput(true)}
              className="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-5 px-8 rounded-xl border-4 border-green-700 shadow-[0_6px_0_#15803d] hover:shadow-[0_8px_0_#15803d] hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#15803d] transition-all duration-150"
            >
              🚪 {t('home.joinGame')}
            </button>
          ) : (
            <div className="bg-white border-4 border-gray-800 rounded-xl p-6 shadow-[0_6px_0_#2c3e50]">
              <label className="block text-gray-700 font-bold mb-3 text-lg">
                {t('home.enterRoomCode')}
              </label>
              <input
                type="text"
                placeholder="ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border-3 border-gray-400 rounded-lg text-center text-2xl font-mono font-bold uppercase mb-4 focus:outline-none focus:border-blue-500"
                maxLength={6}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowJoinInput(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg border-3 border-gray-600 shadow-[0_4px_0_#4b5563] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_#4b5563] transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleJoinGame}
                  disabled={!roomCode.trim()}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg border-3 border-green-700 shadow-[0_4px_0_#15803d] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_#15803d] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('home.join')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* How to play */}
        <div className="bg-yellow-100 border-4 border-yellow-600 rounded-xl p-6 max-w-2xl shadow-[0_6px_0_#ca8a04]">
          <h3 className="text-xl font-bold text-yellow-900 mb-3 flex items-center gap-2">
            💡 {t('home.howToPlay')}
          </h3>
          <ul className="text-yellow-900 space-y-2">
            <li>• {t('home.createGame')} - Create a new game room</li>
            <li>• {t('home.joinGame')} - Join with a room code</li>
            <li>• Share the code with friends!</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-gray-600 py-8 mt-12">
        <p className="text-sm">© 2026 SIPA</p>
      </footer>
    </div>
  );
}
