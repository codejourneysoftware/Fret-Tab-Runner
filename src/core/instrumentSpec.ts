import {
  BASS_STANDARD_TUNING,
  GUITAR_STANDARD_TUNING,
  Tuning,
} from "./musicTheory";

export type InstrumentCategory = "Guitar" | "Bass" | "Custom";
export type ReleasePhase = "Phase I (Active)" | "Phase II (Coming Soon)" | "Experimental";

export interface InstrumentSpec {
  id: string;
  name: string;
  subtitle: string;
  category: InstrumentCategory;
  stringCount: number;
  fretCount: number;
  defaultTuning: Tuning;
  stringColors: string[];
  releasePhase: ReleasePhase;
  description: string;
}

export const GUITAR_6_STRING: InstrumentSpec = {
  id: "guitar-6string",
  name: "Standard 6-String Guitar",
  subtitle: "Electric / Acoustic (E-A-D-G-B-e)",
  category: "Guitar",
  stringCount: 6,
  fretCount: 24,
  defaultTuning: GUITAR_STANDARD_TUNING,
  stringColors: [
    "#E040FB", // String 1 (High E) - Electric Magenta
    "#00E676", // String 2 (B) - Electric Green
    "#FF9100", // String 3 (G) - Vivid Orange
    "#00B0FF", // String 4 (D) - Cyan Blue
    "#FFD600", // String 5 (A) - Golden Yellow
    "#FF1744", // String 6 (Low E) - Radiant Red
  ],
  releasePhase: "Phase I (Active)",
  description:
    "Full 6-string note highway with 24 frets, color-coded strings, and Karplus-Strong physical modeling synthesis.",
};

export const BASS_4_STRING: InstrumentSpec = {
  id: "bass-4string",
  name: "4-String Bass Guitar",
  subtitle: "Solid Body Electric Bass (E-A-D-G)",
  category: "Bass",
  stringCount: 4,
  fretCount: 24,
  defaultTuning: BASS_STANDARD_TUNING,
  stringColors: [
    "#00E676", // String 1 (G) - Electric Green
    "#00B0FF", // String 2 (D) - Cyan Blue
    "#FFD600", // String 3 (A) - Golden Yellow
    "#FF1744", // String 4 (E) - Radiant Red
  ],
  releasePhase: "Phase I (Active)",
  description:
    "4-string electric bass engine. Deep low-end groove master tuned E1-A1-D2-G2 with physical modeling synthesis, color-coded strings, and 24 synchronized frets.",
};

export const ALL_INSTRUMENTS: InstrumentSpec[] = [
  GUITAR_6_STRING,
  BASS_4_STRING,
];

export function getInstrumentById(id: string): InstrumentSpec {
  return ALL_INSTRUMENTS.find((inst) => inst.id === id) ?? GUITAR_6_STRING;
}

export function getStringColor(stringNumber: number, stringCount: number = 6): string {
  const palette =
    stringCount <= 4 ? BASS_4_STRING.stringColors : GUITAR_6_STRING.stringColors;
  const idx = Math.max(1, Math.min(palette.length, stringNumber)) - 1;
  return palette[idx];
}
