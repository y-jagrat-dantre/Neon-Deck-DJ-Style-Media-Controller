import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioTrack } from "./media-library";

export type AudioState = {
  current: AudioTrack | null;
  isPlaying: boolean;
  isMuted: boolean;
  isLoop: boolean;
  volume: number;
};

export type AudioControls = {
  state: AudioState;
  selectTrack: (t: AudioTrack) => void;
  playPause: () => void;
  play: () => void;
  pause: () => void;
  toggleMute: () => void;
  toggleLoop: () => void;
  setVolume: (v: number) => void;
  stop: () => void;
};

/**
 * Headless audio deck — manages a single <audio> element with play/pause,
 * loop, mute, and volume. The element is mounted by the consumer.
 */
export function useAudioDeck(tracks: AudioTrack[]): AudioControls & { audioRef: React.RefObject<HTMLAudioElement | null> } {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<AudioTrack | null>(tracks[0] ?? null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoop, setIsLoop] = useState(true);
  const [volume, setVolumeState] = useState(0.8);

  // Sync audio element props
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = isMuted;
    el.loop = isLoop;
    el.volume = volume;
  }, [isMuted, isLoop, volume]);

  // Track event listeners
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { if (!el.loop) setIsPlaying(false); };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, []);

  const selectTrack = useCallback((t: AudioTrack) => {
    const el = audioRef.current;
    if (el) {
      // Stop any currently playing track (including looping audio) before switching
      el.pause();
      try { el.currentTime = 0; } catch {}
      el.src = t.src;
      el.load();
      el.play().catch(() => {});
    }
    setCurrent(t);
  }, []);

  const play = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (!el.src && current) { el.src = current.src; el.load(); }
    el.play().catch(() => {});
  }, [current]);

  const pause = useCallback(() => { audioRef.current?.pause(); }, []);
  const playPause = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) play(); else el.pause();
  }, [play]);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);
  const toggleLoop = useCallback(() => setIsLoop((l) => !l), []);
  const setVolume = useCallback((v: number) => setVolumeState(Math.max(0, Math.min(1, v))), []);
  const stop = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    try { el.currentTime = 0; } catch {}
  }, []);

  return {
    audioRef,
    state: { current, isPlaying, isMuted, isLoop, volume },
    selectTrack, playPause, play, pause, toggleMute, toggleLoop, setVolume, stop,
  };
}
