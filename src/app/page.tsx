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

  const handleJoinGame = () => {
    if (roomCode.trim()) router.push(`/join?channel=${roomCode.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'radial-gradient(ellipse at 60% 40%, #1a5e30 0%, #0d3d1f 55%, #071a0e 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Felt texture overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'0.6\' fill=\'rgba(255,255,255,0.025)\'/%3E%3C/svg%3E")',
        opacity: 0.8,
      }} />

      <header className="px-6 py-4 flex justify-end relative z-10">
        <LanguageSwitcher />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-16 relative z-10">

        {/* Logo */}
        <div className="text-center mb-10 animate-fadeUp">
          <div className="flex justify-center gap-5 mb-5 text-2xl select-none"
            style={{ color: 'rgba(255,255,255,0.18)' }} aria-hidden>
            <span>♠</span><span>♥</span><span>♦</span><span>♣</span>
          </div>
          <h1 className="font-black select-none"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.18em', fontSize: 'clamp(60px,14vw,108px)', lineHeight: 1, color: '#fff', textShadow: '0 4px 32px rgba(0,0,0,0.5)' }}>
            S
            <span style={{ position: 'relative', display: 'inline-block' }}>
              I
              <span style={{
                position: 'absolute', top: '-0.28em', left: '50%', transform: 'translateX(-50%)',
                fontSize: '0.30em', lineHeight: 1, color: '#f59e0b', fontFamily: 'serif',
                textShadow: '0 0 12px rgba(245,158,11,0.7)',
              }}>♦</span>
            </span>
            P<span style={{ color: '#4ade80' }}>♣</span>
          </h1>
          <div className="mx-auto mt-4 rounded-full"
            style={{ width: 52, height: 2, background: 'rgba(255,255,255,0.2)' }} />
          <p className="mt-4 text-base" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>
            {t('home.subtitle')}
          </p>
        </div>

        {/* Actions */}
        <div className="w-full max-w-xs space-y-3 animate-fadeUp" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={() => router.push('/create-game')}
            className="w-full py-4 rounded-2xl font-black text-lg text-white transition-all duration-150"
            style={{
              background: 'var(--green-primary)',
              border: '2px solid var(--green-dark)',
              boxShadow: '0 5px 0 var(--green-dark)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 7px 0 var(--green-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 5px 0 var(--green-dark)'; }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = '0 2px 0 var(--green-dark)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 5px 0 var(--green-dark)'; }}
          >
            ♠ {t('home.createGame')}
          </button>

          {!showJoinInput ? (
            <button
              onClick={() => setShowJoinInput(true)}
              className="w-full py-4 rounded-2xl font-black text-lg transition-all duration-150"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            >
              ♣ {t('home.joinGame')}
            </button>
          ) : (
            <div className="rounded-2xl p-4 animate-slideDown" style={{
              background: 'rgba(255,255,255,0.09)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.16)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            }}>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {t('home.enterRoomCode')}
              </label>
              <input
                type="text"
                placeholder="ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full py-3 px-4 rounded-xl text-center text-2xl font-black font-mono uppercase mb-3 outline-none border-2 transition-all"
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: '#4ade80',
                  caretColor: '#4ade80',
                  letterSpacing: '0.15em',
                }}
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
                onFocus={e => { e.currentTarget.style.borderColor = '#4ade80'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => setShowJoinInput(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-70"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
                  {t('common.cancel')}
                </button>
                <button onClick={handleJoinGame} disabled={!roomCode.trim()}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white border-2 transition-all"
                  style={{
                    background: roomCode.trim() ? 'var(--green-primary)' : 'rgba(255,255,255,0.06)',
                    borderColor: roomCode.trim() ? 'var(--green-dark)' : 'transparent',
                    boxShadow: roomCode.trim() ? '0 3px 0 var(--green-dark)' : 'none',
                    cursor: roomCode.trim() ? 'pointer' : 'not-allowed',
                    color: roomCode.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
                  }}>
                  {t('home.join')} →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* How to play */}
        <div className="mt-8 w-full max-w-xs rounded-2xl p-5 animate-fadeUp"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            animationDelay: '0.2s',
          }}>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <span style={{ color: '#f87171' }}>♥</span> {t('home.howToPlay')}
          </h3>
          <ul className="text-sm space-y-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <li>♠ Crée une partie et partage le code</li>
            <li>♣ Rejoins avec un code de salle</li>
            <li>♥ Premier à {12} points remporte</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
