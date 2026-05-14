import "@/app/globals.css";
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AdSpace from '@/components/AdSpace';
import { Player, GameSettings } from '@/types';

type StoredLobbyProfile = {
    username: string;
    emoji: string;
    isCreator?: boolean;
    maxPlayers?: number;
    gameName?: string;
};

/**
 * Lit le profil choisi avant d'arriver dans le lobby.
 *
 * @param roomCode Code de la partie.
 * @returns Profil local du joueur ou `null` si l'entrée est absente/invalide.
 */
function readStoredLobbyProfile(roomCode: string): StoredLobbyProfile | null {
    const rawProfile = localStorage.getItem(`sipa-player-${roomCode}`);

    if (!rawProfile) {
        return null;
    }

    try {
        const profile = JSON.parse(rawProfile) as Partial<StoredLobbyProfile>;

        if (!profile.username || !profile.emoji) {
            return null;
        }

        return {
            username: profile.username,
            emoji: profile.emoji,
            isCreator: Boolean(profile.isCreator),
            maxPlayers: profile.maxPlayers,
            gameName: profile.gameName,
        };
    } catch {
        return null;
    }
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
    const { t } = useLanguage();

    useEffect(() => {
        if (typeof channel !== 'string') return;

        const socket = getSocket();
        const profile = readStoredLobbyProfile(channel);

        if (!profile) {
            router.replace(`/join?channel=${channel}`);
            return;
        }

        setSocketId(socket.id);
        setIsCreatorFallback(profile.isCreator || creator === 'true');

        /**
         * Synchronise la socket courante avec le serveur.
         * La création/inscription se fait ici pour éviter de perdre le joueur
         * pendant la navigation entre la page create/join et le lobby.
         */
        const syncLobbyMembership = () => {
            if (profile.isCreator) {
                socket.emit('create_game', {
                    roomCode: channel,
                    username: profile.username,
                    emoji: profile.emoji,
                    maxPlayers: profile.maxPlayers ?? 4,
                    gameName: profile.gameName,
                });
                return;
            }

            socket.emit('join_channel', channel);
            socket.emit('register_user', {
                channel,
                username: profile.username,
                emoji: profile.emoji,
            });
        };

        syncLobbyMembership();

        const handleConnect = () => {
            setSocketId(socket.id);
            syncLobbyMembership();
        };

        socket.on('update_players', (playerList: Player[]) => {
            setPlayers(playerList);
        });

        socket.on('game_settings', (settings: GameSettings) => {
            setGameSettings(settings);
        });

        socket.on('game_started', () => {
            router.push(`/game?channel=${channel}`);
        });

        socket.on('game_error', (message: string) => {
            setError(message);
        });

        socket.on('connect', handleConnect);

        return () => {
            socket.off('update_players');
            socket.off('game_settings');
            socket.off('game_started');
            socket.off('game_error');
            socket.off('connect', handleConnect);
        };
    }, [channel, creator, router]);

    const copyRoomCode = () => {
        navigator.clipboard.writeText(channel as string);
        setCopyFeedback('code');
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    const shareLink = () => {
        const link = `${window.location.origin}/join?channel=${channel}`;
        navigator.clipboard.writeText(link);
        setCopyFeedback('link');
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    const startGame = () => {
        if (players.length < 2) {
            alert(t('lobby.minPlayersRequired'));
            return;
        }
        const socket = getSocket();
        if (typeof channel === 'string') {
            socket.emit('start_game', { roomCode: channel });
        }
    };

    const isCreator = Boolean(
        socketId && gameSettings?.creatorId === socketId
    ) || Boolean(
        socketId && players.some((player) => player.id === socketId && player.isCreator)
    ) || (isCreatorFallback && !gameSettings);
    const canStartGame = isCreator && players.length >= 2;

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
            {/* Header */}
            <header className="p-6 flex justify-between items-center bg-white border-b-4 border-gray-800">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                        SIPA
                    </h1>
                    <p className="text-sm text-gray-600 font-semibold">{t('lobby.title')}</p>
                </div>
                <LanguageSwitcher />
            </header>

            {/* Main content */}
            <main className="px-4 py-8">
                <div className="max-w-7xl mx-auto flex gap-6">
                    {/* Left sidebar - Players list (Skribbl style) */}
                    <div className="w-64 flex-shrink-0">
                        <div className="bg-white border-4 border-gray-800 rounded-xl shadow-[0_6px_0_#2c3e50] overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 border-b-4 border-gray-800">
                                <h2 className="text-lg font-black text-center">
                                    Round 1 of 3
                                </h2>
                            </div>

                            {/* Players list */}
                            <div className="divide-y-2 divide-gray-200">
                                {players.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <div className="text-4xl mb-2">⏳</div>
                                        <p className="text-sm font-bold">{t('lobby.waitingForPlayers')}</p>
                                    </div>
                                ) : (
                                    players.map((player, index) => (
                                        <div
                                            key={player.id}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                                        >
                                            {/* Position */}
                                            <div className="text-sm font-bold text-gray-500 w-6">
                                                #{index + 1}
                                            </div>

                                            {/* Avatar */}
                                            <div className="text-3xl flex-shrink-0">
                                                {player.emoji}
                                            </div>

                                            {/* Name and badge */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-800 truncate">
                                                    {player.username}
                                                </p>
                                                {player.isCreator && (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded">
                                                        ⭐ Host
                                                    </span>
                                                )}
                                            </div>

                                            {/* Score placeholder */}
                                            <div className="text-sm font-bold text-gray-600">
                                                0 pts
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Player count footer */}
                            {gameSettings && (
                                <div className="bg-purple-100 border-t-2 border-purple-300 p-3 text-center">
                                    <span className="text-sm font-bold text-purple-900">
                                        👥 {players.length} / {gameSettings.maxPlayers} {t('lobby.players')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main area */}
                    <div className="flex-1 space-y-6">
                        {/* Room info card */}
                        <div className="bg-white border-4 border-gray-800 rounded-xl p-6 shadow-[0_6px_0_#2c3e50]">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <p className="text-sm font-bold text-gray-600 mb-1">{t('lobby.roomCode')}</p>
                                    <p className="text-4xl font-black font-mono text-purple-600">{channel}</p>
                                    {gameSettings?.gameName && (
                                        <p className="text-lg font-bold text-gray-700 mt-2">{gameSettings.gameName}</p>
                                    )}
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={copyRoomCode}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 border-3 border-gray-400 rounded-lg font-bold transition-all flex items-center gap-2"
                                    >
                                        📋 {copyFeedback === 'code' ? t('lobby.codeCopied') : t('lobby.copyCode')}
                                    </button>
                                    <button
                                        onClick={shareLink}
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white border-3 border-blue-700 rounded-lg font-bold transition-all flex items-center gap-2 shadow-[0_3px_0_#1e40af]"
                                    >
                                        🔗 {copyFeedback === 'link' ? t('lobby.linkCopied') : t('lobby.shareLink')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Game area placeholder */}
                        <div className="bg-white border-4 border-gray-800 rounded-xl p-12 shadow-[0_6px_0_#2c3e50] text-center">
                            <div className="text-6xl mb-4">🎮</div>
                            <h3 className="text-2xl font-black text-gray-800 mb-2">
                                {t('lobby.waitingForPlayers')}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Le créateur est déjà joueur. Partage le lien, puis lance quand le nombre te convient.
                            </p>

                            {/* Start game button */}
                            {isCreator && (
                                <div className="space-y-3">
                                    <p className="text-sm font-bold text-purple-700">
                                        Tu es le créateur et tu comptes comme joueur #{players.findIndex((player) => player.id === socketId) + 1 || 1}.
                                    </p>
                                    <button
                                        onClick={startGame}
                                        disabled={!canStartGame}
                                        className={`text-xl font-bold py-5 px-12 rounded-xl border-4 transition-all duration-150 ${canStartGame
                                                ? 'bg-green-500 hover:bg-green-600 text-white border-green-700 shadow-[0_6px_0_#15803d] hover:shadow-[0_8px_0_#15803d] hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_#15803d]'
                                                : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {canStartGame
                                            ? `🎮 ${t('lobby.startGame')} (${players.length} ${t('lobby.players').toLowerCase()})`
                                            : `⏳ ${t('lobby.minPlayersRequired')}`}
                                    </button>
                                </div>
                            )}

                            {error && (
                                <p className="mt-6 rounded-lg border-3 border-red-700 bg-red-100 p-3 font-bold text-red-900">
                                    {error}
                                </p>
                            )}
                        </div>

                        {/* Ad space */}
                        <AdSpace variant="banner" />
                    </div>

                    {/* Right sidebar - Ads */}
                    <div className="w-64 flex-shrink-0 hidden xl:block">
                        <div className="sticky top-6 space-y-6">
                            <AdSpace variant="square" />
                            <AdSpace variant="square" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
