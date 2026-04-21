import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Player, type PlayerHandle } from "@/components/Player";
import { ControlPanel } from "@/components/ControlPanel";
import { AudioPanel } from "@/components/AudioPanel";
import { useAudioDeck } from "@/components/useAudioDeck";
import { AUDIO_TRACKS, IMAGES, VIDEOS, type MediaItem } from "@/components/media-library";

export const Route = createFileRoute("/")({
  component: DJController,
  head: () => ({
    meta: [
      { title: "Neon Deck — DJ-Style Media Controller" },
      { name: "description", content: "Stage-ready DJ-style media controller with fullscreen video/image playback, background music, crossfades, queue, and auto-trigger." },
    ],
  }),
});

function DJController() {
  const [mode, setMode] = useState<"video" | "image">("video");
  const [current, setCurrent] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [videoLoop, setVideoLoop] = useState(false);
  const [showRuntime, setShowRuntime] = useState(false);
  const [queue, setQueue] = useState<MediaItem[]>([]);
  const [autoSec, setAutoSec] = useState(8);
  const [autoOn, setAutoOn] = useState(false);
  const [autoAudioAfterVideo, setAutoAudioAfterVideo] = useState(true);
  const [autoAudioOnImage, setAutoAudioOnImage] = useState(false);
  const [autoImageAfterVideo, setAutoImageAfterVideo] = useState(false);
  const [autoImageSlot, setAutoImageSlot] = useState<number | "cycle">("cycle");
  const autoImageIdxRef = useRef(0);
  const [autoVideoAfterVideo, setAutoVideoAfterVideo] = useState(false);
  const [autoVideoSlot, setAutoVideoSlot] = useState<number | "cycle">("cycle");
  const autoVideoIdxRef = useRef(0);
  const playerRef = useRef<PlayerHandle>(null);

  const audio = useAudioDeck(AUDIO_TRACKS);

  // Preload all media for instant playback
  useEffect(() => {
    VIDEOS.forEach((v) => { const el = document.createElement("video"); el.src = v.src; el.preload = "auto"; });
    IMAGES.forEach((i) => { const el = new Image(); el.src = i.src; });
    AUDIO_TRACKS.forEach((a) => { const el = document.createElement("audio"); el.src = a.src; el.preload = "auto"; });
  }, []);

  const select = useCallback((m: MediaItem) => {
    setBlackout(false);
    setMode(m.kind);
    setCurrent(m);
    setIsPlaying(m.kind === "video");

    // Always hard-stop background audio when switching media
    audio.stop();

    // Auto-start audio when switching to image (if enabled)
    if (m.kind === "image" && autoAudioOnImage) {
      audio.play();
    }
  }, [autoAudioOnImage, audio]);

  const playNextFromQueue = useCallback(() => {
    setQueue((q) => {
      if (q.length === 0) { setIsPlaying(false); return q; }
      const [next, ...rest] = q;
      select(next);
      return rest;
    });
  }, [select]);

  // Triggered when a video finishes naturally
  const handleVideoEnded = useCallback(() => {
    if (autoAudioAfterVideo && !audio.state.isPlaying) {
      audio.play();
    }
    if (autoVideoAfterVideo) {
      let vid: MediaItem | undefined;
      if (autoVideoSlot === "cycle") {
        if (VIDEOS.length > 0) {
          // Try to advance to a different video than the current one
          let attempts = 0;
          do {
            vid = VIDEOS[autoVideoIdxRef.current % VIDEOS.length];
            autoVideoIdxRef.current += 1;
            attempts += 1;
          } while (vid && current && vid.id === current.id && attempts < VIDEOS.length);
        }
      } else {
        vid = VIDEOS.find((v) => v.slot === autoVideoSlot);
      }
      if (vid) {
        setBlackout(false);
        setMode("video");
        setCurrent(vid);
        setIsPlaying(true);
        return;
      }
    }
    if (autoImageAfterVideo) {
      let img: MediaItem | undefined;
      if (autoImageSlot === "cycle") {
        if (IMAGES.length > 0) {
          img = IMAGES[autoImageIdxRef.current % IMAGES.length];
          autoImageIdxRef.current += 1;
        }
      } else {
        img = IMAGES.find((i) => i.slot === autoImageSlot);
      }
      if (img) {
        // Switch to image without killing the audio we may have just started
        setBlackout(false);
        setMode("image");
        setCurrent(img);
        setIsPlaying(false);
        if (autoAudioOnImage && !audio.state.isPlaying) {
          audio.play();
        }
        return;
      }
    }
    playNextFromQueue();
  }, [autoAudioAfterVideo, audio, playNextFromQueue, autoImageAfterVideo, autoImageSlot, autoAudioOnImage, autoVideoAfterVideo, autoVideoSlot, current]);

  const playPause = useCallback(() => {
    if (!current || current.kind !== "video") return;
    setIsPlaying((p) => !p);
  }, [current]);

  const stop = useCallback(() => { setIsPlaying(false); setCurrent(null); }, []);

  const fullscreen = useCallback(() => {
    const el = playerRef.current?.container;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.().catch(() => {});
  }, []);

  const seekBy = useCallback((s: number) => playerRef.current?.seekBy(s), []);

  const selectSlot = useCallback((slot: number) => {
    const list = mode === "video" ? VIDEOS : IMAGES;
    const item = list.find((m) => m.slot === slot);
    if (item) select(item);
  }, [mode, select]);

  // Multi-digit slot buffer (for video/image slot selection)
  const digitBufferRef = useRef<string>("");
  const digitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushDigits = useCallback(() => {
    const buf = digitBufferRef.current;
    digitBufferRef.current = "";
    if (digitTimerRef.current) { clearTimeout(digitTimerRef.current); digitTimerRef.current = null; }
    if (buf.length === 0) return;
    const slot = parseInt(buf, 10);
    if (!isNaN(slot)) selectSlot(slot);
  }, [selectSlot]);

  const pushDigit = useCallback((d: string) => {
    digitBufferRef.current += d;
    if (digitTimerRef.current) clearTimeout(digitTimerRef.current);
    if (digitBufferRef.current.length >= 2) flushDigits();
    else digitTimerRef.current = setTimeout(flushDigits, 350);
  }, [flushDigits]);

  // A-key state: track if A is currently held (for A+Space combo & A+digit audio select)
  const aHeldRef = useRef(false);
  const aConsumedRef = useRef(false); // true if A was used in a combo (suppress release action)

  const selectAudioSlot = useCallback((slot: number) => {
    const t = AUDIO_TRACKS.find((a) => a.slot === slot);
    if (t) audio.selectTrack(t);
  }, [audio]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();

      // A held: capture digits for audio track select, Space for audio play/pause
      if (aHeldRef.current) {
        if (/^[0-9]$/.test(k)) {
          e.preventDefault();
          aConsumedRef.current = true;
          selectAudioSlot(parseInt(k, 10));
          return;
        }
        if (e.code === "Space") {
          e.preventDefault();
          aConsumedRef.current = true;
          audio.playPause();
          return;
        }
      }

      if (k === "a") {
        if (!e.repeat) { aHeldRef.current = true; aConsumedRef.current = false; }
        e.preventDefault();
        return;
      }

      if (k === "v") setMode("video");
      else if (k === "i") setMode("image");
      else if (/^[0-9]$/.test(k)) pushDigit(k);
      else if (e.code === "Space") { e.preventDefault(); playPause(); }
      else if (k === "f") fullscreen();
      else if (k === "g") { e.preventDefault(); setVideoLoop((l) => !l); }
      else if (k === "t") { e.preventDefault(); setShowRuntime((s) => !s); }
      else if (k === "b") setBlackout((b) => !b);
      else if (k === "m") audio.toggleMute();
      else if (k === "l") audio.toggleLoop();
      else if (k === "z") setAutoAudioAfterVideo((v) => !v);
      else if (k === "x") setAutoAudioOnImage((v) => !v);
      else if (k === "arrowright") { e.preventDefault(); seekBy(10); }
      else if (k === "arrowleft" || k === "j") { e.preventDefault(); seekBy(-10); }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "a") {
        aHeldRef.current = false;
        aConsumedRef.current = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [pushDigit, playPause, fullscreen, seekBy, audio, selectAudioSlot]);

  // Auto-trigger advancing through queue
  useEffect(() => {
    if (!autoOn) return;
    const t = setInterval(() => {
      setQueue((q) => {
        if (q.length === 0) return q;
        const [next, ...rest] = q;
        select(next);
        return rest;
      });
    }, autoSec * 1000);
    return () => clearInterval(t);
  }, [autoOn, autoSec, select]);

  return (
    <div className="min-h-screen w-full text-foreground p-4 md:p-8">
      {/* Hidden background audio element */}
      <audio ref={audio.audioRef} src={audio.state.current?.src} preload="auto" />

      <header className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg console-surface flex items-center justify-center">
            <span className="neon-text-cyan font-black">◆</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-widest neon-text-cyan">NEON DECK</h1>
            <p className="text-[0.7rem] font-mono opacity-60 tracking-widest">DJ-STYLE MEDIA CONTROLLER</p>
          </div>
        </div>
        <div className="font-mono text-[0.7rem] opacity-50 tracking-widest hidden md:block">v1.1 · STAGE READY</div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="lg:col-span-3 space-y-6">
          <Player
            ref={playerRef}
            current={current}
            isPlaying={isPlaying}
            blackout={blackout}
            videoLoop={videoLoop}
            showRuntime={showRuntime}
            onEnded={handleVideoEnded}
          />
          <p className="font-mono text-[0.7rem] opacity-50 tracking-widest text-center">
            [F] FULLSCREEN · [G] VIDEO LOOP · [T] RUNTIME · [A+1/2/3] AUDIO TRACK · [HOLD A + SPACE] AUDIO PLAY/PAUSE · [M] MUTE · [L] LOOP · [Z/X] AUTO AUDIO
          </p>
          <AudioPanel
            tracks={AUDIO_TRACKS}
            state={audio.state}
            autoAfterVideo={autoAudioAfterVideo}
            autoOnImage={autoAudioOnImage}
            autoImageAfterVideo={autoImageAfterVideo}
            autoImageSlot={autoImageSlot}
            autoVideoAfterVideo={autoVideoAfterVideo}
            autoVideoSlot={autoVideoSlot}
            images={IMAGES}
            videos={VIDEOS}
            onSelect={audio.selectTrack}
            onPlayPause={audio.playPause}
            onStop={audio.stop}
            onToggleMute={audio.toggleMute}
            onToggleLoop={audio.toggleLoop}
            onSetVolume={audio.setVolume}
            onToggleAutoAfterVideo={() => setAutoAudioAfterVideo((v) => !v)}
            onToggleAutoOnImage={() => setAutoAudioOnImage((v) => !v)}
            onToggleAutoImageAfterVideo={() => setAutoImageAfterVideo((v) => !v)}
            onChangeAutoImageSlot={setAutoImageSlot}
            onToggleAutoVideoAfterVideo={() => setAutoVideoAfterVideo((v) => !v)}
            onChangeAutoVideoSlot={setAutoVideoSlot}
          />
        </section>
        <section className="lg:col-span-2">
          <ControlPanel
            videos={VIDEOS}
            images={IMAGES}
            mode={mode}
            current={current}
            isPlaying={isPlaying}
            blackout={blackout}
            videoLoop={videoLoop}
            queue={queue}
            autoTriggerSec={autoSec}
            isAutoOn={autoOn}
            onSelect={select}
            onSetMode={setMode}
            onPlayPause={playPause}
            onStop={stop}
            onBlackout={() => setBlackout((b) => !b)}
            onToggleVideoLoop={() => setVideoLoop((l) => !l)}
            onFullscreen={fullscreen}
            onEnqueue={(m) => setQueue((q) => [...q, m])}
            onClearQueue={() => setQueue([])}
            onToggleAuto={() => setAutoOn((a) => !a)}
            onChangeAutoSec={setAutoSec}
            onSeek={seekBy}
          />
        </section>
      </main>
    </div>
  );
}
