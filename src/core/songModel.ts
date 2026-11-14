import {
  beatsPerMeasure,
  COMMON_TIME,
  TimeSignature,
  Tuning,
} from "./musicTheory";

export type Technique =
  | "Normal"
  | "Hammer-on"
  | "Pull-off"
  | "Slide Up"
  | "Slide Down"
  | "Bend"
  | "Vibrato"
  | "Palm Mute"
  | "Muted Note";

export const ALL_TECHNIQUES: Technique[] = [
  "Normal",
  "Hammer-on",
  "Pull-off",
  "Slide Up",
  "Slide Down",
  "Bend",
  "Vibrato",
  "Palm Mute",
  "Muted Note",
];

export function techniqueShortSymbol(technique: Technique): string {
  switch (technique) {
    case "Normal":
      return "";
    case "Hammer-on":
      return "h";
    case "Pull-off":
      return "p";
    case "Slide Up":
      return "/";
    case "Slide Down":
      return "\\";
    case "Bend":
      return "b";
    case "Vibrato":
      return "~";
    case "Palm Mute":
      return "P.M.";
    case "Muted Note":
      return "(x)";
  }
}

export interface FretNote {
  id: string;
  /** 1-based string number (1 = highest pitch string, e.g. High E). */
  stringNumber: number;
  /** Fret number (0 = open string, 1..24). */
  fret: number;
  /** Timeline position in beats (0.0, 1.0, 2.5, ...). */
  beat: number;
  /** Duration in beats (1.0 = quarter note, 0.5 = eighth note). */
  durationBeats: number;
  technique: Technique;
  /** Suggested fretting finger (1=Index, 2=Middle, 3=Ring, 4=Pinky, 0=Thumb). */
  finger?: number;
  pitchDescription?: string;
  lyric?: string;
  chordName?: string;
}

export type AudioSourceType =
  | "Synthesizer Only"
  | "Local Audio File (MP3/WAV)"
  | "External Stream / YouTube Link";

export interface AudioSourceConfig {
  sourceType: AudioSourceType;
  localFilePath?: string;
  webUrl?: string;
  /** Offset in milliseconds to align audio transients with fretboard beat 0.0. */
  offsetMilliseconds: number;
  volume: number;
  isMuted: boolean;
  /** Native/recorded BPM of the backing audio file or stream for speed scaling. */
  recordedBpm?: number;
}

export const DEFAULT_AUDIO_SOURCE: AudioSourceConfig = {
  sourceType: "Synthesizer Only",
  offsetMilliseconds: 0,
  volume: 1.0,
  isMuted: false,
};

export interface Track {
  id: string;
  name: string;
  instrumentId: string;
  customTuning?: Tuning;
  notes: FretNote[];
  isSolo: boolean;
  isMuted: boolean;
}

export interface FretStackSong {
  id: string;
  title: string;
  artist: string;
  composer: string;
  bpm: number;
  timeSignature: TimeSignature;
  totalMeasures: number;
  audioSource: AudioSourceConfig;
  tracks: Track[];
  version: string;
  createdAt: string;
  modifiedAt: string;
  notesDescription?: string;
}

export function createUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createFretNote(
  params: Partial<FretNote> & Pick<FretNote, "stringNumber" | "fret" | "beat">
): FretNote {
  return {
    id: params.id ?? createUuid(),
    stringNumber: Math.max(1, params.stringNumber),
    fret: Math.max(0, Math.min(24, params.fret)),
    beat: Math.max(0, params.beat),
    durationBeats: Math.max(0.05, params.durationBeats ?? 1.0),
    technique: params.technique ?? "Normal",
    finger: params.finger,
    pitchDescription: params.pitchDescription,
    lyric: params.lyric,
    chordName: params.chordName,
  };
}

export function createEmptySong(title = "Untitled Song", instrumentId = "guitar-6string"): FretStackSong {
  const now = new Date().toISOString();
  return {
    id: createUuid(),
    title,
    artist: "Original",
    composer: "FretTabRunner Creator",
    bpm: 120,
    timeSignature: { ...COMMON_TIME },
    totalMeasures: 16,
    audioSource: { ...DEFAULT_AUDIO_SOURCE },
    tracks: [
      {
        id: createUuid(),
        name: instrumentId === "bass-4string" ? "Bass Track" : "Lead Guitar",
        instrumentId,
        notes: [],
        isSolo: false,
        isMuted: false,
      },
    ],
    version: "1.0",
    createdAt: now,
    modifiedAt: now,
  };
}

export function getEffectiveAudioBaseBpm(song: FretStackSong): number {
  if (song.audioSource.recordedBpm && song.audioSource.recordedBpm > 0) {
    return song.audioSource.recordedBpm;
  }
  const path = (song.audioSource.localFilePath ?? "").toLowerCase();
  if (path.includes("neonhorizonriff")) return 128;
  if (path.includes("deltasunsetblues")) return 92;
  if (path.includes("acousticraindrops")) return 100;
  if (path.includes("youmademylifebrandnew")) return 90;
  return song.bpm;
}

export function getTotalBeats(song: FretStackSong): number {
  return song.totalMeasures * beatsPerMeasure(song.timeSignature);
}

export function getDurationSeconds(song: FretStackSong): number {
  return (getTotalBeats(song) / song.bpm) * 60.0;
}

export function secondsForBeat(song: FretStackSong, beat: number): number {
  return (beat / song.bpm) * 60.0;
}

export function beatForSeconds(song: FretStackSong, seconds: number): number {
  return (seconds / 60.0) * song.bpm;
}

export function audioFileSecondsForBeat(song: FretStackSong, beat: number): number {
  const baseBpm = getEffectiveAudioBaseBpm(song);
  if (baseBpm <= 0) return secondsForBeat(song, beat);
  return (beat / baseBpm) * 60.0;
}

export function beatForAudioFileSeconds(song: FretStackSong, audioSeconds: number): number {
  const baseBpm = getEffectiveAudioBaseBpm(song);
  if (baseBpm <= 0) return beatForSeconds(song, audioSeconds);
  return (audioSeconds / 60.0) * baseBpm;
}

export function measureNumberForBeat(song: FretStackSong, beat: number): number {
  const bpmMeasure = beatsPerMeasure(song.timeSignature);
  if (bpmMeasure <= 0) return 1;
  if (beat < 0) return 0;
  return Math.floor(beat / bpmMeasure) + 1;
}
