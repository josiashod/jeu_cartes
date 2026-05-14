'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import EmojiPicker from '@/components/EmojiPicker';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function CreateGame() {
    const [username, setUsername] = useState('');
    const [emoji, setEmoji] = useState('😀');
    const [maxPlayers, setMaxPlayers] = useState(4);
    const [gameName, setGameName] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const router = useRouter();
    const { t } = useLanguage();

    const handleCreateGame = () => {
        if (!username.trim()) {
            alert(t('createGame.usernameRequired'));
            return;
        }

        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const creatorName = username.trim();

        localStorage.setItem(
            `sipa-player-${roomCode}`,
            JSON.stringify({
                username: creatorName,
                emoji,
                isCreator: true,
                maxPlayers,
                gameName: gameName.trim() || undefined,
            }),
        );

        router.push(`/lobby?channel=${roomCode}&creator=true`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
            {/* Header */}
            <header className="p-6 flex justify-between items-center">
                <button
                    onClick={() => router.push('/')}
                    className="text-gray-700 hover:text-gray-900 font-bold flex items-center gap-2"
                >
                    ← {t('common.back')}
                </button>
                <LanguageSwitcher />
            </header>

            {/* Main content */}
            <main className="flex items-center justify-center px-4 pb-12">
                <div className="bg-white border-4 border-gray-800 rounded-2xl p-8 shadow-[0_8px_0_#2c3e50] max-w-lg w-full">
                    <h1 className="text-3xl font-black text-gray-800 mb-6 text-center">
                        {t('createGame.title')}
                    </h1>

                    {/* Avatar selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            {t('createGame.chooseAvatar')}
                        </label>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="w-20 h-20 text-5xl bg-gray-100 border-3 border-gray-400 rounded-xl hover:bg-gray-200 hover:border-gray-500 transition-all flex items-center justify-center"
                            >
                                {emoji}
                            </button>
                            <div className="flex-1">
                                <p className="text-sm text-gray-600">
                                    Click to change avatar
                                </p>
                            </div>
                        </div>

                        {showEmojiPicker && (
                            <div className="mt-4">
                                <EmojiPicker selectedEmoji={emoji} onSelect={(e) => {
                                    setEmoji(e);
                                    setShowEmojiPicker(false);
                                }} />
                            </div>
                        )}
                    </div>

                    {/* Username */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            {t('createGame.username')}
                        </label>
                        <input
                            type="text"
                            placeholder={t('createGame.usernamePlaceholder')}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 border-3 border-gray-400 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
                            maxLength={20}
                        />
                    </div>

                    {/* Max players */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            {t('createGame.maxPlayers')}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[2, 3, 4, 5].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setMaxPlayers(num)}
                                    className={`py-3 rounded-lg font-bold border-3 transition-all ${maxPlayers === num
                                        ? 'bg-blue-500 text-white border-blue-700 shadow-[0_4px_0_#1e40af]'
                                        : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-50'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Game name (optional) */}
                    <div className="mb-8">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            {t('createGame.gameName')}
                        </label>
                        <input
                            type="text"
                            placeholder={t('createGame.gameNamePlaceholder')}
                            value={gameName}
                            onChange={(e) => setGameName(e.target.value)}
                            className="w-full px-4 py-3 border-3 border-gray-400 rounded-lg focus:border-blue-500 focus:outline-none"
                            maxLength={30}
                        />
                    </div>

                    {/* Create button */}
                    <button
                        onClick={handleCreateGame}
                        className="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 px-6 rounded-xl border-4 border-green-700 shadow-[0_6px_0_#15803d] hover:shadow-[0_8px_0_#15803d] hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#15803d] transition-all duration-150"
                    >
                        ✨ {t('createGame.create')}
                    </button>
                </div>
            </main>
        </div>
    );
}
