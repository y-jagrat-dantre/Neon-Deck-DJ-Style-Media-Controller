import type { MediaItem } from "./media-library";

type Props = {
  videos: MediaItem[];
  images: MediaItem[];
  mode: "video" | "image";
  current: MediaItem | null;
  isPlaying: boolean;
  blackout: boolean;
  videoLoop: boolean;
  queue: MediaItem[];
  autoTriggerSec: number;
  isAutoOn: boolean;
  onSelect: (m: MediaItem) => void;
  onSetMode: (m: "video" | "image") => void;
  onPlayPause: () => void;
  onStop: () => void;
  onBlackout: () => void;
  onToggleVideoLoop: () => void;
  onFullscreen: () => void;
  onEnqueue: (m: MediaItem) => void;
  onClearQueue: () => void;
  onToggleAuto: () => void;
  onChangeAutoSec: (n: number) => void;
  onSeek: (seconds: number) => void;
};

function Pad({
  label, sub, color, active, disabled, onClick,
}: {
  label: string; sub?: string; color: "cyan" | "magenta" | "lime" | "red";
  active?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`pad-base pad-${color} ${active ? "active" : ""} flex flex-col items-start gap-1 text-left`}
    >
      <span className="text-[0.65rem] opacity-70 font-mono">{sub}</span>
      <span className="text-base">{label}</span>
    </button>
  );
}

export function ControlPanel(props: Props) {
  const {
    videos, images, mode, current, isPlaying, blackout, videoLoop, queue,
    autoTriggerSec, isAutoOn,
    onSelect, onSetMode, onPlayPause, onStop, onBlackout, onToggleVideoLoop, onFullscreen,
    onEnqueue, onClearQueue, onToggleAuto, onChangeAutoSec, onSeek,
  } = props;

  return (
    <div className="console-surface rounded-2xl p-5 grid-bg">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 px-2">
        <div className="flex items-center gap-3">
          <div className={`led-dot ${isPlaying && !blackout ? "" : "idle"}`} />
          <div className="font-mono text-xs tracking-widest">
            <span className="opacity-60">MODE</span>{" "}
            <span className={mode === "video" ? "neon-text-cyan" : "neon-text-magenta"}>
              {mode.toUpperCase()}
            </span>
          </div>
          <div className="font-mono text-xs tracking-widest">
            <span className="opacity-60">CUE</span>{" "}
            <span className="neon-text-lime">{current?.name ?? "—"}</span>
          </div>
          <div className="font-mono text-xs tracking-widest">
            <span className="opacity-60">STATE</span>{" "}
            <span className="neon-text-amber">
              {blackout ? "BLACKOUT" : isPlaying ? "PLAYING" : current ? "PAUSED" : "IDLE"}
            </span>
          </div>
        </div>
        <div className="font-mono text-[0.7rem] opacity-60 tracking-widest">
          ⌨ V/I · 1/2/3 · SPACE · F · B
        </div>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Pad label="Video Mode" sub="[V]" color="cyan" active={mode === "video"} onClick={() => onSetMode("video")} />
        <Pad label="Image Mode" sub="[I]" color="magenta" active={mode === "image"} onClick={() => onSetMode("image")} />
      </div>

      {/* Deck A: Videos */}
      <div className="mb-4">
        <div className="font-mono text-[0.65rem] tracking-[0.3em] opacity-60 mb-2 px-1">DECK A · VIDEOS</div>
        <div className="grid grid-cols-3 gap-3">
          {videos.map((v) => (
            <div key={v.id} className="flex flex-col gap-1">
              <Pad
                label={v.name}
                sub={`[${v.slot}]`}
                color="cyan"
                active={current?.id === v.id}
                onClick={() => onSelect(v)}
              />
              <button
                onClick={() => onEnqueue(v)}
                className="text-[0.6rem] font-mono tracking-widest opacity-60 hover:opacity-100 hover:neon-text-cyan transition"
              >
                + QUEUE
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Deck B: Images */}
      <div className="mb-4">
        <div className="font-mono text-[0.65rem] tracking-[0.3em] opacity-60 mb-2 px-1">DECK B · IMAGES</div>
        <div className="grid grid-cols-3 gap-3">
          {images.map((i) => (
            <div key={i.id} className="flex flex-col gap-1">
              <Pad
                label={i.name}
                sub={`[${i.slot}]`}
                color="magenta"
                active={current?.id === i.id}
                onClick={() => onSelect(i)}
              />
              <button
                onClick={() => onEnqueue(i)}
                className="text-[0.6rem] font-mono tracking-widest opacity-60 hover:opacity-100 hover:neon-text-magenta transition"
              >
                + QUEUE
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transport */}
      <div className="grid grid-cols-5 gap-3 mb-3">
        <Pad
          label={isPlaying ? "Pause" : "Play"}
          sub="[SPACE]"
          color="lime"
          active={isPlaying}
          disabled={!current || current.kind !== "video"}
          onClick={onPlayPause}
        />
        <Pad label="Stop" sub="RESET" color="lime" onClick={onStop} disabled={!current} />
        <Pad label="Fullscreen" sub="[F]" color="cyan" onClick={onFullscreen} />
        <Pad label="Vid Loop" sub="[G]" color="cyan" active={videoLoop} onClick={onToggleVideoLoop} />
        <Pad label="Blackout" sub="[B]" color="red" active={blackout} onClick={onBlackout} />
      </div>

      {/* Seek */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Pad
          label="− 10s"
          sub="[← / J]"
          color="cyan"
          disabled={!current || current.kind !== "video"}
          onClick={() => onSeek(-10)}
        />
        <Pad
          label="+ 10s"
          sub="[→ / L]"
          color="cyan"
          disabled={!current || current.kind !== "video"}
          onClick={() => onSeek(10)}
        />
      </div>

      {/* Auto-trigger + Queue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-[color:var(--panel-border)] p-3 bg-[color:var(--panel)]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[0.65rem] tracking-[0.3em] opacity-60">AUTO-TRIGGER</span>
            <button
              onClick={onToggleAuto}
              className={`pad-base pad-lime ${isAutoOn ? "active" : ""} !py-1 !px-3 text-xs`}
            >
              {isAutoOn ? "ON" : "OFF"}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={2}
              max={60}
              value={autoTriggerSec}
              onChange={(e) => onChangeAutoSec(Number(e.target.value))}
              className="flex-1 accent-[color:var(--neon-lime)]"
            />
            <span className="font-mono text-sm neon-text-lime w-14 text-right">{autoTriggerSec}s</span>
          </div>
        </div>

        <div className="rounded-xl border border-[color:var(--panel-border)] p-3 bg-[color:var(--panel)]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[0.65rem] tracking-[0.3em] opacity-60">QUEUE · {queue.length}</span>
            <button
              onClick={onClearQueue}
              className="font-mono text-[0.65rem] tracking-widest opacity-60 hover:neon-text-amber transition"
            >
              CLEAR
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto min-h-[2rem] items-center">
            {queue.length === 0 && (
              <span className="font-mono text-xs opacity-40">Empty — tap + QUEUE on any pad</span>
            )}
            {queue.map((m, idx) => (
              <span
                key={`${m.id}-${idx}`}
                className={`font-mono text-[0.7rem] px-2 py-1 rounded border whitespace-nowrap ${
                  m.kind === "video" ? "neon-text-cyan border-[color:var(--neon-cyan)]/40" : "neon-text-magenta border-[color:var(--neon-magenta)]/40"
                }`}
              >
                {idx + 1}. {m.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
