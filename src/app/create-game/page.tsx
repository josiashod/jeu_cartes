'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import AvatarCreator from '@/components/AvatarCreator';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import RulesButton from '@/components/RulesButton';
import CardPosterBackground from '@/components/CardPosterBackground';
import { encodeAvatar, DEFAULT_AVATAR } from '@/lib/avatar';

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.13)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
};

export default function CreateGame() {
  const [username, setUsername] = useState('');
  const [emoji, setEmoji] = useState(() => encodeAvatar(DEFAULT_AVATAR));
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [gameName, setGameName] = useState('');
  const router = useRouter();
  const { t } = useLanguage();

  const handleCreateGame = () => {
    if (!username.trim()) { alert(t('createGame.usernameRequired')); return; }
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem(`sipa-player-${roomCode}`, JSON.stringify({
      username: username.trim(), emoji, isCreator: true, maxPlayers,
      gameName: gameName.trim() || undefined,
    }));
    router.push(`/lobby?channel=${roomCode}&creator=true`);
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.28)',
    border: '1.5px solid rgba(255,255,255,0.15)',
    color: '#fff',
    borderRadius: 10,
    padding: '10px 14px',
    width: '100%',
    outline: 'none',
    fontWeight: 600,
    fontSize: 15,
    transition: 'border-color 0.15s',
  };

  return (
    <div className="min-h-screen" style={{ background: '#020617', position: 'relative', overflow: 'hidden' }}>
      <CardPosterBackground />

      <header className="px-6 py-4 flex justify-between items-center relative z-10">
        <button onClick={() => router.push('/')} className="font-semibold text-sm flex items-center gap-2 transition-all hover:opacity-70" style={{ color: 'rgba(255,255,255,0.6)' }}>
          ← {t('common.back')}
        </button>
        <div className="flex items-center gap-3">
          <RulesButton />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md animate-fadeUp">

          <div className="text-center mb-6">
            <h1 className="text-3xl font-black" style={{ color: '#fff', fontFamily: 'Georgia, serif', letterSpacing: '0.08em' }}>
              {t('createGame.title')}
            </h1>
            <div className="mx-auto mt-2 rounded-full" style={{ width: 36, height: 2, background: 'rgba(255,255,255,0.25)' }} />
          </div>

          <div className="rounded-2xl p-6 space-y-5" style={GLASS}>

            {/* Avatar */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {t('createGame.chooseAvatar')}
              </label>
              <AvatarCreator value={emoji} onChange={setEmoji} />
            </div>

            {/* Pseudo */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {t('createGame.username')}
              </label>
              <input type="text" placeholder={t('createGame.usernamePlaceholder')}
                value={username} onChange={(e) => setUsername(e.target.value)}
                style={inputStyle} maxLength={20}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGame()}
                onFocus={e => { e.currentTarget.style.borderColor = '#4ade80'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }} />
            </div>

            {/* Max joueurs */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {t('createGame.maxPlayers')}
              </label>
              <div className="flex gap-2">
                {[2, 3, 4, 5].map((num) => (
                  <button key={num} onClick={() => setMaxPlayers(num)}
                    className="flex-1 py-3 rounded-xl font-black text-lg border-2 transition-all"
                    style={maxPlayers === num ? {
                      background: 'var(--green-primary)', color: '#fff',
                      borderColor: 'var(--green-dark)', boxShadow: '0 3px 0 var(--green-dark)',
                    } : {
                      background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)',
                      borderColor: 'rgba(255,255,255,0.12)',
                    }}>
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Nom de partie */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {t('createGame.gameName')} <span className="normal-case font-normal" style={{ color: 'rgba(255,255,255,0.25)' }}>(optionnel)</span>
              </label>
              <input type="text" placeholder={t('createGame.gameNamePlaceholder')}
                value={gameName} onChange={(e) => setGameName(e.target.value)}
                style={inputStyle} maxLength={30}
                onFocus={e => { e.currentTarget.style.borderColor = '#4ade80'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }} />
            </div>

            {/* Bouton créer */}
            <button onClick={handleCreateGame}
              className="w-full py-4 rounded-xl font-black text-xl text-white transition-all duration-150"
              style={{ background: 'var(--green-primary)', border: '2px solid var(--green-dark)', boxShadow: '0 5px 0 var(--green-dark)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 7px 0 var(--green-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 5px 0 var(--green-dark)'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'translateY(1px)'; e.currentTarget.style.boxShadow = '0 2px 0 var(--green-dark)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 5px 0 var(--green-dark)'; }}
            >
              ♠ {t('createGame.create')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
