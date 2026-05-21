'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const rules = {
  fr: {
    button: 'Règles',
    title: 'Règles SIPA',
    sections: [
      {
        title: 'But',
        items: [
          'Le premier joueur qui atteint le score cible gagne la partie.',
          'Une manche se joue avec 5 cartes par joueur.',
        ],
      },
      {
        title: 'Début de manche',
        items: [
          'Les annonces 7-8-9 sont ouvertes uniquement au début de la manche.',
          'Si un joueur possède 7, 8 et 9 de la même famille, il peut annoncer et marquer 2 points.',
        ],
      },
      {
        title: 'Cartes',
        items: [
          'Il faut fournir la famille demandée quand c’est possible.',
          'Une carte hors famille est jouée cachée.',
          'Sortir avec deux 7 permet de marquer 4 points.',
        ],
      },
    ],
  },
  en: {
    button: 'Rules',
    title: 'SIPA Rules',
    sections: [
      {
        title: 'Goal',
        items: [
          'The first player to reach the target score wins the game.',
          'Each round starts with 5 cards per player.',
        ],
      },
      {
        title: 'Round Start',
        items: [
          '7-8-9 announcements are available only at the start of the round.',
          'A player holding 7, 8 and 9 of the same suit may announce them and score 2 points.',
        ],
      },
      {
        title: 'Cards',
        items: [
          'You must follow the requested suit when possible.',
          'A card outside the requested suit is played hidden.',
          'Going out with two 7s scores 4 points.',
        ],
      },
    ],
  },
};

/**
 * Affiche un bouton et une modale de règles dans le style table de jeu.
 *
 * @param props.compact Réduit le libellé pour les zones étroites.
 */
export default function RulesButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { language } = useLanguage();
  const copy = rules[language];
  const modal = open && mounted ? (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 2147483000,
        background: 'rgba(3, 6, 20, 0.42)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.98)',
          border: '2px solid var(--cream-border)',
          boxShadow: '0 32px 90px rgba(0,0,0,0.55)',
          maxHeight: 'min(86vh, 680px)',
        }}
      >
        <div
          className="flex items-center justify-between gap-3 px-5 py-4"
          style={{ background: 'var(--green-primary)', borderBottom: '2px solid var(--green-dark)' }}
        >
          <h2 className="text-xl font-black text-white">{copy.title}</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-9 w-9 rounded-full font-black text-white"
            style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.24)' }}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-5 text-gray-900" style={{ maxHeight: 'calc(min(86vh, 680px) - 70px)' }}>
          {copy.sections.map((section) => (
            <section key={section.title}>
              <h3 className="mb-2 text-sm font-black uppercase tracking-widest" style={{ color: 'var(--green-dark)' }}>
                {section.title}
              </h3>
              <ul className="space-y-2 text-sm font-semibold leading-relaxed">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span style={{ color: 'var(--gold-dark)' }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full font-black transition-all hover:-translate-y-0.5 active:translate-y-0"
        style={{
          background: 'rgba(245,158,11,0.14)',
          border: '1px solid rgba(245,158,11,0.42)',
          color: '#fbbf24',
          boxShadow: '0 3px 0 rgba(120,53,15,0.85)',
          padding: compact ? '7px 10px' : '8px 14px',
          fontSize: compact ? 12 : 13,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {compact ? '?' : `? ${copy.button}`}
      </button>

      {modal ? createPortal(modal, document.body) : null}
    </>
  );
}
