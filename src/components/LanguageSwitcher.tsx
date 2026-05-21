'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <div
            className="flex items-center gap-1 rounded-full p-1"
            style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.16)',
                boxShadow: '0 4px 18px rgba(0,0,0,0.28)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
            }}
        >
            <button
                onClick={() => setLanguage('fr')}
                className="rounded-full px-3 py-2 text-xs font-black transition-all"
                style={language === 'fr'
                    ? { background: 'var(--green-primary)', color: '#fff', boxShadow: '0 2px 0 var(--green-dark)' }
                    : { color: 'rgba(255,255,255,0.62)' }}
            >
                FR
            </button>
            <button
                onClick={() => setLanguage('en')}
                className="rounded-full px-3 py-2 text-xs font-black transition-all"
                style={language === 'en'
                    ? { background: 'var(--green-primary)', color: '#fff', boxShadow: '0 2px 0 var(--green-dark)' }
                    : { color: 'rgba(255,255,255,0.62)' }}
            >
                EN
            </button>
        </div>
    );
}
