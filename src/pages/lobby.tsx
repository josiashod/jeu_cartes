import "@/app/globals.css";
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { AvatarDisplay } from '@/components/AvatarDisplay';
import { Player, GameSettings } from '@/types';

const FELT_BG = 'radial-gradient(ellipse at 60% 40%, #1a5e30 0%, #0d3d1f 55%, #071a0e 100%)';
const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
};

type StoredLobbyProfile = {
  username: string; emoji: string;
  isCreator?: boolean; maxPlayers?: number; gameName?: string;
};

function readStoredLobbyProfile(roomCode: string): StoredLobbyProfile | null {
  const raw = localStorage.getItem(`sipa-player-${roomCode}`);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<StoredLobbyProfile>;
    if (!p.username || !p.emoji) return null;
    return { username: p.username, emoji: p.emoji, isCreator: Boolean(p.isCreator), maxPlayers: p.maxPlayers, gameName: p.gameName };
  } catch { return null; }
}

export default function Lobby() {
  const router = useRouter();
  const { channel, creator } = router.query;
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [socketId, setSocketId] = useState<string | undefined>();
  const [isCreatorFallback, setIsCreatorFallback] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<'code' | 'link' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editMaxPlayers, setEditMaxPlayers] = useState<number | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (typeof channel !== 'string') return;
    const socket = getSocket();
    const profile = readStoredLobbyProfile(channel);
    if (!profile) { router.replace(`/join?channel=${channel}`); return; }

    setIsCreatorFallback(profile.isCreator || creator === 'true');
    if (profile.isCreator) {
      const currentId = socket.id ?? 'local-creator';
      setSocketId(currentId);
      setPlayers([{ id: currentId, username: profile.username, emoji: profile.emoji, isCreator: true }]);
    } else { setSocketId(socket.id); }

    const syncLobbyMembership = () => {
      if (profile.isCreator) {
        socket.emit('create_game', { roomCode: channel, username: profile.username, emoji: profile.emoji, maxPlayers: profile.maxPlayers ?? 4, gameName: profile.gameName });
        return;
      }
      socket.emit('join_channel', channel);
      socket.emit('register_user', { channel, username: profile.username, emoji: profile.emoji });
    };

    socket.on('update_players', (list: Player[]) => setPlayers(list));
    socket.on('game_settings', (s: GameSettings) => setGameSettings(s));
    socket.on('game_started', () => router.push(`/game?channel=${channel}`));
    socket.on('game_error', (m: string) => setError(m));
    socket.on('room_closed', () => router.push('/'));

    const handleConnect = () => {
      setSocketId(socket.id);
      if (profile.isCreator) setPlayers(prev => prev.map(p => p.id === 'local-creator' ? { ...p, id: socket.id ?? p.id } : p));
      syncLobbyMembership();
    };
    socket.on('connect', handleConnect);
    syncLobbyMembership();

    return () => {
      socket.off('update_players'); socket.off('game_settings');
      socket.off('game_started'); socket.off('game_error');
      socket.off('room_closed'); socket.off('connect', handleConnect);
    };
  }, [channel, creator, router]);

  const copyRoomCode = () => { navigator.clipboard.writeText(channel as string); setCopyFeedback('code'); setTimeout(() => setCopyFeedback(null), 2000); };
  const shareLink = () => { navigator.clipboard.writeText(`${window.location.origin}/join?channel=${channel}`); setCopyFeedback('link'); setTimeout(() => setCopyFeedback(null), 2000); };
  const startGame = () => {
    if (players.length < 2) { alert(t('lobby.minPlayersRequired')); return; }
    if (typeof channel === 'string') getSocket().emit('start_game', { roomCode: channel });
  };
  const closeRoom = () => {
    if (!confirm("Fermer la salle et retourner à l'accueil ?")) return;
    if (typeof channel === 'string') getSocket().emit('close_room', { roomCode: channel });
    router.push('/');
  };
  const applyMaxPlayers = (n: number) => {
    if (typeof channel !== 'string') return;
    setEditMaxPlayers(null);
    const profile = readStoredLobbyProfile(channel);
    if (!profile) return;
    getSocket().emit('create_game', { roomCode: channel, username: profile.username, emoji: profile.emoji, maxPlayers: n });
  };

  const isCreator = Boolean(socketId && gameSettings?.creatorId === socketId)
    || Boolean(socketId && players.some(p => p.id === socketId && p.isCreator))
    || (isCreatorFallback && !gameSettings);
  const canStartGame = isCreator && players.length >= 2;
  const myPosition = players.findIndex(p => p.id === socketId);

  return (
    <div className="min-h-screen" style={{ background: FELT_BG, position: 'relative' }}>
      {/* Texture */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.6' fill='rgba(255,255,255,0.025)'/%3E%3C/svg%3E\")" }} />

      <header className="px-6 py-4 flex justify-between items-center relative z-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="font-semibold text-sm hover:opacity-70" style={{ color: 'rgba(255,255,255,0.5)' }}>←</button>
          <h1 className="text-xl font-black" style={{ color: '#fff', fontFamily: 'Georgia, serif', letterSpacing: '0.12em' }}>SIPA</h1>
          <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}>
            Salon
          </span>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="px-4 py-6 relative z-10">
        <div className="max-w-5xl mx-auto flex gap-5 flex-wrap md:flex-nowrap">

          {/* ── Liste joueurs ─────────────────────────────────────────────── */}
          <div className="w-full md:w-52 flex-shrink-0">
            <div className="rounded-2xl overflow-hidden" style={GLASS}>
              <div className="px-4 py-3 text-center" style={{ background: 'var(--green-primary)', borderBottom: '1px solid var(--green-dark)' }}>
                <p className="text-xs font-bold uppercase tracking-widest text-white opacity-70">Joueurs</p>
                <p className="text-3xl font-black text-white mt-0.5">
                  {players.length}
                  <span className="text-base font-normal opacity-50 ml-1">/ {gameSettings?.maxPlayers ?? '?'}</span>
                </p>
              </div>
              <div>
                {players.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-3xl mb-2 opacity-30">⏳</div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>En attente…</p>
                  </div>
                ) : players.map((player, index) => {
                  const isMe = player.id === socketId || (player.id === 'local-creator' && isCreator);
                  return (
                    <div key={player.id} className="flex items-center gap-3 px-4 py-3 animate-fadeIn"
                      style={{ background: isMe ? 'rgba(74,222,128,0.08)' : 'transparent', borderTop: index > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', animationDelay: `${index * 0.06}s` }}>
                      <span className="text-xs font-bold w-4 text-right" style={{ color: 'rgba(255,255,255,0.3)' }}>{index + 1}</span>
                      <AvatarDisplay emoji={player.emoji} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate" style={{ color: isMe ? '#4ade80' : '#fff' }}>
                          {player.username}{isMe && <span className="ml-1 text-xs opacity-40">(toi)</span>}
                        </p>
                        {player.isCreator && <p className="text-xs font-bold" style={{ color: '#fbbf24' }}>★ Hôte</p>}
                      </div>
                      <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e', flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Contenu principal ─────────────────────────────────────────── */}
          <div className="flex-1 space-y-4 min-w-0">

            {/* Code de salle */}
            <div className="rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4" style={GLASS}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Code de la salle</p>
                <p className="text-5xl font-black font-mono" style={{ color: '#4ade80', letterSpacing: '0.2em' }}>{channel}</p>
                {gameSettings?.gameName && <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{gameSettings.gameName}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={copyRoomCode} className="px-4 py-2 rounded-xl font-bold text-sm transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
                  {copyFeedback === 'code' ? '✓ Copié !' : '📋 Copier'}
                </button>
                <button onClick={shareLink} className="px-4 py-2 rounded-xl font-bold text-sm transition-all hover:opacity-80"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
                  {copyFeedback === 'link' ? '✓ Copié !' : '🔗 Partager'}
                </button>
              </div>
            </div>

            {/* Zone principale */}
            <div className="rounded-2xl p-8 text-center" style={GLASS}>
              {/* Mini table */}
              <div className="w-44 h-28 rounded-full mx-auto mb-6 flex items-center justify-center relative" style={{
                background: 'radial-gradient(ellipse at center, #1e7a45 0%, #0d4228 100%)',
                border: '3px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}>
                <span className="font-black tracking-widest text-xs" style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '0.3em' }}>SIPA</span>
                {players.slice(0, 4).map((player, i) => {
                  const pos = ['top-1 left-1/2 -translate-x-1/2', 'bottom-1 left-1/2 -translate-x-1/2', 'left-1 top-1/2 -translate-y-1/2', 'right-1 top-1/2 -translate-y-1/2'][i];
                  return (
                    <div key={player.id} className={`absolute ${pos}`}>
                      <AvatarDisplay emoji={player.emoji} size={28} />
                    </div>
                  );
                })}
              </div>

              {isCreator ? (
                <div className="space-y-3">
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Tu es l'hôte{myPosition >= 0 ? ` · joueur #${myPosition + 1}` : ''}. Attends d'autres joueurs ou lance la partie.
                  </p>

                  {/* Modifier max joueurs */}
                  {editMaxPlayers !== null ? (
                    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Nombre de joueurs max</p>
                      <div className="flex gap-2 mb-2">
                        {[2, 3, 4, 5].map(n => (
                          <button key={n} onClick={() => setEditMaxPlayers(n)}
                            className="flex-1 py-2 rounded-lg font-black text-lg border-2 transition-all"
                            style={editMaxPlayers === n ? {
                              background: 'var(--green-primary)', color: '#fff', borderColor: 'var(--green-dark)',
                            } : {
                              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.12)',
                            }}>
                            {n}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditMaxPlayers(null)} className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-70"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                          Annuler
                        </button>
                        <button onClick={() => applyMaxPlayers(editMaxPlayers)} className="flex-1 py-2 rounded-lg text-sm font-bold text-white"
                          style={{ background: 'var(--green-primary)', border: '2px solid var(--green-dark)' }}>
                          Appliquer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditMaxPlayers(gameSettings?.maxPlayers ?? 4)}
                        className="flex-1 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
                        ⚙ Modifier ({gameSettings?.maxPlayers ?? '?'} max)
                      </button>
                      <button onClick={closeRoom} className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                        style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.35)', color: '#fca5a5' }}>
                        ✕ Fermer
                      </button>
                    </div>
                  )}

                  <button onClick={startGame} disabled={!canStartGame}
                    className="w-full py-4 rounded-xl font-black text-xl text-white transition-all duration-150"
                    style={canStartGame ? {
                      background: 'var(--green-primary)', border: '2px solid var(--green-dark)', boxShadow: '0 5px 0 var(--green-dark)',
                    } : {
                      background: 'rgba(255,255,255,0.08)', border: '2px solid transparent', cursor: 'not-allowed', color: 'rgba(255,255,255,0.3)',
                    }}
                    onMouseEnter={e => { if (canStartGame) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 7px 0 var(--green-dark)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = canStartGame ? '0 5px 0 var(--green-dark)' : 'none'; }}
                    onMouseDown={e => { if (canStartGame) { e.currentTarget.style.transform = 'translateY(1px)'; e.currentTarget.style.boxShadow = '0 2px 0 var(--green-dark)'; } }}
                    onMouseUp={e => { if (canStartGame) { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 5px 0 var(--green-dark)'; } }}
                  >
                    {canStartGame ? `▶ ${t('lobby.startGame')} (${players.length} joueurs)` : `⏳ ${t('lobby.minPlayersRequired')}`}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-3 opacity-30">⏳</div>
                  <p className="font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>En attente que l'hôte lance la partie…</p>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl p-3 font-bold text-sm" style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.35)', color: '#fca5a5' }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
