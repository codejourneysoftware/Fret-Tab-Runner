import React from "react";
import {
  ArrowRight,
  Disc3,
  FolderOpen,
  Guitar,
  LayoutGrid,
  Music,
  Play,
  Plus,
  Scale,
  Sparkles,
  Tv,
  Volume2,
} from "lucide-react";
import { ALL_INSTRUMENTS } from "../core/instrumentSpec";
import { decodeSongFromJSON } from "../core/exporters";
import { openTextFileDialog } from "../core/fileBridge";
import { useFretStack } from "../state/useFretStackStore";
import { AlbumCoverArt } from "./AlbumCoverArt";
import { AlbumManagerModal } from "./AlbumManagerModal";

export const ModularInstrumentHub: React.FC = () => {
  const {
    albums,
    activeAlbumId,
    setActiveAlbumId,
    selectedInstrumentId,
    selectInstrument,
    setCurrentScreen,
    loadSongIntoStudio,
    createAndOpenNewSong,
  } = useFretStack();

  const [isAlbumModalOpen, setIsAlbumModalOpen] = React.useState(false);

  const activeAlbum =
    albums.find((a) => a.id === activeAlbumId) ?? albums[0];

  const handleImportSong = async () => {
    const picked = await openTextFileDialog([
      { name: "Song Files (*.json, *.fretstack)", extensions: ["json", "fretstack"] },
      { name: "All Files (*.*)", extensions: ["*"] },
    ]);
    if (!picked) return;
    try {
      const imported = decodeSongFromJSON(picked.contents);
      loadSongIntoStudio(imported);
    } catch {
      // ignore invalid
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
        background: "var(--bg-dark)",
        padding: "24px 32px",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        {/* Top Brand Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "var(--strike-neon)",
                color: "#050b14",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 18px rgba(0, 229, 255, 0.45)",
              }}
            >
              <Guitar size={22} strokeWidth={2.4} />
            </div>
            <div>
              <div
                className="mono"
                style={{ fontSize: 17, fontWeight: 900, letterSpacing: 0.5 }}
              >
                FRET TAB RUNNER
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Interactive Modular Tablature Engine • Tauri + React
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn" onClick={handleImportSong}>
              <FolderOpen size={14} /> Open Song (.json / .fretstack)
            </button>
            <button
              className="btn"
              onClick={() => setIsAlbumModalOpen(true)}
            >
              <Disc3 size={14} /> Manage Albums
            </button>
            <button
              className="btn btn-neon"
              onClick={() => setCurrentScreen("runnerStudio")}
            >
              Enter Studio <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Hero Header */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(0,229,255,0.12), rgba(168,85,247,0.08))",
            border: "1px solid rgba(0,229,255,0.22)",
            borderRadius: 16,
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "var(--strike-neon)",
                fontSize: 12,
                fontWeight: 800,
                marginBottom: 6,
              }}
              className="mono"
            >
              <LayoutGrid size={15} /> INSTRUMENT HUB
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
              Play Guitar & Bass to Scrolling Tabs
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 13,
                color: "var(--text-secondary)",
                maxWidth: 640,
              }}
            >
              Side-scrolling tablature highway, synchronized 24-fret rosewood
              fretboard, Karplus-Strong physical string synthesis, and MusicXML
              4.0 / ASCII / JSON export.
            </p>
          </div>

          <button
            className="btn btn-neon"
            style={{ padding: "10px 16px", fontSize: 13 }}
            onClick={() => createAndOpenNewSong("Untitled Riff")}
          >
            <Plus size={16} /> New Blank Song
          </button>
        </div>

        {/* Instrument Showcase Grid */}
        <div>
          <div
            className="mono"
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "var(--text-muted)",
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            MODULAR INSTRUMENT ENGINES
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 14,
            }}
          >
            {ALL_INSTRUMENTS.map((inst) => {
              const isSelected = inst.id === selectedInstrumentId;
              return (
                <div
                  key={inst.id}
                  style={{
                    background: "var(--surface-dark)",
                    border: isSelected
                      ? "1.5px solid var(--strike-neon)"
                      : "1px solid var(--border-subtle)",
                    borderRadius: 14,
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>
                        {inst.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        {inst.subtitle}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: "rgba(34, 197, 94, 0.16)",
                        color: "#4ade80",
                        border: "1px solid rgba(34, 197, 94, 0.35)",
                      }}
                    >
                      {inst.releasePhase}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {inst.description}
                  </p>

                  {/* Color-coded string pills */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {inst.defaultTuning.pitches.map((p, idx) => {
                      const col = inst.stringColors[idx] ?? "#00e5ff";
                      return (
                        <span
                          key={idx}
                          className="mono"
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: col + "22",
                            color: col,
                            border: `1px solid ${col}66`,
                          }}
                        >
                          S{idx + 1}: {p.note}
                          {p.octave}
                        </span>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                    <button
                      className="btn btn-neon"
                      onClick={() => {
                        selectInstrument(inst.id);
                        setCurrentScreen("runnerStudio");
                      }}
                    >
                      <Play size={13} /> Launch {inst.category} Studio
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Albums & Quick Start Songs */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={15} color="#00e5ff" />
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "var(--text-muted)",
                  letterSpacing: 1,
                }}
              >
                ALBUMS & QUICK-START SONGS
              </span>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {albums.map((alb) => (
                <button
                  key={alb.id}
                  className={
                    alb.id === activeAlbum?.id ? "btn btn-neon" : "btn"
                  }
                  onClick={() => setActiveAlbumId(alb.id)}
                >
                  {alb.name} ({alb.songs.length})
                </button>
              ))}
            </div>
          </div>

          {activeAlbum && (
            <div
              style={{
                background: "var(--surface-dark)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 14,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <AlbumCoverArt
                  preset={activeAlbum.coverPreset}
                  customDataUrl={activeAlbum.customCoverDataUrl}
                  size={56}
                />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>
                    {activeAlbum.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {activeAlbum.subtitle}
                  </div>
                </div>
              </div>

              {activeAlbum.songs.length === 0 ? (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: 12,
                  }}
                >
                  No songs in this album yet. Create a new song or save from the
                  Studio!
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 12,
                  }}
                >
                  {activeAlbum.songs.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        background: "var(--bg-dark)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 12,
                        padding: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>
                            {s.title}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {s.artist}
                          </div>
                        </div>
                        {s.audioSource.sourceType ===
                        "Local Audio File (MP3/WAV)" ? (
                          <span
                            title="Includes MP3 Backing Track"
                            style={{
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 6,
                              background: "rgba(0,229,255,0.14)",
                              color: "#00e5ff",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Volume2 size={10} /> MP3
                          </span>
                        ) : s.audioSource.sourceType ===
                          "External Stream / YouTube Link" ? (
                          <span
                            title="YouTube Streaming Backing Track"
                            style={{
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 6,
                              background: "rgba(255,0,85,0.16)",
                              color: "#ff3366",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Tv size={10} /> YouTube
                          </span>
                        ) : (
                          <span
                            title="Karplus-Strong Synth"
                            style={{
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 6,
                              background: "rgba(168,85,247,0.16)",
                              color: "#c084fc",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Music size={10} /> Synth
                          </span>
                        )}
                      </div>

                      <div
                        className="mono"
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          display: "flex",
                          gap: 10,
                        }}
                      >
                        <span>{Math.round(s.bpm)} BPM</span>
                        <span>
                          {s.timeSignature.numerator}/
                          {s.timeSignature.denominator}
                        </span>
                        <span>{s.totalMeasures} Bars</span>
                      </div>

                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          color: "var(--text-secondary)",
                          lineHeight: 1.4,
                          flex: 1,
                        }}
                      >
                        {s.notesDescription ??
                          `${s.tracks.length} track(s) ready to play.`}
                      </p>

                      <button
                        className="btn btn-neon"
                        style={{ width: "100%", marginTop: 4 }}
                        onClick={() =>
                          loadSongIntoStudio(s, selectedInstrumentId)
                        }
                      >
                        <Play size={13} /> Play in Studio
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Legal & Educational Disclaimer Footer */}
          <div
            style={{
              marginTop: 12,
              padding: "14px 18px",
              borderRadius: 10,
              background: "rgba(10, 14, 23, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <Scale size={16} color="var(--strike-neon)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--text-secondary)" }}>Educational & Creative Use Notice:</strong>{" "}
              FretTabRunner is an open-source, local interactive tablature learning and composition tool. It does not host, publish, or distribute any proprietary sheet music or copyrighted music compositions. Users are solely responsible for ensuring that any tablature, audio, or media files they author, import, or export comply with applicable copyright laws in their jurisdiction.
            </div>
          </div>
        </div>
      </div>

      {isAlbumModalOpen && (
        <AlbumManagerModal onClose={() => setIsAlbumModalOpen(false)} />
      )}
    </div>
  );
};
