import {
  BASS_STANDARD_TUNING,
  COMMON_TIME,
  GUITAR_STANDARD_TUNING,
  WALTZ_TIME,
} from "./musicTheory";
import {
  createFretNote,
  createUuid,
  FretNote,
  FretStackSong,
  Technique,
  Track,
} from "./songModel";

function n(
  stringNumber: number,
  fret: number,
  beat: number,
  durationBeats = 1.0,
  technique: Technique = "Normal",
  lyric?: string
): FretNote {
  return createFretNote({
    stringNumber,
    fret,
    beat,
    durationBeats,
    technique,
    lyric,
  });
}

export function createNeonHorizonRiff(): FretStackSong {
  const now = new Date().toISOString();
  const notes: FretNote[] = [
    // Measure 1: E minor groove
    n(6, 0, 0.0, 1.0),
    n(5, 2, 0.0, 1.0),
    n(6, 0, 1.0, 0.5),
    n(6, 0, 1.5, 0.5),
    n(5, 5, 2.0, 0.5, "Hammer-on"),
    n(5, 7, 2.5, 0.5),
    n(4, 5, 3.0, 0.5),
    n(4, 7, 3.5, 0.5, "Vibrato"),

    // Measure 2: G major power riff
    n(6, 3, 4.0, 1.0),
    n(5, 5, 4.0, 1.0),
    n(6, 3, 5.0, 0.5),
    n(6, 3, 5.5, 0.5),
    n(3, 7, 6.0, 0.5, "Slide Down"),
    n(3, 5, 6.5, 0.5),
    n(4, 7, 7.0, 1.0, "Vibrato"),

    // Measure 3: C major chord transition
    n(5, 3, 8.0, 1.0),
    n(4, 5, 8.0, 1.0),
    n(3, 5, 8.0, 1.0),
    n(2, 5, 9.0, 0.5),
    n(1, 3, 9.5, 0.5),
    n(2, 5, 10.0, 0.5),
    n(3, 5, 10.5, 0.5),
    n(4, 5, 11.0, 1.0),

    // Measure 4: High lead turn-around lick
    n(2, 8, 12.0, 0.5, "Slide Up"),
    n(1, 7, 12.5, 0.5),
    n(1, 10, 13.0, 0.5, "Bend"),
    n(1, 7, 13.5, 0.5),
    n(2, 10, 14.0, 0.5, "Pull-off"),
    n(2, 8, 14.5, 0.5),
    n(3, 9, 15.0, 1.0, "Vibrato"),

    // Measure 5: E minor variation
    n(6, 0, 16.0, 1.0),
    n(5, 2, 16.0, 1.0),
    n(6, 0, 17.0, 0.5),
    n(6, 0, 17.5, 0.5),
    n(5, 7, 18.0, 0.5),
    n(4, 5, 18.5, 0.5, "Hammer-on"),
    n(4, 7, 19.0, 0.5),
    n(3, 7, 19.5, 0.5, "Vibrato"),

    // Measure 6: G major to A power progression
    n(6, 3, 20.0, 1.0),
    n(5, 5, 20.0, 1.0),
    n(6, 3, 21.0, 0.5),
    n(6, 5, 21.5, 0.5),
    n(4, 7, 22.0, 0.5),
    n(3, 6, 22.5, 0.5),
    n(2, 5, 23.0, 1.0, "Vibrato"),

    // Measure 7: C5 to D5 ascending surge
    n(5, 3, 24.0, 0.75),
    n(4, 5, 24.0, 0.75),
    n(5, 3, 25.0, 0.5),
    n(5, 5, 25.5, 0.75),
    n(4, 7, 25.5, 0.75),
    n(3, 7, 26.5, 0.5),
    n(2, 7, 27.0, 0.5),
    n(1, 5, 27.5, 0.5),

    // Measure 8: High climactic rock solo resolution
    n(1, 12, 28.0, 1.0, "Vibrato"),
    n(1, 10, 29.0, 0.5),
    n(2, 12, 29.5, 0.5),
    n(2, 10, 30.0, 0.5),
    n(3, 12, 30.5, 0.5),
    n(3, 9, 31.0, 1.0, "Vibrato"),
  ];

  const bassNotes: FretNote[] = [];
  for (let m = 0; m < 8; m++) {
    const baseBeat = m * 4.0;
    let rootString = 4;
    let rootFret = 0;
    if (m === 2 || m === 6) {
      rootString = 3;
      rootFret = 3;
    } else if (m === 3 || m === 7) {
      rootString = 2;
      rootFret = 0;
    }
    for (let eighth = 0; eighth < 8; eighth++) {
      bassNotes.push(n(rootString, rootFret, baseBeat + eighth * 0.5, 0.45));
    }
  }

  const leadTrack: Track = {
    id: createUuid(),
    name: "Lead Guitar",
    instrumentId: "guitar-6string",
    customTuning: GUITAR_STANDARD_TUNING,
    notes,
    isSolo: false,
    isMuted: false,
  };

  const bassTrack: Track = {
    id: createUuid(),
    name: "Synthwave Bass (4-String)",
    instrumentId: "bass-4string",
    customTuning: BASS_STANDARD_TUNING,
    notes: bassNotes,
    isSolo: false,
    isMuted: false,
  };

  return {
    id: "sample-neon-horizon-riff",
    title: "Neon Horizon Riff",
    artist: "FretStack Originals",
    composer: "CodeJourney Music Lab",
    bpm: 80.0,
    timeSignature: { ...COMMON_TIME },
    totalMeasures: 8,
    audioSource: {
      sourceType: "Local Audio File (MP3/WAV)",
      localFilePath: "/audio/NeonHorizonRiff.mp3",
      offsetMilliseconds: 0,
      volume: 0.85,
      isMuted: false,
      recordedBpm: 128.0,
    },
    tracks: [leadTrack, bassTrack],
    version: "1.0",
    createdAt: now,
    modifiedAt: now,
    notesDescription:
      "Energetic modern rock/synthwave riff with power chords, scalar runs, hammer-ons, slides, 4-string bass groove, and synchronized MP3 backing audio.",
  };
}

export function createDeltaSunsetBlues(): FretStackSong {
  const now = new Date().toISOString();
  const notes: FretNote[] = [
    // Measure 1: A Blues shuffle
    n(5, 0, 0.0, 0.67),
    n(4, 2, 0.0, 0.67),
    n(5, 0, 0.67, 0.33),
    n(4, 2, 0.67, 0.33),
    n(5, 0, 1.0, 0.67),
    n(4, 4, 1.0, 0.67),
    n(5, 0, 1.67, 0.33),
    n(4, 4, 1.67, 0.33),
    n(3, 5, 2.0, 0.5, "Bend"),
    n(4, 7, 2.5, 0.5),
    n(3, 7, 3.0, 0.5, "Slide Up"),
    n(2, 8, 3.5, 0.5, "Vibrato"),

    // Measure 2: D Blues shuffle
    n(4, 0, 4.0, 0.67),
    n(3, 2, 4.0, 0.67),
    n(4, 0, 4.67, 0.33),
    n(3, 2, 4.67, 0.33),
    n(1, 5, 6.0, 0.5),
    n(2, 5, 6.5, 0.5),
    n(3, 7, 7.0, 0.5, "Bend"),
    n(4, 7, 7.5, 0.5, "Vibrato"),

    // Measure 3: Return to A
    n(5, 0, 8.0, 0.67),
    n(4, 2, 8.0, 0.67),
    n(5, 0, 8.67, 0.33),
    n(4, 2, 8.67, 0.33),
    n(5, 0, 9.0, 0.67),
    n(4, 4, 9.0, 0.67),
    n(4, 2, 10.0, 0.5),
    n(3, 2, 10.5, 0.5),
    n(2, 5, 11.0, 0.5),
    n(1, 5, 11.5, 0.5, "Vibrato"),

    // Measure 4: A7 groove transition
    n(5, 0, 12.0, 0.67),
    n(4, 2, 12.0, 0.67),
    n(5, 0, 13.0, 0.67),
    n(4, 5, 13.0, 0.67),
    n(3, 5, 14.0, 0.5, "Bend"),
    n(4, 7, 14.5, 0.5),
    n(3, 6, 15.0, 0.5),
    n(2, 5, 15.5, 0.5, "Vibrato"),

    // Measure 5: E7 dominant blues drive
    n(6, 0, 16.0, 0.67),
    n(5, 2, 16.0, 0.67),
    n(6, 0, 17.0, 0.67),
    n(5, 4, 17.0, 0.67),
    n(3, 7, 18.0, 0.5, "Bend"),
    n(2, 8, 18.5, 0.5),
    n(1, 7, 19.0, 0.5),
    n(1, 9, 19.5, 0.5, "Vibrato"),

    // Measure 6: D7 blues relief
    n(4, 0, 20.0, 0.67),
    n(3, 2, 20.0, 0.67),
    n(4, 0, 21.0, 0.67),
    n(3, 4, 21.0, 0.67),
    n(2, 7, 22.0, 0.5),
    n(2, 6, 22.5, 0.5),
    n(2, 5, 23.0, 0.5, "Slide Down"),
    n(3, 5, 23.5, 0.5, "Bend"),

    // Measure 7: A blues resolution
    n(5, 0, 24.0, 1.0),
    n(4, 2, 24.0, 1.0),
    n(4, 7, 25.0, 0.5),
    n(3, 5, 25.5, 0.5),
    n(3, 7, 26.0, 0.5, "Bend"),
    n(2, 5, 26.5, 0.5),
    n(1, 5, 27.0, 0.5, "Vibrato"),
    n(1, 8, 27.5, 0.5, "Bend"),

    // Measure 8: E7 turnaround
    n(1, 5, 28.0, 0.5),
    n(2, 5, 28.0, 0.5),
    n(1, 4, 28.5, 0.5),
    n(2, 4, 28.5, 0.5),
    n(1, 3, 29.0, 0.5),
    n(2, 3, 29.0, 0.5),
    n(1, 2, 29.5, 0.5),
    n(2, 2, 29.5, 0.5),
    n(5, 2, 30.0, 0.5),
    n(6, 0, 30.5, 0.5),
    n(5, 2, 31.0, 1.0),
    n(4, 1, 31.0, 1.0),
    n(3, 2, 31.0, 1.0),
    n(2, 0, 31.0, 1.0),
  ];

  const bassNotes: FretNote[] = [];
  for (let m = 0; m < 8; m++) {
    const baseBeat = m * 4.0;
    let rootString = 3;
    if (m === 2 || m === 5) rootString = 2;
    else if (m === 4 || m === 7) rootString = 4;
    bassNotes.push(n(rootString, 0, baseBeat + 0.0, 0.8));
    bassNotes.push(n(rootString, 4, baseBeat + 1.0, 0.8));
    bassNotes.push(n(rootString === 4 ? 3 : 2, 2, baseBeat + 2.0, 0.8));
    bassNotes.push(n(rootString === 4 ? 3 : 2, 4, baseBeat + 3.0, 0.8));
  }

  return {
    id: "sample-delta-sunset-blues",
    title: "Delta Sunset Blues",
    artist: "FretStack Originals",
    composer: "CodeJourney Music Lab",
    bpm: 92.0,
    timeSignature: { ...COMMON_TIME },
    totalMeasures: 8,
    audioSource: {
      sourceType: "Local Audio File (MP3/WAV)",
      localFilePath: "/audio/DeltaSunsetBlues.mp3",
      offsetMilliseconds: 0,
      volume: 0.85,
      isMuted: false,
      recordedBpm: 92.0,
    },
    tracks: [
      {
        id: createUuid(),
        name: "Blues Guitar",
        instrumentId: "guitar-6string",
        customTuning: GUITAR_STANDARD_TUNING,
        notes,
        isSolo: false,
        isMuted: false,
      },
      {
        id: createUuid(),
        name: "Blues Bass (4-String)",
        instrumentId: "bass-4string",
        customTuning: BASS_STANDARD_TUNING,
        notes: bassNotes,
        isSolo: false,
        isMuted: false,
      },
    ],
    version: "1.0",
    createdAt: now,
    modifiedAt: now,
    notesDescription:
      "Classic 12-bar blues shuffle groove with authentic bends, swing timing, vibrato, 4-string walking bass, and synchronized swing MP3 backing audio.",
  };
}

export function createAcousticRaindrops(): FretStackSong {
  const now = new Date().toISOString();
  const notes: FretNote[] = [
    // M1: C major
    n(5, 3, 0.0, 1.0),
    n(4, 2, 0.5, 0.5),
    n(3, 0, 1.0, 0.5),
    n(2, 1, 1.5, 0.5),
    n(1, 0, 2.0, 0.5),
    n(2, 1, 2.5, 0.5),
    // M2: Am
    n(5, 0, 3.0, 1.0),
    n(4, 2, 3.5, 0.5),
    n(3, 2, 4.0, 0.5),
    n(2, 1, 4.5, 0.5),
    n(1, 0, 5.0, 0.5),
    n(2, 1, 5.5, 0.5),
    // M3: F
    n(4, 3, 6.0, 1.0),
    n(3, 2, 6.5, 0.5),
    n(2, 1, 7.0, 0.5),
    n(1, 1, 7.5, 0.5),
    n(2, 1, 8.0, 0.5),
    n(3, 2, 8.5, 0.5),
    // M4: G
    n(6, 3, 9.0, 1.0),
    n(4, 0, 9.5, 0.5),
    n(3, 0, 10.0, 0.5),
    n(2, 0, 10.5, 0.5),
    n(1, 3, 11.0, 1.0),
    // M5: Em
    n(6, 0, 12.0, 1.0),
    n(4, 2, 12.5, 0.5),
    n(3, 0, 13.0, 0.5),
    n(2, 0, 13.5, 0.5),
    n(1, 0, 14.0, 0.5),
    n(2, 0, 14.5, 0.5),
    // M6: F pickup
    n(4, 3, 15.0, 1.0),
    n(3, 2, 15.5, 0.5),
    n(2, 1, 16.0, 0.5),
    n(1, 1, 16.5, 0.5),
    n(1, 3, 17.0, 0.5),
    n(1, 1, 17.5, 0.5),
    // M7: Dm7
    n(4, 0, 18.0, 1.0),
    n(3, 2, 18.5, 0.5),
    n(2, 1, 19.0, 0.5),
    n(1, 1, 19.5, 0.5),
    n(2, 3, 20.0, 0.5),
    n(3, 2, 20.5, 0.5),
    // M8: G7sus4 -> C
    n(6, 3, 21.0, 1.0),
    n(4, 0, 21.5, 0.5),
    n(3, 0, 22.0, 0.5),
    n(2, 1, 22.5, 0.5),
    n(1, 0, 23.0, 0.5),
    n(5, 3, 23.5, 1.5),
  ];

  const bassPitches: Array<[number, number]> = [
    [3, 3],
    [3, 0],
    [4, 1],
    [4, 3],
    [3, 3],
    [4, 0],
    [3, 0],
    [3, 3],
  ];
  const bassNotes = bassPitches.map(([str, frt], m) =>
    n(str, frt, m * 3.0, 2.5, "Vibrato")
  );

  return {
    id: "sample-acoustic-raindrops",
    title: "Acoustic Raindrops",
    artist: "FretStack Originals",
    composer: "CodeJourney Music Lab",
    bpm: 100.0,
    timeSignature: { ...WALTZ_TIME },
    totalMeasures: 8,
    audioSource: {
      sourceType: "Local Audio File (MP3/WAV)",
      localFilePath: "/audio/AcousticRaindrops.mp3",
      offsetMilliseconds: 0,
      volume: 0.85,
      isMuted: false,
      recordedBpm: 100.0,
    },
    tracks: [
      {
        id: createUuid(),
        name: "Acoustic Fingerpicking",
        instrumentId: "guitar-6string",
        customTuning: GUITAR_STANDARD_TUNING,
        notes,
        isSolo: false,
        isMuted: false,
      },
      {
        id: createUuid(),
        name: "Acoustic Bass (4-String)",
        instrumentId: "bass-4string",
        customTuning: BASS_STANDARD_TUNING,
        notes: bassNotes,
        isSolo: false,
        isMuted: false,
      },
    ],
    version: "1.0",
    createdAt: now,
    modifiedAt: now,
    notesDescription:
      "Soothing 3/4 fingerstyle acoustic waltz progression with 4-string acoustic bass accompaniment and synchronized MP3 backing audio.",
  };
}

export function createTwinkleTwinkleLittleStar(): FretStackSong {
  const now = new Date().toISOString();
  const notes: FretNote[] = [
    // M1
    n(5, 3, 0.0, 2.0),
    n(2, 1, 0.0, 1.0, "Normal", "Twin-"),
    n(2, 1, 1.0, 1.0, "Normal", "kle"),
    n(4, 2, 2.0, 2.0),
    n(1, 3, 2.0, 1.0, "Normal", "twin-"),
    n(1, 3, 3.0, 1.0, "Normal", "kle"),
    // M2
    n(4, 3, 4.0, 2.0),
    n(1, 5, 4.0, 1.0, "Normal", "lit-"),
    n(1, 5, 5.0, 1.0, "Normal", "tle"),
    n(5, 3, 6.0, 2.0),
    n(1, 3, 6.0, 2.0, "Vibrato", "star,"),
    // M3
    n(4, 3, 8.0, 2.0),
    n(1, 1, 8.0, 1.0, "Normal", "How"),
    n(1, 1, 9.0, 1.0, "Normal", "I"),
    n(5, 3, 10.0, 2.0),
    n(1, 0, 10.0, 1.0, "Normal", "won-"),
    n(1, 0, 11.0, 1.0, "Normal", "der"),
    // M4
    n(4, 0, 12.0, 2.0),
    n(2, 3, 12.0, 1.0, "Normal", "what"),
    n(2, 3, 13.0, 1.0, "Normal", "you"),
    n(5, 3, 14.0, 2.0),
    n(2, 1, 14.0, 2.0, "Vibrato", "are."),
    // M5
    n(5, 3, 16.0, 2.0),
    n(1, 3, 16.0, 1.0, "Normal", "Up"),
    n(1, 3, 17.0, 1.0, "Normal", "a-"),
    n(4, 3, 18.0, 2.0),
    n(1, 1, 18.0, 1.0, "Normal", "bove"),
    n(1, 1, 19.0, 1.0, "Normal", "the"),
    // M6
    n(5, 3, 20.0, 2.0),
    n(1, 0, 20.0, 1.0, "Normal", "world"),
    n(1, 0, 21.0, 1.0, "Normal", "so"),
    n(4, 0, 22.0, 2.0),
    n(2, 3, 22.0, 2.0, "Vibrato", "high,"),
    // M7
    n(5, 3, 24.0, 2.0),
    n(1, 3, 24.0, 1.0, "Normal", "Like"),
    n(1, 3, 25.0, 1.0, "Normal", "a"),
    n(4, 3, 26.0, 2.0),
    n(1, 1, 26.0, 1.0, "Normal", "dia-"),
    n(1, 1, 27.0, 1.0, "Normal", "mond"),
    // M8
    n(5, 3, 28.0, 2.0),
    n(1, 0, 28.0, 1.0, "Normal", "in"),
    n(1, 0, 29.0, 1.0, "Normal", "the"),
    n(4, 0, 30.0, 2.0),
    n(2, 3, 30.0, 2.0, "Vibrato", "sky."),
    // M9
    n(5, 3, 32.0, 2.0),
    n(2, 1, 32.0, 1.0, "Normal", "Twin-"),
    n(2, 1, 33.0, 1.0, "Normal", "kle"),
    n(4, 2, 34.0, 2.0),
    n(1, 3, 34.0, 1.0, "Normal", "twin-"),
    n(1, 3, 35.0, 1.0, "Normal", "kle"),
    // M10
    n(4, 3, 36.0, 2.0),
    n(1, 5, 36.0, 1.0, "Normal", "lit-"),
    n(1, 5, 37.0, 1.0, "Normal", "tle"),
    n(5, 3, 38.0, 2.0),
    n(1, 3, 38.0, 2.0, "Vibrato", "star,"),
    // M11
    n(4, 3, 40.0, 2.0),
    n(1, 1, 40.0, 1.0, "Normal", "How"),
    n(1, 1, 41.0, 1.0, "Normal", "I"),
    n(5, 3, 42.0, 2.0),
    n(1, 0, 42.0, 1.0, "Normal", "won-"),
    n(1, 0, 43.0, 1.0, "Normal", "der"),
    // M12
    n(4, 0, 44.0, 2.0),
    n(2, 3, 44.0, 1.0, "Normal", "what"),
    n(2, 3, 45.0, 1.0, "Normal", "you"),
    n(5, 3, 46.0, 2.0),
    n(2, 1, 46.0, 2.0, "Vibrato", "are."),
    // M13 Outro
    n(5, 3, 48.0, 3.0),
    n(4, 2, 48.0, 3.0),
    n(3, 0, 48.0, 3.0),
    n(2, 1, 48.0, 3.0),
    n(1, 0, 48.0, 3.0, "Vibrato", "★"),
  ];

  const bassNotes: FretNote[] = [
    n(3, 3, 0.0, 2.0),
    n(3, 3, 2.0, 2.0),
    n(4, 3, 4.0, 2.0),
    n(4, 3, 6.0, 2.0),
    n(3, 0, 8.0, 2.0),
    n(3, 0, 10.0, 2.0),
    n(4, 3, 12.0, 2.0),
    n(3, 3, 14.0, 2.0),
    n(4, 1, 16.0, 2.0),
    n(4, 1, 18.0, 2.0),
    n(4, 0, 20.0, 2.0),
    n(2, 0, 22.0, 2.0),
    n(3, 3, 24.0, 2.0),
    n(4, 3, 26.0, 2.0),
    n(4, 0, 28.0, 2.0),
    n(2, 0, 30.0, 2.0),
    n(3, 3, 32.0, 2.0),
    n(3, 3, 34.0, 2.0),
    n(4, 3, 36.0, 2.0),
    n(4, 3, 38.0, 2.0),
    n(3, 0, 40.0, 2.0),
    n(3, 0, 42.0, 2.0),
    n(4, 3, 44.0, 2.0),
    n(3, 3, 46.0, 2.0),
    n(3, 3, 48.0, 4.0, "Vibrato"),
  ];

  return {
    id: "sample-twinkle-twinkle",
    title: "Twinkle Twinkle Little Star",
    artist: "Traditional Nursery Rhyme",
    composer: "Jane Taylor / W. A. Mozart",
    bpm: 100.0,
    timeSignature: { ...COMMON_TIME },
    totalMeasures: 14,
    audioSource: {
      sourceType: "Synthesizer Only",
      webUrl:
        "https://www.youtube.com/results?search_query=twinkle+twinkle+little+star+guitar+solo",
      offsetMilliseconds: 0,
      volume: 0.9,
      isMuted: false,
    },
    tracks: [
      {
        id: createUuid(),
        name: "Acoustic / Lead Guitar",
        instrumentId: "guitar-6string",
        customTuning: GUITAR_STANDARD_TUNING,
        notes,
        isSolo: false,
        isMuted: false,
      },
      {
        id: createUuid(),
        name: "Electric Bass (4-String)",
        instrumentId: "bass-4string",
        customTuning: BASS_STANDARD_TUNING,
        notes: bassNotes,
        isSolo: false,
        isMuted: false,
      },
    ],
    version: "1.0",
    createdAt: now,
    modifiedAt: now,
    notesDescription:
      "Classic nursery rhyme arranged for acoustic guitar and 4-string electric bass in C Major with lyrics.",
  };
}

export function getAllSampleSongs(): FretStackSong[] {
  return [
    createNeonHorizonRiff(),
    createDeltaSunsetBlues(),
    createAcousticRaindrops(),
    createTwinkleTwinkleLittleStar(),
  ];
}
