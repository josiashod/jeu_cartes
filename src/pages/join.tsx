import "@/app/globals.css";
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import EmojiPicker from '@/components/EmojiPicker';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function JoinChannel() {
  const router = useRouter();
  const { channel } = router.query;
  const [username, setUsername] = useState('');
  const [emoji, setEmoji] = useState('😀');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { t } = useLanguage();

  const joinChannel = () => {
    if (!username.trim()) {
      alert(t('joinGame.usernameRequired'));
      return;
    }

    if (typeof channel !== 'string') {
      return;
    }

    localStorage.setItem(
      `sipa-player-${channel}`,
      JSON.stringify({ username: username.trim(), emoji, isCreator: false }),
    );

    router.push(`/lobby?channel=${channel}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
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
          <h1 className="text-3xl font-black text-gray-800 mb-2 text-center">
            {t('joinGame.title')}
          </h1>

          {/* Room code display */}
          <div className="mb-6 text-center bg-yellow-100 border-3 border-yellow-600 rounded-lg p-4">
            <p className="text-sm font-bold text-yellow-900 mb-1">{t('joinGame.roomCode')}</p>
            <p className="text-4xl font-black font-mono text-yellow-900">{channel}</p>
          </div>

          {/* Avatar selection */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('joinGame.chooseAvatar')}
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
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('joinGame.username')}
            </label>
            <input
              type="text"
              placeholder={t('joinGame.usernamePlaceholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-3 border-gray-400 rounded-lg focus:border-green-500 focus:outline-none font-semibold"
              maxLength={20}
              onKeyPress={(e) => e.key === 'Enter' && joinChannel()}
            />
          </div>

          {/* Join button */}
          <button
            onClick={joinChannel}
            className="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 px-6 rounded-xl border-4 border-green-700 shadow-[0_6px_0_#15803d] hover:shadow-[0_8px_0_#15803d] hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#15803d] transition-all duration-150"
          >
            🚪 {t('joinGame.join')}
          </button>
        </div>
      </main>
    </div>
  );
}
