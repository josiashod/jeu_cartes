'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const rules = {
  fr: {
    button: 'Regles',
    title: 'Regles SIPA',
    sections: [
      {
        title: 'But',
        items: [
          'Le premier joueur qui atteint le score cible gagne la partie.',
          'Une manche se joue avec 5 cartes par joueur.',
        ],
      },
      {
        title: 'Debut de manche',
        items: [
          'Les annonces 7-8-9 sont ouvertes uniquement au debut de la manche.',
          'Si un joueur possede 7, 8 et 9 de la meme famille, il peut annoncer et marquer 2 points.',
        ],
      },
      {
        title: 'Cartes',
        items: [
          "Il faut fournir la famille demandee quand c'est possible.",
          'Une carte hors famille est jouee cachee.',
          'Sortir avec deux 7 permet de marquer 4 points.',
        ],
      },
      {
        title: 'Mode FROP',
        items: [
          "Avant de jouer sa premiere carte, un joueur peut declarer le FROP.",
          "En FROP, toutes ses cartes sont visibles par les adversaires.",
          "S'il remporte la manche, il marque 4 points.",
          "S'il perd, c'est le gagnant du dernier pli qui marque 4 points.",
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
      {
        title: 'FROP Mode',
        items: [
          'Before playing their first card, a player may declare FROP.',
          'In FROP, all their cards are visible to opponents.',
          'If they win the round, they score 4 points.',
          'If they lose, the winner of the last trick scores 4 points.',
        ],
      },
    ],
  },
};

export default function RulesButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { language } = useLanguage();
  const copy = rules[language];
  const modal = open && mounted ? (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 2147483000, background: 'rgba(0,0,0,0.78)' }}
      onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
    >
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#071a0e', border: '2px solid #1a5e30',
        boxShadow: '6px 6px 0 #000', borderRadius: 12, overflow: 'hidden',
        maxHeight: 'min(90vh, 680px)', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '14px 18px', background: '#0f2819', borderBottom: '2px solid #1a5e30',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: 'Georgia, serif' }}>{copy.title}</h2>
          <button type="button" onClick={() => setOpen(false)}
            style={{
              width: 32, height: 32, borderRadius: 6, border: '2px solid #1a5e30',
              background: '#071a0e', boxShadow: '2px 2px 0 #000',
              color: '#fff', fontWeight: 900, fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Fermer"
          >x</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {copy.sections.map((section) => (
            <section key={section.title}>
              <h3 style={{
                fontSize: 10, fontWeight: 900, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: '#4ade80', marginBottom: 8,
              }}>
                {section.title}
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {section.items.map((item) => (
                  <li key={item} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: '#f59e0b', fontWeight: 900, flexShrink: 0, marginTop: 1 }}>&#9658;</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.82)', lineHeight: 1.5 }}>{item}</span>
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
        style={{
          background: '#92400e',
          border: '2px solid #b45309',
          boxShadow: '2px 2px 0 #000',
          color: '#fff',
          padding: compact ? '6px 10px' : '7px 14px',
          fontSize: compact ? 11 : 12,
          fontWeight: 900,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        {compact ? '?' : `? ${copy.button}`}
      </button>

      {modal ? createPortal(modal, document.body) : null}
    </>
  );
}
