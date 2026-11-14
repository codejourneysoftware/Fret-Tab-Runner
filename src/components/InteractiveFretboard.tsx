import React, { useMemo } from "react";
import { getStringColor } from "../core/instrumentSpec";
import { formatPitch } from "../core/musicTheory";
import { useFretStack } from "../state/useFretStackStore";

const FRET_COUNT = 24;
const SINGLE_DOT_FRETS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const DOUBLE_DOT_FRETS = new Set([12, 24]);

export const InteractiveFretboard: React.FC = () => {
  const {
    currentTrack,
    currentTuning,
    currentBeat,
    selectedNote,
    activeStringNumber,
    activeFretNumber,
    setActiveStringNumber,
    setActiveFretNumber,
    addNoteAt,
    updateSelectedNote,
    auditionFret,
  } = useFretStack();

  const stringCount = currentTuning.pitches.length;

  const activeNotesAtPlayhead = useMemo(() => {
    if (!currentTrack) return [];
    return currentTrack.notes.filter(
      (n) =>
        currentBeat >= n.beat - 0.08 &&
        currentBeat <= n.beat + n.durationBeats
    );
  }, [currentTrack, currentBeat]);

  const handleFretClick = (stringNumber: number, fret: number) => {
    setActiveStringNumber(stringNumber);
    setActiveFretNumber(fret);
    auditionFret(stringNumber, fret);

    if (selectedNote && selectedNote.stringNumber === stringNumber) {
      updateSelectedNote({ fret });
    } else if (currentBeat >= 0) {
      addNoteAt(stringNumber, fret, currentBeat);
    }
  };

  return (
    <div
      style={{
        background: "rgba(38, 43, 61, 0.8)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        flexShrink: 0,
      }}
    >
      {/* Rosewood Fretboard Grid */}
      <div
        style={{
          position: "relative",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.15)",
          background: "linear-gradient(180deg, #241f1c 0%, #191614 100%)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `42px repeat(${FRET_COUNT}, minmax(0, 1fr))`,
            position: "relative",
          }}
        >
          {/* String rows */}
          {Array.from({ length: stringCount }, (_, idx) => idx + 1).map(
            (stringNumber) => {
              const color = getStringColor(stringNumber, stringCount);
              const openPitch = currentTuning.pitches[stringNumber - 1];
              const isRowSelected = stringNumber === activeStringNumber;

              return (
                <React.Fragment key={stringNumber}>
                  {/* Nut / Open String (Fret 0) */}
                  <button
                    type="button"
                    onClick={() => handleFretClick(stringNumber, 0)}
                    title={`String ${stringNumber} (${
                      openPitch ? formatPitch(openPitch) : ""
                    }) Open`}
                    style={{
                      height: 22,
                      background: "rgba(230, 224, 204, 0.12)",
                      border: "none",
                      borderRight: "4px solid #e6e0cc",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      position: "relative",
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: isRowSelected ? color : "rgba(255,255,255,0.65)",
                      }}
                    >
                      {openPitch ? openPitch.note : `S${stringNumber}`}
                    </span>
                    {renderDot(
                      activeNotesAtPlayhead,
                      selectedNote,
                      stringNumber,
                      0,
                      activeStringNumber,
                      activeFretNumber,
                      color
                    )}
                  </button>

                  {/* Frets 1..24 */}
                  {Array.from({ length: FRET_COUNT }, (_, fIdx) => fIdx + 1).map(
                    (fret) => {
                      const isMiddleRow = stringNumber === Math.ceil(stringCount / 2);
                      const hasSingleDot = isMiddleRow && SINGLE_DOT_FRETS.has(fret);
                      const hasDoubleDot =
                        DOUBLE_DOT_FRETS.has(fret) &&
                        (stringNumber === 2 || stringNumber === stringCount - 1);

                      return (
                        <button
                          key={fret}
                          type="button"
                          onClick={() => handleFretClick(stringNumber, fret)}
                          title={`String ${stringNumber}, Fret ${fret}`}
                          style={{
                            height: 22,
                            background: "transparent",
                            border: "none",
                            borderRight: "1.5px solid rgba(200,205,215,0.35)",
                            position: "relative",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {/* String wire */}
                          <span
                            style={{
                              position: "absolute",
                              left: 0,
                              right: 0,
                              height: isRowSelected ? 2.2 : 1 + (stringNumber - 1) * 0.25,
                              background: isRowSelected
                                ? color
                                : "rgba(225, 228, 235, 0.36)",
                              pointerEvents: "none",
                            }}
                          />
                          {/* Inlay dots */}
                          {(hasSingleDot || hasDoubleDot) && (
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.22)",
                                pointerEvents: "none",
                              }}
                            />
                          )}
                          {/* Active / Selected note dot */}
                          {renderDot(
                            activeNotesAtPlayhead,
                            selectedNote,
                            stringNumber,
                            fret,
                            activeStringNumber,
                            activeFretNumber,
                            color
                          )}
                        </button>
                      );
                    }
                  )}
                </React.Fragment>
              );
            }
          )}
        </div>
      </div>

      {/* Fret numbers row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `42px repeat(${FRET_COUNT}, minmax(0, 1fr))`,
          fontSize: 9,
          fontWeight: 700,
          color: "var(--text-muted)",
          textAlign: "center",
        }}
        className="mono"
      >
        <span>NUT</span>
        {Array.from({ length: FRET_COUNT }, (_, i) => i + 1).map((f) => (
          <span
            key={f}
            style={{
              color:
                SINGLE_DOT_FRETS.has(f) || DOUBLE_DOT_FRETS.has(f)
                  ? "var(--strike-neon)"
                  : undefined,
            }}
          >
            {f}
          </span>
        ))}
      </div>

      {/* Persistent Tab Symbols Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          paddingTop: 4,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          fontSize: 10,
          color: "var(--text-secondary)",
        }}
      >
        <span style={{ fontWeight: 700, color: "var(--strike-neon)" }}>
          TAB SYMBOLS:
        </span>
        <span>
          <strong className="mono">h</strong> Hammer-on
        </span>
        <span>
          <strong className="mono">p</strong> Pull-off
        </span>
        <span>
          <strong className="mono">/</strong> Slide Up
        </span>
        <span>
          <strong className="mono">\</strong> Slide Down
        </span>
        <span>
          <strong className="mono">b</strong> Bend
        </span>
        <span>
          <strong className="mono">~</strong> Vibrato
        </span>
        <span>
          <strong className="mono">P.M.</strong> Palm Mute
        </span>
        <span>
          <strong className="mono">(x)</strong> Muted
        </span>
      </div>
    </div>
  );
};

function renderDot(
  activeNotes: Array<{ stringNumber: number; fret: number }>,
  selectedNote: { stringNumber: number; fret: number } | null,
  stringNumber: number,
  fret: number,
  activeStringNumber: number,
  activeFretNumber: number,
  color: string
) {
  const isPlayingHere = activeNotes.some(
    (n) => n.stringNumber === stringNumber && n.fret === fret
  );
  const isSelectedHere =
    selectedNote?.stringNumber === stringNumber && selectedNote?.fret === fret;
  const isCursorHere =
    !isPlayingHere &&
    !isSelectedHere &&
    activeStringNumber === stringNumber &&
    activeFretNumber === fret;

  if (!isPlayingHere && !isSelectedHere && !isCursorHere) return null;

  return (
    <span
      style={{
        position: "relative",
        zIndex: 3,
        width: isPlayingHere ? 16 : 14,
        height: isPlayingHere ? 16 : 14,
        borderRadius: "50%",
        background: isCursorHere ? "transparent" : color,
        border: isCursorHere
          ? `2px solid ${color}`
          : "2px solid rgba(255,255,255,0.95)",
        boxShadow: isPlayingHere ? `0 0 12px ${color}` : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 8,
        fontWeight: 800,
        color: isCursorHere ? color : "#06080f",
      }}
    >
      {fret}
    </span>
  );
}
