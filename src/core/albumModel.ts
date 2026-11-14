import { getAllSampleSongs } from "./sampleSongs";
import { createUuid, FretStackSong } from "./songModel";

export type AlbumCoverPreset =
  | "capybara"
  | "golden-puppy"
  | "cuddly-koala"
  | "happy-panda"
  | "dolphin-sunset"
  | "space-cat"
  | "sunflower-meadow"
  | "woodland-fox"
  | "penguin-band"
  | "rainbow-harmony";

export const ALBUM_COVER_PRESETS: Array<{
  id: AlbumCoverPreset;
  displayName: string;
  gradient: [string, string];
  emoji: string;
}> = [
  { id: "capybara", displayName: "Cute Capybara", gradient: ["#F59E0B", "#B45309"], emoji: "🍊" },
  { id: "golden-puppy", displayName: "Sunny Puppy", gradient: ["#FBBF24", "#D97706"], emoji: "🐶" },
  { id: "cuddly-koala", displayName: "Cuddly Koala", gradient: ["#64748B", "#334155"], emoji: "🐨" },
  { id: "happy-panda", displayName: "Bamboo Panda", gradient: ["#10B981", "#047857"], emoji: "🐼" },
  { id: "dolphin-sunset", displayName: "Ocean Dolphin", gradient: ["#06B6D4", "#1D4ED8"], emoji: "🐬" },
  { id: "space-cat", displayName: "Cosmic Kitty", gradient: ["#8B5CF6", "#312E81"], emoji: "🐱" },
  { id: "sunflower-meadow", displayName: "Sunny Meadow", gradient: ["#84CC16", "#15803D"], emoji: "🌻" },
  { id: "woodland-fox", displayName: "Woodland Fox", gradient: ["#F97316", "#9A3412"], emoji: "🦊" },
  { id: "penguin-band", displayName: "Cozy Penguin", gradient: ["#38BDF8", "#0369A1"], emoji: "🐧" },
  { id: "rainbow-harmony", displayName: "Rainbow Harmony", gradient: ["#EC4899", "#6366F1"], emoji: "🌈" },
];

export interface FretStackAlbum {
  id: string;
  name: string;
  subtitle: string;
  coverPreset: AlbumCoverPreset;
  /** Optional base64 data URL for custom uploaded cover art. */
  customCoverDataUrl?: string;
  songs: FretStackSong[];
  createdAt: string;
  modifiedAt: string;
}

export interface FretStackAlbumsBackup {
  formatVersion: string;
  exportedAt: string;
  albums: FretStackAlbum[];
}

export const DEMO_ALBUM_ID = "D3A0A1B2-0000-4000-8000-000000000001";

export function createDefaultDemoAlbum(): FretStackAlbum {
  const now = new Date().toISOString();
  return {
    id: DEMO_ALBUM_ID,
    name: "Demo",
    subtitle: "4 Built-In Demo Songs",
    coverPreset: "capybara",
    songs: getAllSampleSongs(),
    createdAt: now,
    modifiedAt: now,
  };
}

export function createNewAlbum(
  name: string,
  subtitle = "FretTabRunner Collection",
  coverPreset: AlbumCoverPreset = "capybara"
): FretStackAlbum {
  const now = new Date().toISOString();
  return {
    id: createUuid(),
    name: name.trim() || "New Album",
    subtitle,
    coverPreset,
    songs: [],
    createdAt: now,
    modifiedAt: now,
  };
}

const ALBUMS_STORAGE_KEY = "FretTabRunner_Albums_v1";

export function loadPersistedAlbums(): FretStackAlbum[] {
  try {
    const raw = localStorage.getItem(ALBUMS_STORAGE_KEY);
    if (!raw) return [createDefaultDemoAlbum()];
    const parsed = decodeAlbumsBackup(raw);
    return parsed.length > 0 ? parsed : [createDefaultDemoAlbum()];
  } catch {
    return [createDefaultDemoAlbum()];
  }
}

export function savePersistedAlbums(albums: FretStackAlbum[]): void {
  try {
    localStorage.setItem(ALBUMS_STORAGE_KEY, encodeAlbumsBackup(albums));
  } catch {
    // ignore storage quota errors
  }
}

export function encodeAlbumsBackup(albums: FretStackAlbum[]): string {
  const backup: FretStackAlbumsBackup = {
    formatVersion: "1.0",
    exportedAt: new Date().toISOString(),
    albums,
  };
  return JSON.stringify(backup, null, 2);
}

export function decodeAlbumsBackup(jsonString: string): FretStackAlbum[] {
  const parsed = JSON.parse(jsonString);
  if (parsed && Array.isArray(parsed.albums) && parsed.albums.length > 0) {
    return parsed.albums as FretStackAlbum[];
  }
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed as FretStackAlbum[];
  }
  if (parsed && typeof parsed === "object" && Array.isArray(parsed.songs)) {
    return [parsed as FretStackAlbum];
  }
  if (parsed && typeof parsed === "object" && Array.isArray(parsed.tracks)) {
    const now = new Date().toISOString();
    return [
      {
        id: createUuid(),
        name: "Restored Songs",
        subtitle: "Imported Song",
        coverPreset: "capybara",
        songs: [parsed as FretStackSong],
        createdAt: now,
        modifiedAt: now,
      },
    ];
  }
  throw new Error("The selected file is not a valid FretTabRunner albums backup.");
}
