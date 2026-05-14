import { Language, Translations } from '@/types';

export const translations: Record<Language, Translations> = {
    en: {
        // Home page
        home: {
            title: 'SIPA',
            subtitle: 'Multiplayer Card Game',
            createGame: 'Create Game',
            joinGame: 'Join Game',
            enterRoomCode: 'Enter room code',
            join: 'Join',
            howToPlay: 'How to Play',
        },
        // Create game page
        createGame: {
            title: 'Create a Game',
            chooseAvatar: 'Choose your avatar',
            username: 'Username',
            usernamePlaceholder: 'Enter your username',
            maxPlayers: 'Max Players',
            gameName: 'Game Name (optional)',
            gameNamePlaceholder: 'Enter game name',
            create: 'Create Game',
            usernameRequired: 'Please enter a username',
        },
        // Join game page
        joinGame: {
            title: 'Join Game',
            roomCode: 'Room Code',
            chooseAvatar: 'Choose your avatar',
            username: 'Username',
            usernamePlaceholder: 'Enter your username',
            join: 'Join',
            usernameRequired: 'Please enter a username',
            joiningRoom: 'Joining room',
        },
        // Lobby page
        lobby: {
            title: 'Game Lobby',
            roomCode: 'Room Code',
            copyCode: 'Copy Code',
            shareLink: 'Share Link',
            players: 'Players',
            waitingForPlayers: 'Waiting for players...',
            startGame: 'Start Game',
            creator: 'Creator',
            codeCopied: 'Code copied!',
            linkCopied: 'Link copied!',
            minPlayersRequired: 'At least 2 players required',
        },
        // Common
        common: {
            cancel: 'Cancel',
            back: 'Back',
            next: 'Next',
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
        },
    },
    fr: {
        // Page d'accueil
        home: {
            title: 'SIPA',
            subtitle: 'Jeu de Cartes Multijoueur',
            createGame: 'Créer une Partie',
            joinGame: 'Rejoindre une Partie',
            enterRoomCode: 'Entrer le code de la partie',
            join: 'Rejoindre',
            howToPlay: 'Comment Jouer',
        },
        // Page de création
        createGame: {
            title: 'Créer une Partie',
            chooseAvatar: 'Choisissez votre avatar',
            username: 'Nom d\'utilisateur',
            usernamePlaceholder: 'Entrez votre nom',
            maxPlayers: 'Joueurs Maximum',
            gameName: 'Nom de la partie (optionnel)',
            gameNamePlaceholder: 'Entrez le nom de la partie',
            create: 'Créer la Partie',
            usernameRequired: 'Veuillez entrer un nom d\'utilisateur',
        },
        // Page de rejoindre
        joinGame: {
            title: 'Rejoindre une Partie',
            roomCode: 'Code de la Partie',
            chooseAvatar: 'Choisissez votre avatar',
            username: 'Nom d\'utilisateur',
            usernamePlaceholder: 'Entrez votre nom',
            join: 'Rejoindre',
            usernameRequired: 'Veuillez entrer un nom d\'utilisateur',
            joiningRoom: 'Connexion à la partie',
        },
        // Page lobby
        lobby: {
            title: 'Salon de Jeu',
            roomCode: 'Code de la Partie',
            copyCode: 'Copier le Code',
            shareLink: 'Partager le Lien',
            players: 'Joueurs',
            waitingForPlayers: 'En attente de joueurs...',
            startGame: 'Commencer la Partie',
            creator: 'Créateur',
            codeCopied: 'Code copié !',
            linkCopied: 'Lien copié !',
            minPlayersRequired: 'Au moins 2 joueurs requis',
        },
        // Commun
        common: {
            cancel: 'Annuler',
            back: 'Retour',
            next: 'Suivant',
            loading: 'Chargement...',
            error: 'Erreur',
            success: 'Succès',
        },
    },
};

// Helper function to get nested translation
export function getTranslation(
    lang: Language,
    key: string
): string {
    const keys = key.split('.');
    let value: any = translations[lang];

    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            return key; // Return key if translation not found
        }
    }

    return typeof value === 'string' ? value : key;
}
