import type { AudioTrack, MediaItem } from "./media-library";
import type { AudioState } from "./useAudioDeck";

type Props = {
  tracks: AudioTrack[];
  state: AudioState;
  autoAfterVideo: boolean;
  autoOnImage: boolean;
  autoImageAfterVideo: boolean;
  autoImageSlot: number | "cycle";
  autoVideoAfterVideo: boolean;
  autoVideoSlot: number | "cycle";
  images: MediaItem[];
  videos: MediaItem[];
  onSelect: (t: AudioTrack) => void;
  onPlayPause: () => void;
  onStop: () => void;
  onToggleMute: () => void;
  onToggleLoop: () => void;
  onSetVolume: (v: number) => void;
  onToggleAutoAfterVideo: () => void;
  onToggleAutoOnImage: () => void;
  onToggleAutoImageAfterVideo: () => void;
  onChangeAutoImageSlot: (s: number | "cycle") => void;
  onToggleAutoVideoAfterVideo: () => void;
  onChangeAutoVideoSlot: (s: number | "cycle") => void;
};

export function AudioPanel(props: Props) {
  const {
    tracks, state, autoAfterVideo, autoOnImage,
    autoImageAfterVideo, autoImageSlot, images,
    autoVideoAfterVideo, autoVideoSlot, videos,
    onSelect, onPlayPause, onStop, onToggleMute, onToggleLoop, onSetVolume,
    onToggleAutoAfterVideo, onToggleAutoOnImage,
    onToggleAutoImageAfterVideo, onChangeAutoImageSlot,
    onToggleAutoVideoAfterVideo, onChangeAutoVideoSlot,
  } = props;

  return (
    <div className="console-surface rounded-2xl p-5 grid-bg">
      {/* Status row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className={`led-dot ${state.isPlaying && !state.isMuted ? "" : "idle"}`} />
          <div className="font-mono text-xs tracking-widest">
            <span className="opacity-60">AUDIO</span>{" "}
            <span className="neon-text-amber">{state.current?.name ?? "—"}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono text-[0.7rem] tracking-widest">
          <span className={state.isPlaying ? "neon-text-lime" : "opacity-50"}>
            {state.isPlaying ? "● PLAYING" : "○ STOPPED"}
          </span>
          <span className={state.isMuted ? "neon-text-amber" : "opacity-50"}>
            {state.isMuted ? "🔇 MUTED" : "🔊"}
          </span>
          <span className={state.isLoop ? "neon-text-cyan" : "opacity-50"}>
            {state.isLoop ? "↻ LOOP" : "→"}
          </span>
        </div>
      </div>

      {/* Track pads */}
      <div className="font-mono text-[0.65rem] tracking-[0.3em] opacity-60 mb-2 px-1">DECK C · AUDIO</div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {tracks.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className={`pad-base pad-lime ${state.current?.id === t.id ? "active" : ""} flex flex-col items-start gap-1 text-left`}
          >
            <span className="text-[0.65rem] opacity-70 font-mono">[A{t.slot}]</span>
            <span className="text-sm">{t.name}</span>
          </button>
        ))}
      </div>

      {/* Transport */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <button
          onClick={onPlayPause}
          className={`pad-base pad-lime ${state.isPlaying ? "active" : ""} flex flex-col items-start gap-1 text-left`}
        >
          <span className="text-[0.65rem] opacity-70 font-mono">[A]</span>
          <span className="text-base">{state.isPlaying ? "Pause" : "Play"}</span>
        </button>
        <button
          onClick={onStop}
          disabled={!state.current}
          className="pad-base pad-lime flex flex-col items-start gap-1 text-left"
        >
          <span className="text-[0.65rem] opacity-70 font-mono">RESET</span>
          <span className="text-base">Stop</span>
        </button>
        <button
          onClick={onToggleMute}
          className={`pad-base pad-red ${state.isMuted ? "active" : ""} flex flex-col items-start gap-1 text-left`}
        >
          <span className="text-[0.65rem] opacity-70 font-mono">[M]</span>
          <span className="text-base">{state.isMuted ? "Unmute" : "Mute"}</span>
        </button>
        <button
          onClick={onToggleLoop}
          className={`pad-base pad-cyan ${state.isLoop ? "active" : ""} flex flex-col items-start gap-1 text-left`}
        >
          <span className="text-[0.65rem] opacity-70 font-mono">[L]</span>
          <span className="text-base">Loop</span>
        </button>
      </div>

      {/* Volume */}
      <div className="rounded-xl border border-[color:var(--panel-border)] p-3 bg-[color:var(--panel)] mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[0.65rem] tracking-[0.3em] opacity-60">VOLUME</span>
          <span className="font-mono text-sm neon-text-amber w-14 text-right">{Math.round(state.volume * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(state.volume * 100)}
          onChange={(e) => onSetVolume(Number(e.target.value) / 100)}
          className="w-full accent-[color:var(--neon-amber)]"
        />
      </div>

      {/* Auto modes */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onToggleAutoAfterVideo}
          className={`pad-base pad-cyan ${autoAfterVideo ? "active" : ""} flex flex-col items-start gap-1 text-left !py-3`}
        >
          <span className="text-[0.6rem] opacity-70 font-mono">AUTO AUDIO</span>
          <span className="text-xs">After Video {autoAfterVideo ? "ON" : "OFF"}</span>
        </button>
        <button
          onClick={onToggleAutoOnImage}
          className={`pad-base pad-magenta ${autoOnImage ? "active" : ""} flex flex-col items-start gap-1 text-left !py-3`}
        >
          <span className="text-[0.6rem] opacity-70 font-mono">AUTO AUDIO</span>
          <span className="text-xs">On Image {autoOnImage ? "ON" : "OFF"}</span>
        </button>
      </div>

      {/* Auto image after video */}
      <div className="rounded-xl border border-[color:var(--panel-border)] p-3 bg-[color:var(--panel)] mt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[0.65rem] tracking-[0.3em] opacity-60">AUTO IMAGE · AFTER VIDEO</span>
          <button
            onClick={onToggleAutoImageAfterVideo}
            className={`pad-base pad-magenta ${autoImageAfterVideo ? "active" : ""} !py-1 !px-3 text-xs`}
          >
            {autoImageAfterVideo ? "ON" : "OFF"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onChangeAutoImageSlot("cycle")}
            className={`pad-base pad-magenta ${autoImageSlot === "cycle" ? "active" : ""} !py-1 !px-3 text-[0.7rem]`}
          >
            ↻ CYCLE
          </button>
          {images.map((i) => (
            <button
              key={i.id}
              onClick={() => onChangeAutoImageSlot(i.slot)}
              className={`pad-base pad-magenta ${autoImageSlot === i.slot ? "active" : ""} !py-1 !px-3 text-[0.7rem]`}
            >
              I{i.slot} · {i.name}
            </button>
          ))}
        </div>
      </div>

      {/* Auto video after video */}
      <div className="rounded-xl border border-[color:var(--panel-border)] p-3 bg-[color:var(--panel)] mt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[0.65rem] tracking-[0.3em] opacity-60">AUTO VIDEO · AFTER VIDEO</span>
          <button
            onClick={onToggleAutoVideoAfterVideo}
            className={`pad-base pad-cyan ${autoVideoAfterVideo ? "active" : ""} !py-1 !px-3 text-xs`}
          >
            {autoVideoAfterVideo ? "ON" : "OFF"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onChangeAutoVideoSlot("cycle")}
            className={`pad-base pad-cyan ${autoVideoSlot === "cycle" ? "active" : ""} !py-1 !px-3 text-[0.7rem]`}
          >
            ↻ CYCLE
          </button>
          {videos.map((v) => (
            <button
              key={v.id}
              onClick={() => onChangeAutoVideoSlot(v.slot)}
              className={`pad-base pad-cyan ${autoVideoSlot === v.slot ? "active" : ""} !py-1 !px-3 text-[0.7rem]`}
            >
              V{v.slot} · {v.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
