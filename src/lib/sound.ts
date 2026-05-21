'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SoundName = 'hover' | 'play-card' | 'win-trick' | 'win-game';

const STORAGE_KEY = 'sipa-sounds-enabled';

/**
 * Lit et persiste le réglage global des sons du jeu.
 *
 * @returns État courant des sons et fonction de mise à jour.
 */
export function useSoundSettings() {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== null) setEnabledState(saved === 'true');
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    window.localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  return { enabled, setEnabled };
}

/**
 * Génère les effets sonores courts du jeu avec Web Audio.
 *
 * @param enabled Coupe toute sortie audio quand le réglage est désactivé.
 * @returns Fonction permettant de jouer un son nommé.
 */
export function useSipaSound(enabled: boolean) {
  const audioRef = useRef<AudioContext | null>(null);
  const lastHoverRef = useRef(0);

  const getAudio = useCallback(() => {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!audioRef.current) audioRef.current = new AudioContextCtor();
    if (audioRef.current.state === 'suspended') void audioRef.current.resume();
    return audioRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, gain: number, type: OscillatorType, delay = 0) => {
    const audio = getAudio();
    if (!audio) return;

    const start = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(amp);
    amp.connect(audio.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }, [getAudio]);

  const play = useCallback((name: SoundName) => {
    if (!enabled || typeof window === 'undefined') return;

    if (name === 'hover') {
      const now = window.performance.now();
      if (now - lastHoverRef.current < 75) return;
      lastHoverRef.current = now;
      playTone(560, 0.055, 0.018, 'triangle');
      return;
    }

    if (name === 'play-card') {
      playTone(260, 0.055, 0.028, 'triangle');
      playTone(190, 0.07, 0.018, 'sine', 0.035);
      return;
    }

    if (name === 'win-trick') {
      playTone(392, 0.08, 0.026, 'triangle');
      playTone(523, 0.1, 0.026, 'triangle', 0.075);
      playTone(659, 0.13, 0.024, 'triangle', 0.16);
      return;
    }

    playTone(392, 0.1, 0.026, 'triangle');
    playTone(523, 0.12, 0.028, 'triangle', 0.1);
    playTone(659, 0.14, 0.03, 'triangle', 0.22);
    playTone(784, 0.2, 0.032, 'triangle', 0.36);
  }, [enabled, playTone]);

  return play;
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
