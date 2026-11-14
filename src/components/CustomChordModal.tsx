import React, { useState } from "react";
import { Plus, Trash2, Volume2, X, Guitar } from "lucide-react";
import {
  ALL_CHORD_QUALITIES,
  ChordDefinition,
  ChordQuality,
  chordTabSummary,
  COMMON_MAJOR_CHORDS,
  COMMON_MINOR_CHORDS,
  COMMON_SEVENTH_CHORDS,
  createCustomChord,
} from "../core/chordModel";
import { useFretStack } from "../state/useFretStackStore";

interface CustomChordModalProps {
  onClose: () => void;
}

export const CustomChordModal: React.FC<CustomChordModalProps> = ({
  onClose,
}) => {
  const {
    customChords,
    addCustomChord,
    deleteCustomChord,
    addChordAtPlayhead,
    auditionChord,
  } = useFretStack();

  const [filterTab, setFilterTab] = useState<"all" | "major" | "minor" | "7th" | "custom">("all");
  const [newName, setNewName] = useState("");
  const [newQuality, setNewQuality] = useState<ChordQuality>("Major");
  const [newDuration, setNewDuration] = useState(1.0);
  const [stringInputs, setStringInputs] = useState<string[]>(["X", "3", "2", "0", "1", "0"]);

  const visibleChords: ChordDefinition[] = (() => {
    if (filterTab === "major") return COMMON_MAJOR_CHORDS;
    if (filterTab === "minor") return COMMON_MINOR_CHORDS;
    if (filterTab === "7th") return COMMON_SEVENTH_CHORDS;
    if (filterTab === "custom") return customChords;
    return [
      ...customChords,
      ...COMMON_MAJOR_CHORDS,
      ...COMMON_MINOR_CHORDS,
      ...COMMON_SEVENTH_CHORDS,
    ];
  })();

  const handleSaveCustom = () => {
    const parsed = stringInputs.map((val) => {
      const clean = val.trim().toUpperCase();
      if (clean === "" || clean === "X") return null;
      const num = parseInt(clean, 10);
      return Number.isNaN(num) ? null : Math.max(0, Math.min(24, num));
    });
    const chord = createCustomChord(newName || "Custom", newQuality, parsed, newDuration);
    addCustomChord(chord);
    auditionChord(chord);
    setNewName("");
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: 680, padding: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Guitar size={18} color="#00e5ff" />
            <h3 style={{ margin: 0, fontSize: 16 }}>Chord Library & Custom Builder</h3>
          </div>
          <button className="btn" onClick={onClose} style={{ padding: 5 }}>
            <X size={15} />
          </button>
        </div>

        {/* Custom Chord Builder */}
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: "var(--bg-dark)",
            border: "1px solid var(--border-subtle)",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            Create Custom Chord Voicing (Low E → High e)
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              className="input-dark"
              placeholder="Chord Name (e.g. Gmaj7)"
              style={{ width: 150 }}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <select
              className="input-dark"
              style={{ width: 120 }}
              value={newQuality}
              onChange={(e) => setNewQuality(e.target.value as ChordQuality)}
            >
              {ALL_CHORD_QUALITIES.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 4 }}>
              {["E", "A", "D", "G", "B", "e"].map((label, idx) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{label}</div>
                  <input
                    type="text"
                    className="input-dark mono"
                    style={{ width: 34, textAlign: "center", padding: "5px 2px" }}
                    value={stringInputs[idx]}
                    onChange={(e) => {
                      const next = [...stringInputs];
                      next[idx] = e.target.value;
                      setStringInputs(next);
                    }}
                  />
                </div>
              ))}
            </div>
            <input
              type="number"
              className="input-dark"
              step={0.25}
              min={0.25}
              max={8}
              style={{ width: 64 }}
              value={newDuration}
              onChange={(e) => setNewDuration(Number(e.target.value) || 1)}
              title="Duration in beats"
            />
            <button className="btn btn-neon" onClick={handleSaveCustom}>
              <Plus size={14} /> Save
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {(["all", "major", "minor", "7th", "custom"] as const).map((tab) => (
            <button
              key={tab}
              className={filterTab === tab ? "btn btn-neon" : "btn"}
              onClick={() => setFilterTab(tab)}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Chord Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))",
            gap: 8,
            maxHeight: 280,
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {visibleChords.map((chord) => (
            <div
              key={chord.id}
              style={{
                background: "var(--bg-dark)",
                border: `1px solid ${chord.colorHex}55`,
                borderRadius: 10,
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: chord.colorHex }}>
                  {chord.name}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    className="btn"
                    style={{ padding: 4 }}
                    title="Audition Chord"
                    onClick={() => auditionChord(chord)}
                  >
                    <Volume2 size={12} />
                  </button>
                  {chord.isCustom && (
                    <button
                      className="btn btn-danger"
                      style={{ padding: 4 }}
                      title="Delete Custom Chord"
                      onClick={() => deleteCustomChord(chord.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                {chordTabSummary(chord)}
              </div>
              <button
                className="btn"
                style={{ width: "100%", fontSize: 11, padding: "4px 8px" }}
                onClick={() => {
                  addChordAtPlayhead(chord);
                  onClose();
                }}
              >
                Insert at Playhead
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
