import React, { useCallback, useEffect, useRef, useState } from "react";
import { getStringColor } from "../core/instrumentSpec";
import { beatsPerMeasure, formatPitch } from "../core/musicTheory";
import {
  FretNote,
  getTotalBeats,
  techniqueShortSymbol,
} from "../core/songModel";
import { useFretStack } from "../state/useFretStackStore";

const HEADER_WIDTH = 125;
const STRIKE_ZONE_X = 220;
const STRING_SPACING = 34;
const TOP_PADDING = 36;
const BADGE_W = 30;
const BADGE_H = 24;

type DragMode =
  | { type: "none" }
  | { type: "scrub"; startX: number; startBeat: number }
  | { type: "moveNote"; noteId: string; startX: number; startY: number; origBeat: number; origString: number }
  | { type: "resizeNote"; noteId: string; startX: number; origDuration: number };

export const FretboardHighway: React.FC = () => {
  const {
    song,
    currentTrack,
    currentTuning,
    currentBeat,
    pixelsPerBeat,
    selectedNoteId,
    setSelectedNoteId,
    activeStringNumber,
    setActiveStringNumber,
    activeFretNumber,
    startBeat,
    seek,
    addNoteAt,
    moveNote,
    resizeNote,
    auditionFret,
  } = useFretStack();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ width: 900, height: 280 });
  const [dragMode, setDragMode] = useState<DragMode>({ type: "none" });
  const [cursorStyle, setCursorStyle] = useState<string>("crosshair");

  const stringCount = currentTuning.pitches.length;
  const totalHeight = TOP_PADDING + stringCount * STRING_SPACING + 22;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({
          width: Math.max(320, Math.floor(entry.contentRect.width)),
          height: totalHeight,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [totalHeight]);

  const beatToX = useCallback(
    (beat: number) => STRIKE_ZONE_X + (beat - currentBeat) * pixelsPerBeat,
    [currentBeat, pixelsPerBeat]
  );

  const xToBeat = useCallback(
    (x: number) => currentBeat + (x - STRIKE_ZONE_X) / pixelsPerBeat,
    [currentBeat, pixelsPerBeat]
  );

  const stringToY = useCallback(
    (stringNumber: number) => TOP_PADDING + (stringNumber - 1) * STRING_SPACING + 16,
    []
  );

  const yToString = useCallback(
    (y: number) => {
      const idx = Math.round((y - TOP_PADDING - 16) / STRING_SPACING) + 1;
      return Math.max(1, Math.min(stringCount, idx));
    },
    [stringCount]
  );

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = size.width;
    const h = totalHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "#1c212e";
    ctx.fillRect(0, 0, w, h);

    // Measure grid lines & beat ticks
    const measureBeats = beatsPerMeasure(song.timeSignature);
    const totalSongBeats = getTotalBeats(song);
    const visibleStartBeat = xToBeat(HEADER_WIDTH) - 1;
    const visibleEndBeat = xToBeat(w) + 1;

    const firstMeasure = Math.floor(visibleStartBeat / measureBeats);
    const lastMeasure = Math.ceil(visibleEndBeat / measureBeats);

    for (let m = firstMeasure; m <= lastMeasure; m++) {
      const mBeat = m * measureBeats;
      if (mBeat < startBeat - measureBeats || mBeat > totalSongBeats + measureBeats) {
        continue;
      }
      const x = beatToX(mBeat);
      if (x >= HEADER_WIDTH && x <= w) {
        ctx.strokeStyle = m >= 0 ? "rgba(255,255,255,0.18)" : "rgba(0,229,255,0.18)";
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();

        // Bar label
        ctx.fillStyle = m >= 0 ? "rgba(255,255,255,0.55)" : "rgba(0,229,255,0.7)";
        ctx.font = "700 10px JetBrains Mono, monospace";
        const label = m >= 0 ? `BAR ${m + 1}` : "COUNT-IN";
        ctx.fillText(label, x + 6, 16);
      }

      // Beat subdivisions
      for (let b = 1; b < Math.ceil(measureBeats); b++) {
        const bx = beatToX(mBeat + b);
        if (bx >= HEADER_WIDTH && bx <= w) {
          ctx.strokeStyle = "rgba(255,255,255,0.06)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(bx, 24);
          ctx.lineTo(bx, h);
          ctx.stroke();
        }
      }
    }

    // Horizontal string rails
    for (let s = 1; s <= stringCount; s++) {
      const y = stringToY(s);
      const color = getStringColor(s, stringCount);
      const isSelectedStr = s === activeStringNumber;

      ctx.strokeStyle = isSelectedStr ? color : "rgba(255,255,255,0.14)";
      ctx.lineWidth = isSelectedStr ? 2.2 : 1.2 + (s - 1) * 0.25;
      ctx.beginPath();
      ctx.moveTo(HEADER_WIDTH, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Notes: sustain trails + badges
    const notes = currentTrack?.notes ?? [];
    for (const note of notes) {
      const x = beatToX(note.beat);
      const trailW = Math.max(0, note.durationBeats * pixelsPerBeat - BADGE_W * 0.4);
      if (x + trailW + BADGE_W < HEADER_WIDTH || x - BADGE_W > w) continue;

      const y = stringToY(note.stringNumber);
      const color = getStringColor(note.stringNumber, stringCount);
      const isSelected = note.id === selectedNoteId;
      const isStriking =
        currentBeat >= note.beat - 0.08 &&
        currentBeat <= note.beat + note.durationBeats;

      // Sustain ribbon
      if (trailW > 6) {
        const grad = ctx.createLinearGradient(x, y, x + trailW, y);
        grad.addColorStop(0, color + "aa");
        grad.addColorStop(1, color + "22");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y - 6, trailW, 12, 6);
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Note badge
      const bx = x - BADGE_W / 2;
      const by = y - BADGE_H / 2;

      if (isStriking || isSelected) {
        ctx.save();
        ctx.shadowColor = isSelected ? "#ffffff" : color;
        ctx.shadowBlur = isStriking ? 16 : 10;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(bx, by, BADGE_W, BADGE_H, 7);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(bx, by, BADGE_W, BADGE_H, 7);
        ctx.fill();
      }

      if (isSelected) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bx - 1, by - 1, BADGE_W + 2, BADGE_H + 2, 8);
        ctx.stroke();
      }

      // Fret number text
      ctx.fillStyle = "#080b12";
      ctx.font = "800 12px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const techSym = techniqueShortSymbol(note.technique);
      const label =
        note.technique === "Muted Note"
          ? "X"
          : techSym
          ? `${note.fret}${techSym}`
          : String(note.fret);
      ctx.fillText(label, x, y + 0.5);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";

      // Lyric or chord cue above badge
      if (note.lyric || note.chordName) {
        const cue = note.lyric ?? note.chordName ?? "";
        ctx.fillStyle = note.chordName ? "#00e5ff" : "rgba(255,255,255,0.88)";
        ctx.font = "700 10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(cue, x, by - 5);
        ctx.textAlign = "left";
      }
    }

    // Strike Zone Neon Line
    ctx.save();
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 14;
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(STRIKE_ZONE_X, 0);
    ctx.lineTo(STRIKE_ZONE_X, h);
    ctx.stroke();
    ctx.restore();

    // Strike zone playhead cap
    ctx.fillStyle = "#00e5ff";
    ctx.beginPath();
    ctx.moveTo(STRIKE_ZONE_X - 7, 0);
    ctx.lineTo(STRIKE_ZONE_X + 7, 0);
    ctx.lineTo(STRIKE_ZONE_X, 10);
    ctx.closePath();
    ctx.fill();

    // Left String Headers Panel
    ctx.fillStyle = "#161a25";
    ctx.fillRect(0, 0, HEADER_WIDTH, h);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(HEADER_WIDTH, 0);
    ctx.lineTo(HEADER_WIDTH, h);
    ctx.stroke();

    for (let s = 1; s <= stringCount; s++) {
      const y = stringToY(s);
      const color = getStringColor(s, stringCount);
      const pitch = currentTuning.pitches[s - 1];
      const pitchStr = pitch ? formatPitch(pitch) : `S${s}`;
      const isSelectedStr = s === activeStringNumber;

      ctx.fillStyle = isSelectedStr ? color + "33" : "rgba(255,255,255,0.05)";
      ctx.beginPath();
      ctx.roundRect(10, y - 12, HEADER_WIDTH - 20, 24, 6);
      ctx.fill();

      ctx.strokeStyle = isSelectedStr ? color : color + "88";
      ctx.lineWidth = isSelectedStr ? 1.6 : 1;
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(22, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f8fafc";
      ctx.font = "700 11px JetBrains Mono, monospace";
      ctx.textBaseline = "middle";
      ctx.fillText(`S${s} • ${pitchStr}`, 32, y + 0.5);
      ctx.textBaseline = "alphabetic";
    }

    ctx.restore();
  }, [
    activeStringNumber,
    beatToX,
    currentBeat,
    currentTrack?.notes,
    currentTuning.pitches,
    pixelsPerBeat,
    selectedNoteId,
    size.width,
    song,
    startBeat,
    stringCount,
    stringToY,
    totalHeight,
    xToBeat,
  ]);

  const hitTestNote = useCallback(
    (x: number, y: number): { note: FretNote; isResizeEdge: boolean } | null => {
      const notes = currentTrack?.notes ?? [];
      for (let i = notes.length - 1; i >= 0; i--) {
        const note = notes[i];
        const nx = beatToX(note.beat);
        const ny = stringToY(note.stringNumber);
        const trailEnd = nx + Math.max(0, note.durationBeats * pixelsPerBeat - BADGE_W * 0.4);

        if (
          trailEnd - nx > 16 &&
          Math.abs(x - trailEnd) <= 8 &&
          Math.abs(y - ny) <= 10
        ) {
          return { note, isResizeEdge: true };
        }
        if (Math.abs(x - nx) <= BADGE_W / 2 + 4 && Math.abs(y - ny) <= BADGE_H / 2 + 4) {
          return { note, isResizeEdge: false };
        }
      }
      return null;
    },
    [beatToX, currentTrack?.notes, pixelsPerBeat, stringToY]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < HEADER_WIDTH) {
      const s = yToString(y);
      setActiveStringNumber(s);
      auditionFret(s, activeFretNumber);
      return;
    }

    const hit = hitTestNote(x, y);
    if (hit) {
      setSelectedNoteId(hit.note.id);
      setActiveStringNumber(hit.note.stringNumber);
      auditionFret(hit.note.stringNumber, hit.note.fret);
      if (hit.isResizeEdge) {
        setDragMode({
          type: "resizeNote",
          noteId: hit.note.id,
          startX: x,
          origDuration: hit.note.durationBeats,
        });
      } else {
        setDragMode({
          type: "moveNote",
          noteId: hit.note.id,
          startX: x,
          startY: y,
          origBeat: hit.note.beat,
          origString: hit.note.stringNumber,
        });
      }
      return;
    }

    setDragMode({ type: "scrub", startX: x, startBeat: currentBeat });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragMode.type === "scrub") {
      const deltaBeats = (x - dragMode.startX) / pixelsPerBeat;
      seek(dragMode.startBeat - deltaBeats);
      return;
    }
    if (dragMode.type === "moveNote") {
      const deltaBeats = (x - dragMode.startX) / pixelsPerBeat;
      const newString = yToString(y);
      moveNote(dragMode.noteId, newString, dragMode.origBeat + deltaBeats);
      return;
    }
    if (dragMode.type === "resizeNote") {
      const deltaBeats = (x - dragMode.startX) / pixelsPerBeat;
      resizeNote(dragMode.noteId, dragMode.origDuration + deltaBeats);
      return;
    }

    if (x < HEADER_WIDTH) {
      setCursorStyle("pointer");
      return;
    }
    const hit = hitTestNote(x, y);
    if (hit?.isResizeEdge) {
      setCursorStyle("ew-resize");
    } else if (hit) {
      setCursorStyle("grab");
    } else {
      setCursorStyle("crosshair");
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragMode.type === "scrub" && Math.abs(x - dragMode.startX) < 4) {
      // Single click on empty lane -> add note
      const beat = xToBeat(x);
      if (beat >= 0) {
        const str = yToString(y);
        addNoteAt(str, activeFretNumber, beat);
      }
    }
    setDragMode({ type: "none" });
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    seek(currentBeat + (delta / pixelsPerBeat) * 0.65);
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: totalHeight,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--border-subtle)",
        background: "#1c212e",
        flexShrink: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: size.width,
          height: totalHeight,
          display: "block",
          cursor: cursorStyle,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setDragMode({ type: "none" })}
        onWheel={handleWheel}
      />
    </div>
  );
};
