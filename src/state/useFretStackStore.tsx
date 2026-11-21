import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { sharedAudioEngine } from "../audio/audioEngine";
import {
  extractYouTubeVideoId,
  sharedYouTubeEngine,
} from "../audio/youTubeAudioEngine";
import {
  AlbumCoverPreset,
  createDefaultDemoAlbum,
  createNewAlbum,
  FretStackAlbum,
  loadPersistedAlbums,
  savePersistedAlbums,
} from "../core/albumModel";
import {
  ChordDefinition,
  chordFretsByString,
  loadCustomChords,
  saveCustomChords,
} from "../core/chordModel";
import { getInstrumentById, InstrumentSpec } from "../core/instrumentSpec";
import {
  beatsPerMeasure,
  GUITAR_STANDARD_TUNING,
  pitchFrequency,
  pitchForStringAndFret,
  Tuning,
} from "../core/musicTheory";
import { createNeonHorizonRiff } from "../core/sampleSongs";
import {
  createEmptySong,
  createFretNote,
  createUuid,
  FretNote,
  FretStackSong,
  getEffectiveAudioBaseBpm,
  getTotalBeats,
  Track,
} from "../core/songModel";

export type AppScreen = "instrumentHub" | "runnerStudio";

interface FretStackContextValue {
  currentScreen: AppScreen;
  setCurrentScreen: (screen: AppScreen) => void;

  albums: FretStackAlbum[];
  activeAlbumId: string;
  setActiveAlbumId: (id: string) => void;

  song: FretStackSong;
  setSong: React.Dispatch<React.SetStateAction<FretStackSong>>;
  currentTrackIndex: number;
  setCurrentTrackIndex: (idx: number) => void;
  currentTrack: Track | undefined;
  currentInstrument: InstrumentSpec;
  currentTuning: Tuning;

  currentBeat: number;
  setCurrentBeat: (beat: number) => void;
  isPlaying: boolean;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  isMetronomeEnabled: boolean;
  setIsMetronomeEnabled: (enabled: boolean) => void;
  isCountInEnabled: boolean;
  setIsCountInEnabled: (enabled: boolean) => void;
  isSynthEnabled: boolean;
  setIsSynthEnabled: (enabled: boolean) => void;
  leadInBars: number;
  leadInBeats: number;
  startBeat: number;
  pixelsPerBeat: number;
  setPixelsPerBeat: (ppb: number) => void;

  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  selectedNote: FretNote | null;
  selectedInstrumentId: string;
  selectInstrument: (instrumentId: string) => void;

  activeStringNumber: number;
  setActiveStringNumber: (s: number) => void;
  activeFretNumber: number;
  setActiveFretNumber: (f: number) => void;
  activeNoteDurationBeats: number;
  setActiveNoteDurationBeats: (d: number) => void;

  customChords: ChordDefinition[];
  addCustomChord: (chord: ChordDefinition) => void;
  deleteCustomChord: (id: string) => void;

  // Transport & Playback
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  rewind: () => void;
  seek: (beat: number) => void;

  // Editing
  auditionFret: (stringNumber: number, fret: number) => void;
  auditionChord: (chord: ChordDefinition) => void;
  addNoteAt: (stringNumber: number, fret: number, beat: number) => void;
  addChordAtPlayhead: (chord: ChordDefinition, durationBeats?: number) => void;
  moveNote: (noteId: string, newString: number, newBeat: number) => void;
  resizeNote: (noteId: string, newDuration: number) => void;
  updateSelectedNote: (patch: Partial<FretNote>) => void;
  deleteSelectedNote: () => void;
  nudgeSelectedNote: (deltaString: number, deltaBeat: number) => void;
  adjustSelectedNoteLength: (deltaBeats: number) => void;

  // Audio source
  setCustomAudioUrl: (url: string, displayName: string) => void;

  // Song & Album management
  loadSongIntoStudio: (song: FretStackSong, instrumentId?: string) => void;
  createAndOpenNewSong: (title?: string, instrumentId?: string) => void;
  saveCurrentSongToActiveAlbum: () => void;
  createAlbum: (name: string, subtitle: string, preset: AlbumCoverPreset) => void;
  updateAlbum: (id: string, patch: Partial<FretStackAlbum>) => void;
  deleteAlbum: (id: string) => void;
  restoreAlbums: (albums: FretStackAlbum[]) => void;
  resetDemoAlbum: () => void;
}

const FretStackContext = createContext<FretStackContextValue | null>(null);

function resolveAudioUrl(localFilePath?: string, customObjectUrl?: string): string | null {
  if (customObjectUrl) return customObjectUrl;
  if (!localFilePath) return null;
  if (localFilePath.startsWith("/audio/") || localFilePath.startsWith("http") || localFilePath.startsWith("blob:")) {
    return localFilePath;
  }
  const lower = localFilePath.toLowerCase();
  if (lower.includes("neonhorizonriff")) return "/audio/NeonHorizonRiff.mp3";
  if (lower.includes("deltasunsetblues")) return "/audio/DeltaSunsetBlues.mp3";
  if (lower.includes("acousticraindrops")) return "/audio/AcousticRaindrops.mp3";
  return null;
}

export const FretStackProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [albums, setAlbums] = useState<FretStackAlbum[]>(() => loadPersistedAlbums());
  const [activeAlbumId, setActiveAlbumId] = useState<string>(
    () => loadPersistedAlbums()[0]?.id ?? createDefaultDemoAlbum().id
  );

  const [song, setSong] = useState<FretStackSong>(() => {
    const initialAlbums = loadPersistedAlbums();
    return initialAlbums[0]?.songs[0] ?? createNeonHorizonRiff();
  });

  const [currentScreen, setCurrentScreen] = useState<AppScreen>("instrumentHub");
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMetronomeEnabled, setIsMetronomeEnabled] = useState<boolean>(false);
  const [isCountInEnabled, setIsCountInEnabled] = useState<boolean>(true);
  const [isSynthEnabled, setIsSynthEnabled] = useState<boolean>(true);
  const [leadInBars] = useState<number>(1.5);
  const [pixelsPerBeat, setPixelsPerBeat] = useState<number>(110);

  const isYouTubeSong =
    song.audioSource.sourceType === "External Stream / YouTube Link";
  const leadInBeats = useMemo(
    () =>
      !isYouTubeSong && isCountInEnabled
        ? leadInBars * beatsPerMeasure(song.timeSignature)
        : 0,
    [isYouTubeSong, isCountInEnabled, leadInBars, song.timeSignature]
  );
  const startBeat = -leadInBeats;

  const [currentBeat, setCurrentBeatState] = useState<number>(-6.0);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>("guitar-6string");
  const [activeStringNumber, setActiveStringNumber] = useState<number>(1);
  const [activeFretNumber, setActiveFretNumber] = useState<number>(0);
  const [activeNoteDurationBeats, setActiveNoteDurationBeats] = useState<number>(1.0);
  const [customChords, setCustomChords] = useState<ChordDefinition[]>(() => loadCustomChords());
  const [customAudioUrls, setCustomAudioUrls] = useState<Record<string, string>>({});

  // Refs for rAF playback loop
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const currentBeatRef = useRef(currentBeat);
  currentBeatRef.current = currentBeat;
  const songRef = useRef(song);
  songRef.current = song;
  const trackIdxRef = useRef(currentTrackIndex);
  trackIdxRef.current = currentTrackIndex;
  const playbackSpeedRef = useRef(playbackSpeed);
  playbackSpeedRef.current = playbackSpeed;
  const metronomeRef = useRef(isMetronomeEnabled);
  metronomeRef.current = isMetronomeEnabled;
  const synthEnabledRef = useRef(isSynthEnabled);
  synthEnabledRef.current = isSynthEnabled;
  const playedNoteIdsRef = useRef<Set<string>>(new Set());
  const lastMetronomeBeatRef = useRef<number>(-100);
  const rafIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const currentTrack = song.tracks[currentTrackIndex];
  const currentInstrument = useMemo(
    () => getInstrumentById(currentTrack?.instrumentId ?? selectedInstrumentId),
    [currentTrack?.instrumentId, selectedInstrumentId]
  );
  const currentTuning = useMemo(
    () => currentTrack?.customTuning ?? currentInstrument.defaultTuning ?? GUITAR_STANDARD_TUNING,
    [currentTrack?.customTuning, currentInstrument.defaultTuning]
  );

  const selectedNote = useMemo(() => {
    if (!selectedNoteId || !currentTrack) return null;
    return currentTrack.notes.find((n) => n.id === selectedNoteId) ?? null;
  }, [selectedNoteId, currentTrack]);

  // Persist albums whenever they change
  useEffect(() => {
    savePersistedAlbums(albums);
  }, [albums]);

  // Sync backing audio rate & volume when song/speed changes
  useEffect(() => {
    const baseBpm = getEffectiveAudioBaseBpm(song);
    const rate = baseBpm > 0 ? (song.bpm / baseBpm) * playbackSpeed : playbackSpeed;
    sharedAudioEngine.setPlaybackRate(rate);
    sharedAudioEngine.setMusicVolume(song.audioSource.volume);
    sharedAudioEngine.setMusicMuted(song.audioSource.isMuted);

    if (song.audioSource.sourceType === "External Stream / YouTube Link") {
      sharedYouTubeEngine.setPlaybackRate(playbackSpeed);
      sharedYouTubeEngine.setVolume(song.audioSource.volume);
      sharedYouTubeEngine.setMuted(song.audioSource.isMuted);
    }
  }, [song, playbackSpeed]);

  // Load backing audio URL when song audioSource changes
  useEffect(() => {
    if (song.audioSource.sourceType === "Local Audio File (MP3/WAV)") {
      sharedYouTubeEngine.clear();
      const url = resolveAudioUrl(
        song.audioSource.localFilePath,
        customAudioUrls[song.id]
      );
      sharedAudioEngine.loadBackingAudioUrl(url);
    } else if (song.audioSource.sourceType === "External Stream / YouTube Link") {
      sharedAudioEngine.unloadBackingAudio();
      const videoId = extractYouTubeVideoId(song.audioSource.webUrl);
      if (videoId) {
        const baseBpm = getEffectiveAudioBaseBpm(song);
        const offsetSec = song.audioSource.offsetMilliseconds / 1000.0;
        const initialSec = Math.max(
          0,
          (currentBeatRef.current / baseBpm) * 60.0 + offsetSec
        );
        sharedYouTubeEngine.loadVideo(
          videoId,
          initialSec,
          isPlayingRef.current
        );
      } else {
        sharedYouTubeEngine.clear();
      }
    } else {
      sharedAudioEngine.unloadBackingAudio();
      sharedYouTubeEngine.clear();
    }
  }, [
    song.id,
    song.audioSource.sourceType,
    song.audioSource.localFilePath,
    song.audioSource.webUrl,
    customAudioUrls,
  ]);

  const setCurrentBeat = useCallback((beat: number) => {
    const prev = currentBeatRef.current;
    if (beat < prev || !isPlayingRef.current) {
      playedNoteIdsRef.current.clear();
      lastMetronomeBeatRef.current = Math.floor(beat) - 1;
    }
    currentBeatRef.current = beat;
    setCurrentBeatState(beat);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    sharedAudioEngine.pauseBacking();
    sharedYouTubeEngine.pause();
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const seek = useCallback(
    (targetBeat: number) => {
      const total = getTotalBeats(songRef.current);
      const clamped = Math.max(startBeat, Math.min(total, targetBeat));
      playedNoteIdsRef.current.clear();
      lastMetronomeBeatRef.current = Math.floor(clamped) - 1;
      currentBeatRef.current = clamped;
      setCurrentBeatState(clamped);

      if (sharedAudioEngine.hasBackingAudio) {
        const baseBpm = getEffectiveAudioBaseBpm(songRef.current);
        const offsetSec = songRef.current.audioSource.offsetMilliseconds / 1000.0;
        const audioSec = Math.max(0, (clamped / baseBpm) * 60.0 + offsetSec);
        if (clamped < 0) {
          sharedAudioEngine.pauseBacking();
          sharedAudioEngine.seekBacking(0);
        } else {
          sharedAudioEngine.seekBacking(audioSec);
          if (isPlayingRef.current) {
            sharedAudioEngine.playBacking(audioSec);
          }
        }
      } else if (
        songRef.current.audioSource.sourceType === "External Stream / YouTube Link"
      ) {
        const baseBpm = getEffectiveAudioBaseBpm(songRef.current);
        const offsetSec = songRef.current.audioSource.offsetMilliseconds / 1000.0;
        const audioSec = Math.max(0, (clamped / baseBpm) * 60.0 + offsetSec);
        sharedYouTubeEngine.seek(audioSec);
        if (isPlayingRef.current) {
          sharedYouTubeEngine.play(audioSec);
        }
      }
    },
    [startBeat]
  );

  const rewind = useCallback(() => {
    pause();
    seek(startBeat);
  }, [pause, seek, startBeat]);

  const play = useCallback(() => {
    if (isPlayingRef.current) return;
    const total = getTotalBeats(songRef.current);
    if (currentBeatRef.current >= total) {
      seek(startBeat);
    }

    const isYT =
      songRef.current.audioSource.sourceType === "External Stream / YouTube Link";

    if (isYT && currentBeatRef.current < 0) {
      currentBeatRef.current = 0;
      setCurrentBeatState(0);
    }

    playedNoteIdsRef.current.clear();
    lastMetronomeBeatRef.current = Math.floor(currentBeatRef.current) - 1;
    setIsPlaying(true);
    isPlayingRef.current = true;
    lastFrameTimeRef.current = performance.now();

    if (isYT) {
      const baseBpm = getEffectiveAudioBaseBpm(songRef.current);
      const offsetSec = songRef.current.audioSource.offsetMilliseconds / 1000.0;
      const audioSec = Math.max(
        0,
        (currentBeatRef.current / baseBpm) * 60.0 + offsetSec
      );
      sharedYouTubeEngine.play(audioSec);
    }
  }, [seek, startBeat]);

  const togglePlayPause = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [pause, play]);

  // Bi-directional YouTube state synchronization
  useEffect(() => {
    const unsubscribe = sharedYouTubeEngine.subscribe((ytState) => {
      if (
        songRef.current.audioSource.sourceType !== "External Stream / YouTube Link"
      ) {
        return;
      }
      if (ytState.isUserAction) {
        if (ytState.isPlaying && !isPlayingRef.current) {
          setIsPlaying(true);
          isPlayingRef.current = true;
          lastFrameTimeRef.current = performance.now();
        } else if (!ytState.isPlaying && isPlayingRef.current && !ytState.isBuffering) {
          pause();
        }
      } else if (ytState.isEnded && isPlayingRef.current) {
        pause();
      }
    });
    return () => {
      unsubscribe();
    };
  }, [pause]);

  // rAF Playback Loop
  useEffect(() => {
    if (!isPlaying) return;

    const tick = (now: number) => {
      if (!isPlayingRef.current) return;
      const dt = Math.min(0.1, Math.max(0.001, (now - lastFrameTimeRef.current) / 1000.0));
      lastFrameTimeRef.current = now;

      const curSong = songRef.current;
      const beatsPerSec = (curSong.bpm / 60.0) * playbackSpeedRef.current;
      const prevBeat = currentBeatRef.current;
      const nextBeat = prevBeat + dt * beatsPerSec;
      const total = getTotalBeats(curSong);

      // Metronome clicks on integer beats
      const intBeat = Math.floor(nextBeat);
      if (intBeat > lastMetronomeBeatRef.current) {
        lastMetronomeBeatRef.current = intBeat;
        if (metronomeRef.current || nextBeat < 0) {
          const measureLen = beatsPerMeasure(curSong.timeSignature);
          const beatInMeasure = ((intBeat % measureLen) + measureLen) % measureLen;
          sharedAudioEngine.triggerMetronome(beatInMeasure === 0);
        }
      }

      // Backing audio sync
      if (
        sharedAudioEngine.hasBackingAudio &&
        curSong.audioSource.sourceType === "Local Audio File (MP3/WAV)"
      ) {
        const baseBpm = getEffectiveAudioBaseBpm(curSong);
        const offsetSec = curSong.audioSource.offsetMilliseconds / 1000.0;
        const expectedAudioSec = (nextBeat / baseBpm) * 60.0 + offsetSec;
        if (expectedAudioSec >= 0) {
          if (!sharedAudioEngine.isBackingPlaying) {
            sharedAudioEngine.playBacking(expectedAudioSec);
          } else {
            const drift = Math.abs(sharedAudioEngine.currentBackingTimeSeconds - expectedAudioSec);
            if (drift > 0.08) {
              sharedAudioEngine.seekBacking(expectedAudioSec);
            }
          }
        }
      } else if (
        curSong.audioSource.sourceType === "External Stream / YouTube Link" &&
        sharedYouTubeEngine.isReady
      ) {
        const baseBpm = getEffectiveAudioBaseBpm(curSong);
        const offsetSec = curSong.audioSource.offsetMilliseconds / 1000.0;
        const expectedAudioSec = Math.max(0, (nextBeat / baseBpm) * 60.0 + offsetSec);
        if (!sharedYouTubeEngine.isPlayingBack) {
          sharedYouTubeEngine.play(expectedAudioSec);
        } else {
          const drift = Math.abs(sharedYouTubeEngine.currentTime - expectedAudioSec);
          if (drift > 0.45) {
            sharedYouTubeEngine.seek(expectedAudioSec);
          }
        }
      }

      // Trigger Karplus-Strong notes on active tracks
      const hasAnySolo = curSong.tracks.some((t) => t.isSolo);
      const shouldPlaySynth =
        synthEnabledRef.current &&
        (curSong.audioSource.sourceType === "Synthesizer Only" ||
          curSong.audioSource.isMuted ||
          (curSong.audioSource.sourceType === "Local Audio File (MP3/WAV)" &&
            !sharedAudioEngine.hasBackingAudio) ||
          curSong.audioSource.sourceType === "External Stream / YouTube Link");

      if (shouldPlaySynth) {
        curSong.tracks.forEach((track) => {
          if (track.isMuted) return;
          if (hasAnySolo && !track.isSolo) return;
          const tuning =
            track.customTuning ??
            getInstrumentById(track.instrumentId).defaultTuning;
          for (const note of track.notes) {
            if (
              note.beat <= nextBeat &&
              note.beat >= prevBeat - 0.08 &&
              !playedNoteIdsRef.current.has(note.id)
            ) {
              playedNoteIdsRef.current.add(note.id);
              if (note.technique !== "Muted Note") {
                const pitch = pitchForStringAndFret(
                  tuning,
                  note.stringNumber,
                  note.fret
                );
                if (pitch) {
                  const durSec = (note.durationBeats / curSong.bpm) * 60.0;
                  sharedAudioEngine.triggerString(
                    pitchFrequency(pitch),
                    note.stringNumber,
                    0.85,
                    durSec
                  );
                }
              }
            }
          }
        });
      }

      if (nextBeat >= total) {
        currentBeatRef.current = total;
        setCurrentBeatState(total);
        pause();
        return;
      }

      currentBeatRef.current = nextBeat;
      setCurrentBeatState(nextBeat);
      rafIdRef.current = requestAnimationFrame(tick);
    };

    lastFrameTimeRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isPlaying, pause]);

  // Auditioning
  const auditionFret = useCallback(
    (stringNumber: number, fret: number) => {
      const pitch = pitchForStringAndFret(currentTuning, stringNumber, fret);
      if (pitch) {
        sharedAudioEngine.triggerString(
          pitchFrequency(pitch),
          stringNumber,
          0.9,
          1.2
        );
      }
    },
    [currentTuning]
  );

  const auditionChord = useCallback(
    (chord: ChordDefinition) => {
      const map = chordFretsByString(chord, currentTuning.pitches.length);
      const entries = Object.entries(map).sort(
        (a, b) => Number(b[0]) - Number(a[0])
      );
      entries.forEach(([strNum, fret], idx) => {
        setTimeout(() => {
          const pitch = pitchForStringAndFret(
            currentTuning,
            Number(strNum),
            fret
          );
          if (pitch) {
            sharedAudioEngine.triggerString(
              pitchFrequency(pitch),
              Number(strNum),
              0.85,
              1.6
            );
          }
        }, idx * 28);
      });
    },
    [currentTuning]
  );

  // Song Editing
  const mutateCurrentTrackNotes = useCallback(
    (updater: (notes: FretNote[]) => FretNote[]) => {
      setSong((prev) => {
        const tracks = prev.tracks.map((t, idx) =>
          idx === trackIdxRef.current ? { ...t, notes: updater(t.notes) } : t
        );
        return {
          ...prev,
          tracks,
          modifiedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  const addNoteAt = useCallback(
    (stringNumber: number, fret: number, beat: number) => {
      const snappedBeat = Math.max(0, Math.round(beat * 8) / 8);
      const newNote = createFretNote({
        stringNumber,
        fret,
        beat: snappedBeat,
        durationBeats: activeNoteDurationBeats,
      });
      mutateCurrentTrackNotes((notes) => {
        const filtered = notes.filter(
          (n) =>
            !(
              n.stringNumber === stringNumber &&
              Math.abs(n.beat - snappedBeat) < 0.05
            )
        );
        return [...filtered, newNote];
      });
      setSelectedNoteId(newNote.id);
      setActiveStringNumber(stringNumber);
      setActiveFretNumber(fret);
      auditionFret(stringNumber, fret);
    },
    [activeNoteDurationBeats, auditionFret, mutateCurrentTrackNotes]
  );

  const addChordAtPlayhead = useCallback(
    (chord: ChordDefinition, durationBeats?: number) => {
      const beat = Math.max(0, Math.round(currentBeatRef.current * 4) / 4);
      const dur = durationBeats ?? chord.defaultDurationBeats ?? activeNoteDurationBeats;
      const map = chordFretsByString(chord, currentTuning.pitches.length);
      const newNotes: FretNote[] = Object.entries(map).map(([str, fret]) =>
        createFretNote({
          stringNumber: Number(str),
          fret,
          beat,
          durationBeats: dur,
          chordName: chord.name,
        })
      );
      if (newNotes.length === 0) return;

      mutateCurrentTrackNotes((notes) => {
        const filtered = notes.filter(
          (n) => !(Math.abs(n.beat - beat) < 0.05 && map[n.stringNumber] !== undefined)
        );
        return [...filtered, ...newNotes];
      });
      setSelectedNoteId(newNotes[0].id);
      auditionChord(chord);
    },
    [activeNoteDurationBeats, auditionChord, currentTuning.pitches.length, mutateCurrentTrackNotes]
  );

  const moveNote = useCallback(
    (noteId: string, newString: number, newBeat: number) => {
      const clampedStr = Math.max(1, Math.min(currentTuning.pitches.length, newString));
      const clampedBeat = Math.max(0, Math.round(newBeat * 8) / 8);
      mutateCurrentTrackNotes((notes) =>
        notes.map((n) =>
          n.id === noteId
            ? { ...n, stringNumber: clampedStr, beat: clampedBeat }
            : n
        )
      );
    },
    [currentTuning.pitches.length, mutateCurrentTrackNotes]
  );

  const resizeNote = useCallback(
    (noteId: string, newDuration: number) => {
      const clamped = Math.max(0.125, Math.round(newDuration * 8) / 8);
      mutateCurrentTrackNotes((notes) =>
        notes.map((n) =>
          n.id === noteId ? { ...n, durationBeats: clamped } : n
        )
      );
    },
    [mutateCurrentTrackNotes]
  );

  const updateSelectedNote = useCallback(
    (patch: Partial<FretNote>) => {
      if (!selectedNoteId) return;
      mutateCurrentTrackNotes((notes) =>
        notes.map((n) => (n.id === selectedNoteId ? { ...n, ...patch } : n))
      );
    },
    [mutateCurrentTrackNotes, selectedNoteId]
  );

  const deleteSelectedNote = useCallback(() => {
    if (!selectedNoteId) return;
    mutateCurrentTrackNotes((notes) => notes.filter((n) => n.id !== selectedNoteId));
    setSelectedNoteId(null);
  }, [mutateCurrentTrackNotes, selectedNoteId]);

  const nudgeSelectedNote = useCallback(
    (deltaString: number, deltaBeat: number) => {
      if (!selectedNoteId || !currentTrack) return;
      const note = currentTrack.notes.find((n) => n.id === selectedNoteId);
      if (!note) return;
      moveNote(
        note.id,
        note.stringNumber + deltaString,
        note.beat + deltaBeat
      );
    },
    [currentTrack, moveNote, selectedNoteId]
  );

  const adjustSelectedNoteLength = useCallback(
    (deltaBeats: number) => {
      if (!selectedNoteId || !currentTrack) return;
      const note = currentTrack.notes.find((n) => n.id === selectedNoteId);
      if (!note) return;
      resizeNote(note.id, note.durationBeats + deltaBeats);
    },
    [currentTrack, resizeNote, selectedNoteId]
  );

  const selectInstrument = useCallback(
    (instrumentId: string) => {
      setSelectedInstrumentId(instrumentId);
      const idx = songRef.current.tracks.findIndex(
        (t) => t.instrumentId === instrumentId
      );
      if (idx >= 0) {
        setCurrentTrackIndex(idx);
      } else {
        const spec = getInstrumentById(instrumentId);
        const newTrack: Track = {
          id: createUuid(),
          name: spec.name,
          instrumentId,
          customTuning: spec.defaultTuning,
          notes: [],
          isSolo: false,
          isMuted: false,
        };
        setSong((prev) => ({
          ...prev,
          tracks: [...prev.tracks, newTrack],
        }));
        setCurrentTrackIndex(songRef.current.tracks.length);
      }
      setSelectedNoteId(null);
    },
    []
  );

  const addCustomChord = useCallback((chord: ChordDefinition) => {
    setCustomChords((prev) => {
      const updated = [
        { ...chord, isCustom: true },
        ...prev.filter(
          (c) =>
            c.id !== chord.id &&
            c.name.toLowerCase() !== chord.name.toLowerCase()
        ),
      ];
      saveCustomChords(updated);
      return updated;
    });
  }, []);

  const deleteCustomChord = useCallback((id: string) => {
    setCustomChords((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveCustomChords(updated);
      return updated;
    });
  }, []);

  const setCustomAudioUrl = useCallback((url: string, displayName: string) => {
    const sId = songRef.current.id;
    setCustomAudioUrls((prev) => ({ ...prev, [sId]: url }));
    setSong((prev) => ({
      ...prev,
      audioSource: {
        ...prev.audioSource,
        sourceType: "Local Audio File (MP3/WAV)",
        localFilePath: displayName,
      },
    }));
  }, []);

  const loadSongIntoStudio = useCallback(
    (nextSong: FretStackSong, instrumentId?: string) => {
      pause();
      setSong(nextSong);
      let trackIdx = 0;
      if (instrumentId) {
        setSelectedInstrumentId(instrumentId);
        const found = nextSong.tracks.findIndex(
          (t) => t.instrumentId === instrumentId
        );
        if (found >= 0) trackIdx = found;
      } else if (nextSong.tracks[0]) {
        setSelectedInstrumentId(nextSong.tracks[0].instrumentId);
      }
      setCurrentTrackIndex(trackIdx);
      setSelectedNoteId(null);
      const isYT =
        nextSong.audioSource.sourceType === "External Stream / YouTube Link";
      const lead =
        !isYT && isCountInEnabled
          ? -(leadInBars * beatsPerMeasure(nextSong.timeSignature))
          : 0;
      currentBeatRef.current = lead;
      setCurrentBeatState(lead);
      setCurrentScreen("runnerStudio");
    },
    [isCountInEnabled, leadInBars, pause]
  );

  const createAndOpenNewSong = useCallback(
    (title = "New Song", instrumentId = selectedInstrumentId) => {
      const fresh = createEmptySong(title, instrumentId);
      loadSongIntoStudio(fresh, instrumentId);
    },
    [loadSongIntoStudio, selectedInstrumentId]
  );

  const saveCurrentSongToActiveAlbum = useCallback(() => {
    const current = songRef.current;
    setAlbums((prev) =>
      prev.map((album) => {
        if (album.id !== activeAlbumId) return album;
        const exists = album.songs.some((s) => s.id === current.id);
        const updatedSongs = exists
          ? album.songs.map((s) => (s.id === current.id ? current : s))
          : [current, ...album.songs];
        return {
          ...album,
          songs: updatedSongs,
          modifiedAt: new Date().toISOString(),
        };
      })
    );
  }, [activeAlbumId]);

  const createAlbum = useCallback(
    (name: string, subtitle: string, preset: AlbumCoverPreset) => {
      const album = createNewAlbum(name, subtitle, preset);
      setAlbums((prev) => [...prev, album]);
      setActiveAlbumId(album.id);
    },
    []
  );

  const updateAlbum = useCallback((id: string, patch: Partial<FretStackAlbum>) => {
    setAlbums((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, ...patch, modifiedAt: new Date().toISOString() } : a
      )
    );
  }, []);

  const deleteAlbum = useCallback(
    (id: string) => {
      setAlbums((prev) => {
        const remaining = prev.filter((a) => a.id !== id);
        if (remaining.length === 0) {
          const demo = createDefaultDemoAlbum();
          setActiveAlbumId(demo.id);
          return [demo];
        }
        if (activeAlbumId === id) {
          setActiveAlbumId(remaining[0].id);
        }
        return remaining;
      });
    },
    [activeAlbumId]
  );

  const restoreAlbums = useCallback((imported: FretStackAlbum[]) => {
    if (imported.length === 0) return;
    setAlbums(imported);
    setActiveAlbumId(imported[0].id);
  }, []);

  const resetDemoAlbum = useCallback(() => {
    const demo = createDefaultDemoAlbum();
    setAlbums((prev) => {
      const withoutDemo = prev.filter((a) => a.id !== demo.id);
      return [demo, ...withoutDemo];
    });
    setActiveAlbumId(demo.id);
  }, []);

  const value: FretStackContextValue = {
    currentScreen,
    setCurrentScreen,
    albums,
    activeAlbumId,
    setActiveAlbumId,
    song,
    setSong,
    currentTrackIndex,
    setCurrentTrackIndex,
    currentTrack,
    currentInstrument,
    currentTuning,
    currentBeat,
    setCurrentBeat,
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    isMetronomeEnabled,
    setIsMetronomeEnabled,
    isCountInEnabled,
    setIsCountInEnabled,
    isSynthEnabled,
    setIsSynthEnabled,
    leadInBars,
    leadInBeats,
    startBeat,
    pixelsPerBeat,
    setPixelsPerBeat,
    selectedNoteId,
    setSelectedNoteId,
    selectedNote,
    selectedInstrumentId,
    selectInstrument,
    activeStringNumber,
    setActiveStringNumber,
    activeFretNumber,
    setActiveFretNumber,
    activeNoteDurationBeats,
    setActiveNoteDurationBeats,
    customChords,
    addCustomChord,
    deleteCustomChord,
    play,
    pause,
    togglePlayPause,
    rewind,
    seek,
    auditionFret,
    auditionChord,
    addNoteAt,
    addChordAtPlayhead,
    moveNote,
    resizeNote,
    updateSelectedNote,
    deleteSelectedNote,
    nudgeSelectedNote,
    adjustSelectedNoteLength,
    setCustomAudioUrl,
    loadSongIntoStudio,
    createAndOpenNewSong,
    saveCurrentSongToActiveAlbum,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    restoreAlbums,
    resetDemoAlbum,
  };

  return (
    <FretStackContext.Provider value={value}>
      {children}
    </FretStackContext.Provider>
  );
};

export function useFretStack(): FretStackContextValue {
  const ctx = useContext(FretStackContext);
  if (!ctx) {
    throw new Error("useFretStack must be used within FretStackProvider");
  }
  return ctx;
}
