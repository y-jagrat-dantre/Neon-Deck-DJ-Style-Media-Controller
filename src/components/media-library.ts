export type MediaItem = {
  id: string;
  kind: "video" | "image";
  slot: number;
  name: string;
  src: string;
};

export type AudioTrack = {
  id: string;
  slot: number;
  name: string;
  src: string;
};

// Replace these URLs with local files in /public/media or /src/assets.
export const VIDEOS: MediaItem[] = [
  { id: "v1", kind: "video", slot: 1, name: "Big Buck Bunny", src: "Videos/Video1.mp4" },
  { id: "v2", kind: "video", slot: 2, name: "Elephant Dream", src: "Videos/Video2.mp4" },
  { id: "v3", kind: "video", slot: 3, name: "Sintel Trailer", src: "Videos/Video3.mp4" },
];

export const IMAGES: MediaItem[] = [
  { id: "i1", kind: "image", slot: 1, name: "Stage Lights", src: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1920&q=80" },
  { id: "i2", kind: "image", slot: 2, name: "Concert Crowd", src: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80" },
  { id: "i3", kind: "image", slot: 3, name: "Neon City", src: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920&q=80" },
];

// Royalty-free background music samples (SoundHelix). Swap for local /audio files when ready.
export const AUDIO_TRACKS: AudioTrack[] = [
  { id: "a1", slot: 1, name: "Track 1 — Pulse", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "a2", slot: 2, name: "Track 2 — Drift", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "a3", slot: 3, name: "Track 3 — Surge", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];
