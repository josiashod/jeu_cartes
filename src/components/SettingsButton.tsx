'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface SettingsButtonProps {
  soundsEnabled: boolean;
  onSoundsEnabledChange: (enabled: boolean) => void;
}

/**
 * Affiche les paramètres rapides du jeu.
 *
 * @param props.soundsEnabled Indique si les effets sonores sont actifs.
 * @param props.onSoundsEnabledChange Met à jour le réglage des effets sonores.
 */
export default function SettingsButton({ soundsEnabled, onSoundsEnabledChange }: SettingsButtonProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modal = open && mounted ? (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 2147482999,
        background: 'rgba(3, 6, 20, 0.42)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.98)',
          border: '2px solid var(--cream-border)',
          boxShadow: '0 32px 90px rgba(0,0,0,0.55)',
        }}
      >
        <div
          className="flex items-center justify-between gap-3 px-5 py-4"
          style={{ background: 'var(--green-primary)', borderBottom: '2px solid var(--green-dark)' }}
        >
          <h2 className="text-xl font-black text-white">Paramètres</h2>
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

        <div className="px-5 py-5">
          <button
            type="button"
            onClick={() => onSoundsEnabledChange(!soundsEnabled)}
            className="flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left transition-all"
            style={{
              background: soundsEnabled ? 'rgba(24,163,84,0.1)' : 'rgba(17,24,39,0.06)',
              border: soundsEnabled ? '2px solid rgba(24,163,84,0.35)' : '2px solid rgba(17,24,39,0.08)',
            }}
          >
            <span>
              <span className="block text-sm font-black uppercase tracking-widest" style={{ color: 'var(--green-dark)' }}>
                Sons du jeu
              </span>
              <span className="mt-1 block text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                Cartes, survols et victoires
              </span>
            </span>
            <span
              aria-hidden="true"
              style={{
                width: 52,
                height: 30,
                borderRadius: 999,
                padding: 3,
                background: soundsEnabled ? 'var(--green-primary)' : 'rgba(17,24,39,0.22)',
                transition: 'background 160ms ease',
              }}
            >
              <span
                style={{
                  display: 'block',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#fff',
                  transform: soundsEnabled ? 'translateX(22px)' : 'translateX(0)',
                  transition: 'transform 160ms ease',
                }}
              />
            </span>
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full font-black transition-all hover:-translate-y-0.5 active:translate-y-0"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          color: '#fff',
          boxShadow: '0 3px 0 rgba(0,0,0,0.45)',
          padding: '7px 10px',
          fontSize: 12,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
        aria-label="Paramètres"
      >
        ⚙
      </button>

      {modal ? createPortal(modal, document.body) : null}
    </>
  );
}
