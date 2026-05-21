import "@/app/globals.css";
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import AvatarCreator from '@/components/AvatarCreator';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { encodeAvatar, DEFAULT_AVATAR } from '@/lib/avatar';

const FELT_BG = 'radial-gradient(ellipse at 60% 40%, #1a5e30 0%, #0d3d1f 55%, #071a0e 100%)';
const GLASS = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.13)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
} as const;

export default function JoinChannel() {
  const router = useRouter();
  const { channel } = router.query;
  const [username, setUsername] = useState('');
  const [emoji, setEmoji] = useState(() => encodeAvatar(DEFAULT_AVATAR));
  const { t } = useLanguage();

  const joinChannel = () => {
    if (!username.trim()) { alert(t('joinGame.usernameRequired')); return; }
    if (typeof channel !== 'string') return;
    localStorage.setItem(`sipa-player-${channel}`, JSON.stringify({ username: username.trim(), emoji, isCreator: false }));
    router.push(`/lobby?channel=${channel}`);
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
    <div className="min-h-screen" style={{ background: FELT_BG, position: 'relative' }}>
      {/* Texture */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.6' fill='rgba(255,255,255,0.025)'/%3E%3C/svg%3E\")" }} />

      <header className="px-6 py-4 flex justify-between items-center relative z-10">
        <button onClick={() => router.push('/')} className="font-semibold text-sm flex items-center gap-2 hover:opacity-70" style={{ color: 'rgba(255,255,255,0.6)' }}>
          ← {t('common.back')}
        </button>
        <LanguageSwitcher />
      </header>

      <main className="flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md animate-fadeUp">

          <div className="text-center mb-6">
            <h1 className="text-3xl font-black" style={{ color: '#fff', fontFamily: 'Georgia, serif', letterSpacing: '0.08em' }}>
              {t('joinGame.title')}
            </h1>
            <div className="mx-auto mt-2 rounded-full" style={{ width: 36, height: 2, background: 'rgba(255,255,255,0.25)' }} />
          </div>

          <div className="rounded-2xl p-6 space-y-5" style={GLASS}>

            {/* Code de salle */}
            <div className="rounded-xl py-4 text-center" style={{
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
            }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(245,158,11,0.8)' }}>
                {t('joinGame.roomCode')}
              </p>
              <p className="text-4xl font-black font-mono" style={{ color: '#fbbf24', letterSpacing: '0.2em' }}>
                {channel}
              </p>
            </div>

            {/* Avatar */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {t('joinGame.chooseAvatar')}
              </label>
              <AvatarCreator value={emoji} onChange={setEmoji} />
            </div>

            {/* Pseudo */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {t('joinGame.username')}
              </label>
              <input type="text" placeholder={t('joinGame.usernamePlaceholder')}
                value={username} onChange={(e) => setUsername(e.target.value)}
                style={inputStyle} maxLength={20}
                onKeyDown={(e) => e.key === 'Enter' && joinChannel()}
                onFocus={e => { e.currentTarget.style.borderColor = '#4ade80'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                autoFocus />
            </div>

            {/* Bouton rejoindre */}
            <button onClick={joinChannel}
              className="w-full py-4 rounded-xl font-black text-xl text-white transition-all duration-150"
              style={{ background: 'var(--green-primary)', border: '2px solid var(--green-dark)', boxShadow: '0 5px 0 var(--green-dark)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 7px 0 var(--green-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 5px 0 var(--green-dark)'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'translateY(1px)'; e.currentTarget.style.boxShadow = '0 2px 0 var(--green-dark)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 5px 0 var(--green-dark)'; }}
            >
              ♣ {t('joinGame.join')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
