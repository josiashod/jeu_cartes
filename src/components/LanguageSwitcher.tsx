'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center gap-2 bg-white border-3 border-gray-800 rounded-lg p-1 shadow-[0_4px_0_#2c3e50]">
            <button
                onClick={() => setLanguage('fr')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${language === 'fr'
                        ? 'bg-blue-500 text-white border-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
            >
                🇫🇷 FR
            </button>
            <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${language === 'en'
                        ? 'bg-blue-500 text-white border-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
            >
                🇬🇧 EN
            </button>
        </div>
    );
}
