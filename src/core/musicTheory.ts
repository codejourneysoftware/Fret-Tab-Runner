/**
 * Core music theory primitives: Pitch, NoteDurationType, TimeSignature, and Tuning.
 */

export type NoteName =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";

const NOTE_NAMES: NoteName[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export interface Pitch {
  note: NoteName;
  octave: number;
}

export function semitoneFromC(note: NoteName): number {
  return NOTE_NAMES.indexOf(note);
}

export function noteFromSemitone(semitone: number): NoteName {
  const mod = ((semitone % 12) + 12) % 12;
  return NOTE_NAMES[mod];
}

export function pitchFromMidi(midiNumber: number): Pitch {
  return {
    note: noteFromSemitone(midiNumber % 12),
    octave: Math.floor(midiNumber / 12) - 1,
  };
}

export function pitchToMidi(pitch: Pitch): number {
  return (pitch.octave + 1) * 12 + semitoneFromC(pitch.note);
}

/** Equal-temperament frequency in Hz (A4 = 440 Hz). */
export function pitchFrequency(pitch: Pitch): number {
  return 440.0 * Math.pow(2.0, (pitchToMidi(pitch) - 69) / 12.0);
}

export function transposePitch(pitch: Pitch, semitones: number): Pitch {
  return pitchFromMidi(pitchToMidi(pitch) + semitones);
}

export function formatPitch(pitch: Pitch): string {
  return `${pitch.note}${pitch.octave}`;
}

export function parsePitch(input: string): Pitch | null {
  const clean = input.trim();
  if (clean.length < 2) return null;
  const oct = parseInt(clean.slice(-1), 10);
  if (Number.isNaN(oct)) return null;
  const prefix = clean.slice(0, -1).toUpperCase();
  const flatMap: Record<string, NoteName> = {
    DB: "C#",
    EB: "D#",
    GB: "F#",
    AB: "G#",
    BB: "A#",
  };
  const normalized = (flatMap[prefix] ?? prefix) as NoteName;
  if (!NOTE_NAMES.includes(normalized)) return null;
  return { note: normalized, octave: oct };
}

export type NoteDurationType =
  | "1/1"
  | "1/2"
  | "1/4"
  | "1/8"
  | "1/16"
  | "1/32"
  | "1/4T"
  | "1/8T";

export const NOTE_DURATION_OPTIONS: Array<{
  type: NoteDurationType;
  beats: number;
  displayName: string;
  shortLabel: string;
}> = [
  { type: "1/1", beats: 4.0, displayName: "Whole (4b)", shortLabel: "1/1" },
  { type: "1/2", beats: 2.0, displayName: "Half (2b)", shortLabel: "1/2" },
  { type: "1/4", beats: 1.0, displayName: "1/4 (1b)", shortLabel: "1/4" },
  { type: "1/8", beats: 0.5, displayName: "1/8 (0.5b)", shortLabel: "1/8" },
  { type: "1/16", beats: 0.25, displayName: "1/16 (0.25b)", shortLabel: "1/16" },
  { type: "1/32", beats: 0.125, displayName: "1/32 (0.125b)", shortLabel: "1/32" },
  { type: "1/4T", beats: 2.0 / 3.0, displayName: "1/4 Triplet", shortLabel: "1/4T" },
  { type: "1/8T", beats: 1.0 / 3.0, displayName: "1/8 Triplet", shortLabel: "1/8T" },
];

export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export const COMMON_TIME: TimeSignature = { numerator: 4, denominator: 4 };
export const WALTZ_TIME: TimeSignature = { numerator: 3, denominator: 4 };
export const COMPOUND_DUPLE: TimeSignature = { numerator: 6, denominator: 8 };

export function beatsPerMeasure(ts: TimeSignature): number {
  return Math.max(1, ts.numerator) * (4.0 / Math.max(1, ts.denominator));
}

export interface Tuning {
  name: string;
  /** Ordered from highest pitch (string 1, thinnest) to lowest pitch (string N, thickest). */
  pitches: Pitch[];
}

export const GUITAR_STANDARD_TUNING: Tuning = {
  name: "Standard Guitar (EADGBE)",
  pitches: [
    { note: "E", octave: 4 }, // 1st (high E)
    { note: "B", octave: 3 }, // 2nd (B)
    { note: "G", octave: 3 }, // 3rd (G)
    { note: "D", octave: 3 }, // 4th (D)
    { note: "A", octave: 2 }, // 5th (A)
    { note: "E", octave: 2 }, // 6th (low E)
  ],
};

export const GUITAR_DROP_D_TUNING: Tuning = {
  name: "Drop D (DADGBE)",
  pitches: [
    { note: "E", octave: 4 },
    { note: "B", octave: 3 },
    { note: "G", octave: 3 },
    { note: "D", octave: 3 },
    { note: "A", octave: 2 },
    { note: "D", octave: 2 },
  ],
};

export const BASS_STANDARD_TUNING: Tuning = {
  name: "Standard 4-String Bass (EADG)",
  pitches: [
    { note: "G", octave: 2 }, // 1st (G)
    { note: "D", octave: 2 }, // 2nd (D)
    { note: "A", octave: 1 }, // 3rd (A)
    { note: "E", octave: 1 }, // 4th (E)
  ],
};

/** Returns pitch for 1-based stringNumber (1 = top/highest string) and fret (0..24). */
export function pitchForStringAndFret(
  tuning: Tuning,
  stringNumber: number,
  fret: number
): Pitch | null {
  if (stringNumber < 1 || stringNumber > tuning.pitches.length) return null;
  return transposePitch(tuning.pitches[stringNumber - 1], fret);
}
