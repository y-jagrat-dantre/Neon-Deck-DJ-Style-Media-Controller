import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { MediaItem } from "./media-library";

type Props = {
  current: MediaItem | null;
  isPlaying: boolean;
  blackout: boolean;
  videoLoop: boolean;
  showRuntime?: boolean;
  onEnded?: () => void;
};

export type PlayerHandle = {
  container: HTMLDivElement | null;
  seekBy: (seconds: number) => void;
  restart: () => void;
};

/**
 * Fullscreen-capable media player with crossfade between videos & images.
 */
export const Player = forwardRef<PlayerHandle, Props>(function Player(
  { current, isPlaying, blackout, videoLoop, showRuntime = false, onEnded },
  handleRef,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [layer, setLayer] = useState<"A" | "B">("A");
  const [aMedia, setAMedia] = useState<MediaItem | null>(null);
  const [bMedia, setBMedia] = useState<MediaItem | null>(null);
  const lastIdRef = useRef<string | null>(null);
  const [curTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const getActiveVideo = () => (layer === "A" ? videoARef.current : videoBRef.current);

  useImperativeHandle(handleRef, () => ({
    get container() { return containerRef.current; },
    seekBy(seconds: number) {
      const v = getActiveVideo();
      if (!v || !current || current.kind !== "video") return;
      const dur = isFinite(v.duration) ? v.duration : 0;
      const next = Math.max(0, Math.min(dur || v.currentTime + seconds, v.currentTime + seconds));
      v.currentTime = next;
    },
    restart() {
      const v = getActiveVideo();
      if (!v || !current || current.kind !== "video") return;
      try { v.currentTime = 0; } catch {}
    },
  }), [layer, current]);

  // Crossfade: when `current` changes, load it into the inactive layer then swap.
  useEffect(() => {
    if (!current) {
      setAMedia(null); setBMedia(null); lastIdRef.current = null; return;
    }
    if (current.id === lastIdRef.current) return;
    lastIdRef.current = current.id;
    if (layer === "A") { setBMedia(current); setLayer("B"); }
    else { setAMedia(current); setLayer("A"); }
  }, [current, layer]);

  // Reset video to start when a NEW media item loads.
  useEffect(() => {
    if (!current || current.kind !== "video") return;
    const active = layer === "A" ? videoARef.current : videoBRef.current;
    if (!active) return;
    try { active.currentTime = 0; } catch {}
  }, [current?.id, layer]);

  // Drive video playback for whichever layer is active.
  useEffect(() => {
    const active = layer === "A" ? videoARef.current : videoBRef.current;
    const inactive = layer === "A" ? videoBRef.current : videoARef.current;
    if (inactive) { try { inactive.pause(); } catch {} }
    if (!active || !current || current.kind !== "video") return;
    if (isPlaying) {
      active.play().catch(() => {});
    } else {
      active.pause();
    }
  }, [isPlaying, current, layer, aMedia, bMedia]);

  // Sync loop attribute on both video elements
  useEffect(() => {
    if (videoARef.current) videoARef.current.loop = videoLoop;
    if (videoBRef.current) videoBRef.current.loop = videoLoop;
  }, [videoLoop, aMedia, bMedia]);

  // Track playback time of active video for runtime display
  useEffect(() => {
    if (!showRuntime) return;
    let raf = 0;
    const tick = () => {
      const v = getActiveVideo();
      if (v && current?.kind === "video") {
        setCurTime(v.currentTime || 0);
        setDuration(isFinite(v.duration) ? v.duration : 0);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showRuntime, layer, current]);

  const fmt = (s: number) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const renderLayer = (media: MediaItem | null, ref: React.RefObject<HTMLVideoElement | null>, isActive: boolean) => (
    <div
      className="absolute inset-0 media-fade"
      style={{ opacity: blackout ? 0 : isActive && media ? 1 : 0 }}
    >
      {media?.kind === "video" && (
        <video
          ref={ref}
          src={media.src}
          className="w-full h-full object-contain bg-black"
          playsInline
          loop={videoLoop}
          onEnded={onEnded}
          preload="auto"
        />
      )}
      {media?.kind === "image" && (
        <img src={media.src} alt={media.name} className="w-full h-full object-contain bg-black" />
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden border border-[color:var(--panel-border)] bg-black"
      style={{ boxShadow: "var(--shadow-inset-deep), 0 0 40px oklch(0 0 0 / 60%)" }}
    >
      {renderLayer(aMedia, videoARef, layer === "A")}
      {renderLayer(bMedia, videoBRef, layer === "B")}

      {(blackout || !current) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <span className="neon-text-cyan font-mono text-sm tracking-[0.3em]">
            {blackout ? "● BLACKOUT" : "● STANDBY"}
          </span>
        </div>
      )}

      {showRuntime && current?.kind === "video" && !blackout && (
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-md bg-black/70 border border-[color:var(--panel-border)] backdrop-blur-sm pointer-events-none">
          <span className="neon-text-cyan font-mono text-sm tracking-widest tabular-nums">
            {fmt(curTime)} / {fmt(duration)}
          </span>
        </div>
      )}
    </div>
  );
});
