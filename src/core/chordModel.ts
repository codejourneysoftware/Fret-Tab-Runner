import { createUuid } from "./songModel";

export type ChordQuality =
  | "Major"
  | "Minor"
  | "7th"
  | "Minor 7th"
  | "Major 7th"
  | "Sus4"
  | "Sus2"
  | "Add9"
  | "Power (5)"
  | "Custom";

export const ALL_CHORD_QUALITIES: ChordQuality[] = [
  "Major",
  "Minor",
  "7th",
  "Minor 7th",
  "Major 7th",
  "Sus4",
  "Sus2",
  "Add9",
  "Power (5)",
  "Custom",
];

export interface ChordDefinition {
  id: string;
  name: string;
  quality: ChordQuality;
  rootName?: string;
  /** Frets ordered from String 6 (Low E) to String 1 (High E). null = muted (X). */
  string6To1: Array<number | null>;
  defaultDurationBeats: number;
  colorHex: string;
  isCustom: boolean;
}

export function defaultChordColorHex(name: string): string {
  const clean = name.toUpperCase();
  if (clean.startsWith("EM7")) return "#FB923C";
  if (clean.startsWith("EM")) return "#F97316";
  if (clean.startsWith("E")) return "#EAB308";
  if (clean.startsWith("DM")) return "#06B6D4";
  if (clean.startsWith("D")) return "#0EA5E9";
  if (clean.startsWith("GM")) return "#F43F5E";
  if (clean.startsWith("G")) return "#F87171";
  if (clean.startsWith("CM")) return "#10B981";
  if (clean.startsWith("C")) return "#22C55E";
  if (clean.startsWith("AM")) return "#14B8A6";
  if (clean.startsWith("A")) return "#A855F7";
  if (clean.startsWith("BM")) return "#6366F1";
  if (clean.startsWith("B")) return "#8B5CF6";
  if (clean.startsWith("FM")) return "#D97706";
  if (clean.startsWith("F")) return "#F59E0B";
  return "#00E5FF";
}

function makeChord(
  name: string,
  quality: ChordQuality,
  rootName: string,
  string6To1: Array<number | null>,
  colorHex?: string
): ChordDefinition {
  return {
    id: `chord-${name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    name,
    quality,
    rootName,
    string6To1,
    defaultDurationBeats: 1.0,
    colorHex: colorHex ?? defaultChordColorHex(name),
    isCustom: false,
  };
}

export function chordFretsByString(
  chord: ChordDefinition,
  stringCount = 6
): Record<number, number> {
  const map: Record<number, number> = {};
  chord.string6To1.forEach((fret, idx) => {
    if (fret === null || fret === undefined) return;
    const stringNumber = stringCount - idx;
    if (stringNumber >= 1 && stringNumber <= stringCount) {
      map[stringNumber] = fret;
    }
  });
  return map;
}

export function chordTabSummary(chord: ChordDefinition): string {
  return chord.string6To1.map((f) => (f === null ? "X" : String(f))).join(" ");
}

export const COMMON_MAJOR_CHORDS: ChordDefinition[] = [
  makeChord("C", "Major", "C", [null, 3, 2, 0, 1, 0], "#22C55E"),
  makeChord("D", "Major", "D", [null, null, 0, 2, 3, 2], "#0EA5E9"),
  makeChord("E", "Major", "E", [0, 2, 2, 1, 0, 0], "#EAB308"),
  makeChord("F", "Major", "F", [1, 3, 3, 2, 1, 1], "#F59E0B"),
  makeChord("G", "Major", "G", [3, 2, 0, 0, 0, 3], "#F87171"),
  makeChord("A", "Major", "A", [null, 0, 2, 2, 2, 0], "#A855F7"),
  makeChord("B", "Major", "B", [null, 2, 4, 4, 4, 2], "#8B5CF6"),
  makeChord("C#", "Major", "C#", [null, 4, 6, 6, 6, 4], "#10B981"),
  makeChord("Eb", "Major", "Eb", [null, 6, 8, 8, 8, 6], "#38BDF8"),
  makeChord("F#", "Major", "F#", [2, 4, 4, 3, 2, 2], "#FB7185"),
  makeChord("Ab", "Major", "Ab", [4, 6, 6, 5, 4, 4], "#C084FC"),
  makeChord("Bb", "Major", "Bb", [null, 1, 3, 3, 3, 1], "#818CF8"),
];

export const COMMON_MINOR_CHORDS: ChordDefinition[] = [
  makeChord("Am", "Minor", "A", [null, 0, 2, 2, 1, 0], "#14B8A6"),
  makeChord("Bm", "Minor", "B", [null, 2, 4, 4, 3, 2], "#6366F1"),
  makeChord("Cm", "Minor", "C", [null, 3, 5, 5, 4, 3], "#059669"),
  makeChord("Dm", "Minor", "D", [null, null, 0, 2, 3, 1], "#06B6D4"),
  makeChord("Em", "Minor", "E", [0, 2, 2, 0, 0, 0], "#F97316"),
  makeChord("Fm", "Minor", "F", [1, 3, 3, 1, 1, 1], "#D97706"),
  makeChord("Gm", "Minor", "G", [3, 5, 5, 3, 3, 3], "#F43F5E"),
  makeChord("C#m", "Minor", "C#", [null, 4, 6, 6, 5, 4], "#0D9488"),
  makeChord("Ebm", "Minor", "Eb", [null, 6, 8, 8, 7, 6], "#0284C7"),
  makeChord("F#m", "Minor", "F#", [2, 4, 4, 2, 2, 2], "#E11D48"),
  makeChord("G#m", "Minor", "G#", [4, 6, 6, 4, 4, 4], "#9333EA"),
  makeChord("Bbm", "Minor", "Bb", [null, 1, 3, 3, 2, 1], "#4F46E5"),
];

export const COMMON_SEVENTH_CHORDS: ChordDefinition[] = [
  makeChord("Em7", "Minor 7th", "E", [0, 2, 2, 0, 3, 0], "#FB923C"),
  makeChord("Am7", "Minor 7th", "A", [null, 0, 2, 0, 1, 0], "#2DD4BF"),
  makeChord("Dm7", "Minor 7th", "D", [null, null, 0, 2, 1, 1], "#22D3EE"),
  makeChord("C7", "7th", "C", [null, 3, 2, 3, 1, 0], "#4ADE80"),
  makeChord("D7", "7th", "D", [null, null, 0, 2, 1, 2], "#38BDF8"),
  makeChord("E7", "7th", "E", [0, 2, 0, 1, 0, 0], "#FACC15"),
  makeChord("G7", "7th", "G", [3, 2, 0, 0, 0, 1], "#FB7185"),
  makeChord("A7", "7th", "A", [null, 0, 2, 0, 2, 0], "#C084FC"),
  makeChord("B7", "7th", "B", [null, 2, 1, 2, 0, 2], "#A78BFA"),
  makeChord("Cmaj7", "Major 7th", "C", [null, 3, 2, 0, 0, 0], "#86EFAC"),
  makeChord("Dsus4", "Sus4", "D", [null, null, 0, 2, 3, 3], "#60A5FA"),
  makeChord("Asus4", "Sus4", "A", [null, 0, 2, 2, 3, 0], "#E879F9"),
  makeChord("Cadd9", "Add9", "C", [null, 3, 2, 0, 3, 0], "#34D399"),
];

export const QUICK_TOOLBAR_CHORDS: ChordDefinition[] = [
  makeChord("C", "Major", "C", [null, 3, 2, 0, 1, 0], "#22C55E"),
  makeChord("G", "Major", "G", [3, 2, 0, 0, 0, 3], "#F87171"),
  makeChord("D", "Major", "D", [null, null, 0, 2, 3, 2], "#0EA5E9"),
  makeChord("Em", "Minor", "E", [0, 2, 2, 0, 0, 0], "#F97316"),
  makeChord("Am", "Minor", "A", [null, 0, 2, 2, 1, 0], "#14B8A6"),
  makeChord("E", "Major", "E", [0, 2, 2, 1, 0, 0], "#EAB308"),
  makeChord("A", "Major", "A", [null, 0, 2, 2, 2, 0], "#A855F7"),
  makeChord("Dm", "Minor", "D", [null, null, 0, 2, 3, 1], "#06B6D4"),
  makeChord("F", "Major", "F", [1, 3, 3, 2, 1, 1], "#F59E0B"),
  makeChord("Em7", "Minor 7th", "E", [0, 2, 2, 0, 3, 0], "#FB923C"),
];

const CUSTOM_CHORDS_STORAGE_KEY = "FretTabRunner_CustomChords_v1";

export function loadCustomChords(): ChordDefinition[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CHORDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomChords(chords: ChordDefinition[]): void {
  try {
    localStorage.setItem(CUSTOM_CHORDS_STORAGE_KEY, JSON.stringify(chords));
  } catch {
    // ignore storage quota errors
  }
}

export function createCustomChord(
  name: string,
  quality: ChordQuality,
  string6To1: Array<number | null>,
  defaultDurationBeats = 1.0,
  colorHex?: string
): ChordDefinition {
  return {
    id: createUuid(),
    name: name.trim() || "Custom",
    quality,
    string6To1,
    defaultDurationBeats: Math.max(0.25, defaultDurationBeats),
    colorHex: colorHex ?? defaultChordColorHex(name),
    isCustom: true,
  };
}
