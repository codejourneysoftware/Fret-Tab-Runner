import React from "react";
import { Volume2, VolumeX, Upload, ExternalLink, X, Music } from "lucide-react";
import { openAudioFileDialog, openExternalUrl } from "../core/fileBridge";
import { AudioSourceType } from "../core/songModel";
import { sharedAudioEngine } from "../audio/audioEngine";
import { useFretStack } from "../state/useFretStackStore";

interface AudioSourceModalProps {
  onClose: () => void;
}

const SOURCE_TYPES: AudioSourceType[] = [
  "Synthesizer Only",
  "Local Audio File (MP3/WAV)",
  "External Stream / YouTube Link",
];

export const AudioSourceModal: React.FC<AudioSourceModalProps> = ({ onClose }) => {
  const { song, setSong, setCustomAudioUrl } = useFretStack();
  const cfg = song.audioSource;

  const updateAudio = (patch: Partial<typeof cfg>) => {
    setSong((prev) => ({
      ...prev,
      audioSource: { ...prev.audioSource, ...patch },
      modifiedAt: new Date().toISOString(),
    }));
  };

  const handleBrowseAudio = async () => {
    const picked = await openAudioFileDialog();
    if (picked) {
      setCustomAudioUrl(picked.playbackUrl, picked.displayName);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: 540, padding: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Music size={18} color="#00e5ff" />
            <h3 style={{ margin: 0, fontSize: 16 }}>Audio Source & Sync Calibration</h3>
          </div>
          <button className="btn" onClick={onClose} style={{ padding: 5 }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
              Playback Source Mode
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SOURCE_TYPES.map((st) => (
                <button
                  key={st}
                  className={cfg.sourceType === st ? "btn btn-neon" : "btn"}
                  onClick={() => updateAudio({ sourceType: st })}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {cfg.sourceType === "Local Audio File (MP3/WAV)" && (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: "var(--bg-dark)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                Loaded File:{" "}
                <strong style={{ color: "#fff" }}>
                  {cfg.localFilePath || "None selected"}
                </strong>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn btn-neon" onClick={handleBrowseAudio}>
                  <Upload size={14} /> Choose MP3 / WAV / M4A
                </button>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    Recorded BPM (for tempo scaling)
                  </label>
                  <input
                    type="number"
                    className="input-dark"
                    min={30}
                    max={300}
                    value={cfg.recordedBpm ?? song.bpm}
                    onChange={(e) =>
                      updateAudio({ recordedBpm: Number(e.target.value) || song.bpm })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {cfg.sourceType === "External Stream / YouTube Link" && (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: "var(--bg-dark)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                Reference Stream / YouTube URL
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="url"
                  className="input-dark"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={cfg.webUrl ?? ""}
                  onChange={(e) => updateAudio({ webUrl: e.target.value })}
                />
                {cfg.webUrl && (
                  <button
                    className="btn"
                    onClick={() => openExternalUrl(cfg.webUrl!)}
                  >
                    <ExternalLink size={14} /> Open
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Offset Calibration */}
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "var(--bg-dark)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Audio Sync Offset
              </span>
              <span className="mono" style={{ fontSize: 12, color: "#00e5ff" }}>
                {cfg.offsetMilliseconds >= 0 ? `+${cfg.offsetMilliseconds}` : cfg.offsetMilliseconds} ms
              </span>
            </div>
            <input
              type="range"
              min={-1000}
              max={1000}
              step={5}
              value={cfg.offsetMilliseconds}
              onChange={(e) =>
                updateAudio({ offsetMilliseconds: Number(e.target.value) })
              }
            />
            <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
              <button
                className="btn"
                onClick={() =>
                  updateAudio({
                    offsetMilliseconds: Math.max(-1000, cfg.offsetMilliseconds - 10),
                  })
                }
              >
                -10 ms
              </button>
              <button
                className="btn"
                onClick={() => updateAudio({ offsetMilliseconds: 0 })}
              >
                Reset (0 ms)
              </button>
              <button
                className="btn"
                onClick={() =>
                  updateAudio({
                    offsetMilliseconds: Math.min(1000, cfg.offsetMilliseconds + 10),
                  })
                }
              >
                +10 ms
              </button>
              <button
                className="btn"
                onClick={() => sharedAudioEngine.triggerMetronome(true)}
              >
                Test Click
              </button>
            </div>
          </div>

          {/* Volume & Mute */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              className={cfg.isMuted ? "btn btn-danger" : "btn"}
              onClick={() => updateAudio({ isMuted: !cfg.isMuted })}
            >
              {cfg.isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              {cfg.isMuted ? "Muted" : "Audible"}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              style={{ flex: 1 }}
              value={cfg.volume}
              onChange={(e) => updateAudio({ volume: Number(e.target.value) })}
            />
            <span className="mono" style={{ fontSize: 11, width: 38, textAlign: "right" }}>
              {Math.round(cfg.volume * 100)}%
            </span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <button className="btn btn-neon" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
