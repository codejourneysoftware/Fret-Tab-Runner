import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Disc3,
  Edit3,
  FileCode2,
  Guitar,
  Headphones,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { QUICK_TOOLBAR_CHORDS } from "../core/chordModel";
import { NOTE_DURATION_OPTIONS } from "../core/musicTheory";
import {
  ALL_TECHNIQUES,
  measureNumberForBeat,
  Technique,
} from "../core/songModel";
import { useFretStack } from "../state/useFretStackStore";
import { AlbumManagerModal } from "./AlbumManagerModal";
import { AudioSourceModal } from "./AudioSourceModal";
import { CustomChordModal } from "./CustomChordModal";
import { ExportImportModal } from "./ExportImportModal";
import { FretboardHighway } from "./FretboardHighway";
import { InteractiveFretboard } from "./InteractiveFretboard";
import { SongMetadataModal } from "./SongMetadataModal";

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5];

export const RunnerStudio: React.FC = () => {
  const {
    song,
    setSong,
    currentTrackIndex,
    setCurrentTrackIndex,
    currentInstrument,
    currentBeat,
    isPlaying,
    togglePlayPause,
    rewind,
    seek,
    playbackSpeed,
    setPlaybackSpeed,
    isMetronomeEnabled,
    setIsMetronomeEnabled,
    isCountInEnabled,
    setIsCountInEnabled,
    isSynthEnabled,
    setIsSynthEnabled,
    pixelsPerBeat,
    setPixelsPerBeat,
    selectedNote,
    setSelectedNoteId,
    activeFretNumber,
    setActiveFretNumber,
    activeNoteDurationBeats,
    setActiveNoteDurationBeats,
    addChordAtPlayhead,
    updateSelectedNote,
    deleteSelectedNote,
    nudgeSelectedNote,
    adjustSelectedNoteLength,
    setCurrentScreen,
    saveCurrentSongToActiveAlbum,
  } = useFretStack();

  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isChordModalOpen, setIsChordModalOpen] = useState(false);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Global keyboard shortcuts for Studio
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (
        isAudioModalOpen ||
        isExportModalOpen ||
        isChordModalOpen ||
        isAlbumModalOpen ||
        isMetadataOpen
      ) {
        if (e.key === "Escape") {
          setIsAudioModalOpen(false);
          setIsExportModalOpen(false);
          setIsChordModalOpen(false);
          setIsAlbumModalOpen(false);
          setIsMetadataOpen(false);
        }
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (selectedNote) {
          nudgeSelectedNote(0, -0.125);
        } else {
          seek(currentBeat - 1.0);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (selectedNote) {
          nudgeSelectedNote(0, 0.125);
        } else {
          seek(currentBeat + 1.0);
        }
      } else if (e.key === "ArrowUp" && selectedNote) {
        e.preventDefault();
        nudgeSelectedNote(-1, 0);
      } else if (e.key === "ArrowDown" && selectedNote) {
        e.preventDefault();
        nudgeSelectedNote(1, 0);
      } else if (e.key === "[" && selectedNote) {
        e.preventDefault();
        adjustSelectedNoteLength(-0.125);
      } else if (e.key === "]" && selectedNote) {
        e.preventDefault();
        adjustSelectedNoteLength(0.125);
      } else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedNote
      ) {
        e.preventDefault();
        deleteSelectedNote();
      } else if (e.key === "Escape" && selectedNote) {
        setSelectedNoteId(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    adjustSelectedNoteLength,
    currentBeat,
    deleteSelectedNote,
    isAlbumModalOpen,
    isAudioModalOpen,
    isChordModalOpen,
    isExportModalOpen,
    isMetadataOpen,
    nudgeSelectedNote,
    seek,
    selectedNote,
    setSelectedNoteId,
    togglePlayPause,
  ]);

  const currentBar = measureNumberForBeat(song, currentBeat);

  const toggleTrackMute = (idx: number) => {
    setSong((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t, i) =>
        i === idx ? { ...t, isMuted: !t.isMuted } : t
      ),
    }));
  };

  const toggleTrackSolo = (idx: number) => {
    setSong((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t, i) =>
        i === idx ? { ...t, isSolo: !t.isSolo } : t
      ),
    }));
  };

  const handleSaveToAlbum = () => {
    saveCurrentSongToActiveAlbum();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1600);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "12px 16px",
        background: "var(--bg-dark)",
        overflowY: "auto",
      }}
    >
      {/* Top Transport & Header Bar */}
      <div
        style={{
          background: "var(--surface-dark)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 12,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {/* Left: Back & Song Info */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            className="btn"
            onClick={() => setCurrentScreen("instrumentHub")}
          >
            <ArrowLeft size={14} /> Hub
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 10px",
              borderRadius: 8,
              background: "var(--bg-dark)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{song.title}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                {song.artist} • {currentInstrument.name}
              </div>
            </div>
            <button
              className="btn"
              style={{ padding: 4 }}
              title="Edit Song Metadata & Timing"
              onClick={() => setIsMetadataOpen(true)}
            >
              <Edit3 size={12} />
            </button>
          </div>
        </div>

        {/* Center: Transport Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <button className="btn" onClick={rewind} title="Rewind to Start">
            <RotateCcw size={14} />
          </button>
          <button
            className="btn btn-neon"
            style={{ minWidth: 86 }}
            onClick={togglePlayPause}
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? "Pause" : "Play"}
          </button>

          <div
            className="mono"
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              background: "var(--bg-dark)",
              border: "1px solid var(--border-subtle)",
              fontSize: 11,
              color: "#00e5ff",
            }}
          >
            BAR {currentBar} • {currentBeat.toFixed(2)}b
          </div>

          {/* BPM Control */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "var(--bg-dark)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 8,
              padding: "2px 6px",
            }}
          >
            <button
              className="btn"
              style={{ padding: 3, border: "none" }}
              onClick={() =>
                setSong((p) => ({ ...p, bpm: Math.max(20, p.bpm - 5) }))
              }
            >
              <Minus size={11} />
            </button>
            <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>
              {Math.round(song.bpm)} BPM
            </span>
            <button
              className="btn"
              style={{ padding: 3, border: "none" }}
              onClick={() =>
                setSong((p) => ({ ...p, bpm: Math.min(360, p.bpm + 5) }))
              }
            >
              <Plus size={11} />
            </button>
          </div>

          {/* Speed Selector */}
          <select
            className="input-dark mono"
            style={{ width: 72, padding: "5px 6px" }}
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            title="Playback Speed"
          >
            {SPEED_OPTIONS.map((spd) => (
              <option key={spd} value={spd}>
                {spd}x
              </option>
            ))}
          </select>

          <button
            className={isMetronomeEnabled ? "btn btn-neon" : "btn"}
            onClick={() => setIsMetronomeEnabled(!isMetronomeEnabled)}
            title="Toggle Metronome Click"
          >
            Click
          </button>
          <button
            className={isCountInEnabled ? "btn btn-neon" : "btn"}
            onClick={() => setIsCountInEnabled(!isCountInEnabled)}
            title="Toggle Count-In Lead-In"
          >
            Count-In
          </button>
          <button
            className={isSynthEnabled ? "btn btn-neon" : "btn"}
            onClick={() => setIsSynthEnabled(!isSynthEnabled)}
            title="Toggle Karplus-Strong Synth"
          >
            {isSynthEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            Synth
          </button>
        </div>

        {/* Right: Modals & Save */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button className="btn" onClick={() => setIsAudioModalOpen(true)}>
            <Headphones size={14} /> Audio
          </button>
          <button className="btn" onClick={() => setIsExportModalOpen(true)}>
            <FileCode2 size={14} /> Export/Import
          </button>
          <button className="btn" onClick={() => setIsAlbumModalOpen(true)}>
            <Disc3 size={14} /> Albums
          </button>
          <button className="btn btn-neon" onClick={handleSaveToAlbum}>
            <Save size={14} /> {savedToast ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* Side-Scrolling Tablature Highway */}
      <FretboardHighway />

      {/* Synchronized 24-Fret Interactive Fretboard */}
      <InteractiveFretboard />

      {/* Bottom Song Editor & Inspector Bar */}
      <div
        style={{
          background: "var(--surface-dark)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 12,
          padding: "10px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flexShrink: 0,
        }}
      >
        {/* Row 1: Track Switcher + Duration + Zoom */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>
              TRACKS:
            </span>
            {song.tracks.map((track, idx) => {
              const active = idx === currentTrackIndex;
              return (
                <div key={track.id} style={{ display: "flex", gap: 2 }}>
                  <button
                    className={active ? "btn btn-neon" : "btn"}
                    onClick={() => setCurrentTrackIndex(idx)}
                  >
                    <Guitar size={12} /> {track.name} ({track.notes.length})
                  </button>
                  <button
                    className={track.isMuted ? "btn btn-danger" : "btn"}
                    style={{ padding: "4px 6px", fontSize: 10 }}
                    onClick={() => toggleTrackMute(idx)}
                    title="Mute Track"
                  >
                    M
                  </button>
                  <button
                    className={track.isSolo ? "btn btn-neon" : "btn"}
                    style={{ padding: "4px 6px", fontSize: 10 }}
                    onClick={() => toggleTrackSolo(idx)}
                    title="Solo Track"
                  >
                    S
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Note Len:</span>
            <select
              className="input-dark mono"
              style={{ width: 110, padding: "4px 6px" }}
              value={activeNoteDurationBeats}
              onChange={(e) => setActiveNoteDurationBeats(Number(e.target.value))}
            >
              {NOTE_DURATION_OPTIONS.map((opt) => (
                <option key={opt.type} value={opt.beats}>
                  {opt.displayName}
                </option>
              ))}
            </select>

            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Fret:</span>
            <input
              type="number"
              className="input-dark mono"
              min={0}
              max={24}
              style={{ width: 54, padding: "4px 6px" }}
              value={activeFretNumber}
              onChange={(e) =>
                setActiveFretNumber(
                  Math.max(0, Math.min(24, Number(e.target.value) || 0))
                )
              }
            />

            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Zoom:</span>
            <input
              type="range"
              min={60}
              max={200}
              value={pixelsPerBeat}
              onChange={(e) => setPixelsPerBeat(Number(e.target.value))}
              style={{ width: 85 }}
            />
          </div>
        </div>

        {/* Row 2: Quick Chord Toolbar + Selected Note Inspector */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 8,
          }}
        >
          {/* Quick Chords */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>
              CHORDS:
            </span>
            {QUICK_TOOLBAR_CHORDS.map((chord) => (
              <button
                key={chord.id}
                className="btn"
                style={{
                  padding: "4px 9px",
                  borderColor: chord.colorHex + "66",
                  color: chord.colorHex,
                }}
                onClick={() => addChordAtPlayhead(chord)}
                title={`Insert ${chord.name} at Beat ${currentBeat.toFixed(2)}`}
              >
                {chord.name}
              </button>
            ))}
            <button
              className="btn btn-neon"
              style={{ padding: "4px 10px" }}
              onClick={() => setIsChordModalOpen(true)}
            >
              + Chords
            </button>
          </div>

          {/* Selected Note Inspector */}
          {selectedNote ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "var(--bg-dark)",
                border: "1px solid rgba(0,229,255,0.35)",
                borderRadius: 8,
                padding: "4px 8px",
                flexWrap: "wrap",
              }}
            >
              <span className="mono" style={{ fontSize: 11, color: "#00e5ff", fontWeight: 700 }}>
                S{selectedNote.stringNumber} @ {selectedNote.beat.toFixed(2)}b
              </span>
              <label style={{ fontSize: 10, color: "var(--text-muted)" }}>Fret</label>
              <input
                type="number"
                className="input-dark mono"
                min={0}
                max={24}
                style={{ width: 48, padding: "3px 5px" }}
                value={selectedNote.fret}
                onChange={(e) =>
                  updateSelectedNote({
                    fret: Math.max(0, Math.min(24, Number(e.target.value) || 0)),
                  })
                }
              />
              <select
                className="input-dark"
                style={{ width: 112, padding: "3px 6px" }}
                value={selectedNote.technique}
                onChange={(e) =>
                  updateSelectedNote({ technique: e.target.value as Technique })
                }
              >
                {ALL_TECHNIQUES.map((tech) => (
                  <option key={tech} value={tech}>
                    {tech}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="input-dark"
                placeholder="Lyric..."
                style={{ width: 76, padding: "3px 6px" }}
                value={selectedNote.lyric ?? ""}
                onChange={(e) =>
                  updateSelectedNote({ lyric: e.target.value || undefined })
                }
              />
              <button
                className="btn btn-danger"
                style={{ padding: "4px 7px" }}
                onClick={deleteSelectedNote}
                title="Delete Note (Del)"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ) : (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Tip: Click empty lane to add note • Drag note to move • Drag ribbon edge to resize • Space to Play/Pause
            </span>
          )}
        </div>
      </div>

      {isAudioModalOpen && (
        <AudioSourceModal onClose={() => setIsAudioModalOpen(false)} />
      )}
      {isExportModalOpen && (
        <ExportImportModal onClose={() => setIsExportModalOpen(false)} />
      )}
      {isChordModalOpen && (
        <CustomChordModal onClose={() => setIsChordModalOpen(false)} />
      )}
      {isAlbumModalOpen && (
        <AlbumManagerModal onClose={() => setIsAlbumModalOpen(false)} />
      )}
      {isMetadataOpen && (
        <SongMetadataModal onClose={() => setIsMetadataOpen(false)} />
      )}
    </div>
  );
};
