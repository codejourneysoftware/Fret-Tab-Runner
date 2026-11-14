import React, { useState } from "react";
import { Edit3, X } from "lucide-react";
import { useFretStack } from "../state/useFretStackStore";

interface SongMetadataModalProps {
  onClose: () => void;
}

export const SongMetadataModal: React.FC<SongMetadataModalProps> = ({
  onClose,
}) => {
  const { song, setSong } = useFretStack();
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [composer, setComposer] = useState(song.composer);
  const [bpm, setBpm] = useState(song.bpm);
  const [numerator, setNumerator] = useState(song.timeSignature.numerator);
  const [denominator, setDenominator] = useState(song.timeSignature.denominator);
  const [totalMeasures, setTotalMeasures] = useState(song.totalMeasures);
  const [notesDescription, setNotesDescription] = useState(
    song.notesDescription ?? ""
  );

  const handleSave = () => {
    setSong((prev) => ({
      ...prev,
      title: title.trim() || "Untitled Song",
      artist: artist.trim() || "Original",
      composer: composer.trim() || "FretTabRunner Creator",
      bpm: Math.max(20, Math.min(360, bpm)),
      timeSignature: {
        numerator: Math.max(1, Math.min(16, numerator)),
        denominator: [2, 4, 8, 16].includes(denominator) ? denominator : 4,
      },
      totalMeasures: Math.max(1, Math.min(256, totalMeasures)),
      notesDescription: notesDescription.trim() || undefined,
      modifiedAt: new Date().toISOString(),
    }));
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: 480, padding: 20 }}
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
            <Edit3 size={18} color="#00e5ff" />
            <h3 style={{ margin: 0, fontSize: 16 }}>Song Metadata & Timing</h3>
          </div>
          <button className="btn" onClick={onClose} style={{ padding: 5 }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>Title</label>
            <input className="input-dark" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>Artist</label>
              <input className="input-dark" value={artist} onChange={(e) => setArtist(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>Composer</label>
              <input className="input-dark" value={composer} onChange={(e) => setComposer(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>BPM</label>
              <input
                type="number"
                className="input-dark"
                min={20}
                max={360}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value) || 120)}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>Time Sig</label>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <input
                  type="number"
                  className="input-dark"
                  min={1}
                  max={16}
                  value={numerator}
                  onChange={(e) => setNumerator(Number(e.target.value) || 4)}
                />
                <span>/</span>
                <select
                  className="input-dark"
                  value={denominator}
                  onChange={(e) => setDenominator(Number(e.target.value))}
                >
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                  <option value={16}>16</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>Measures</label>
              <input
                type="number"
                className="input-dark"
                min={1}
                max={256}
                value={totalMeasures}
                onChange={(e) => setTotalMeasures(Number(e.target.value) || 16)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>Notes / Description</label>
            <textarea
              className="input-dark"
              rows={3}
              value={notesDescription}
              onChange={(e) => setNotesDescription(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-neon" onClick={handleSave}>
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
