/**
 * useTTS — HYRTE Simulation Voice Hook
 * Plays the AI character's voice for each new simulation event using Azure Neural TTS.
 * Personality-matched voices: each stakeholder sounds different.
 */

import { useCallback, useRef, useState } from 'react';
import type { SimulationEvent, StakeholderState, PersonalityType } from '../../lib/simulation/types';

interface TTSOptions {
  enabled: boolean;
  volume: number; // 0–1
}

export function useTTS(options: TTSOptions) {
  const { enabled, volume } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingEventId, setSpeakingEventId] = useState<string | null>(null);
  const queueRef = useRef<{ event: SimulationEvent; personality: PersonalityType | undefined }[]>([]);
  const isPlayingRef = useRef(false);

  const playNext = useCallback(async () => {
    if (isPlayingRef.current || queueRef.current.length === 0 || !enabled) return;
    const item = queueRef.current.shift();
    if (!item) return;

    isPlayingRef.current = true;
    setIsSpeaking(true);
    setSpeakingEventId(item.event.id);

    // Trim message to 250 chars for TTS (long messages get cut)
    const text = item.event.message.slice(0, 250);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          personality: item.personality,
          eventType: item.event.type,
        }),
      });

      if (!res.ok) throw new Error('TTS request failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audio.volume = volume;
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        isPlayingRef.current = false;
        setIsSpeaking(false);
        setSpeakingEventId(null);
        playNext();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        isPlayingRef.current = false;
        setIsSpeaking(false);
        setSpeakingEventId(null);
        playNext();
      };

      await audio.play();
    } catch {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      setSpeakingEventId(null);
      playNext();
    }
  }, [enabled, volume]);

  const speak = useCallback((event: SimulationEvent, stakeholder?: StakeholderState) => {
    if (!enabled) return;
    queueRef.current.push({
      event,
      personality: stakeholder?.personality as PersonalityType | undefined,
    });
    playNext();
  }, [enabled, playNext]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    queueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
    setSpeakingEventId(null);
  }, []);

  return { speak, stop, isSpeaking, speakingEventId };
}
