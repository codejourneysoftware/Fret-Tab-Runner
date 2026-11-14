import React, { useState } from "react";
import { FolderPlus, Download, Upload, Trash2, RotateCcw, X, Disc3 } from "lucide-react";
import {
  ALBUM_COVER_PRESETS,
  AlbumCoverPreset,
  decodeAlbumsBackup,
  encodeAlbumsBackup,
} from "../core/albumModel";
import { openTextFileDialog, saveTextFileDialog } from "../core/fileBridge";
import { useFretStack } from "../state/useFretStackStore";
import { AlbumCoverArt } from "./AlbumCoverArt";

interface AlbumManagerModalProps {
  onClose: () => void;
}

export const AlbumManagerModal: React.FC<AlbumManagerModalProps> = ({
  onClose,
}) => {
  const {
    albums,
    activeAlbumId,
    setActiveAlbumId,
    createAlbum,
    deleteAlbum,
    restoreAlbums,
    resetDemoAlbum,
    saveCurrentSongToActiveAlbum,
  } = useFretStack();

  const [newName, setNewName] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("My Guitar Collection");
  const [newPreset, setNewPreset] = useState<AlbumCoverPreset>("space-cat");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createAlbum(newName, newSubtitle, newPreset);
    setNewName("");
  };

  const handleBackup = async () => {
    const json = encodeAlbumsBackup(albums);
    const ok = await saveTextFileDialog("FretTabRunner_Albums_Backup.json", json, [
      { name: "JSON Backup", extensions: ["json"] },
    ]);
    if (ok) setStatusMsg("Albums backup saved!");
  };

  const handleRestore = async () => {
    const picked = await openTextFileDialog([
      { name: "JSON Backup", extensions: ["json"] },
    ]);
    if (!picked) return;
    try {
      const restored = decodeAlbumsBackup(picked.contents);
      restoreAlbums(restored);
      setStatusMsg(`Restored ${restored.length} album(s).`);
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : "Invalid backup file.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: 660, padding: 20 }}
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
            <Disc3 size={18} color="#00e5ff" />
            <h3 style={{ margin: 0, fontSize: 16 }}>Album & Library Manager</h3>
          </div>
          <button className="btn" onClick={onClose} style={{ padding: 5 }}>
            <X size={15} />
          </button>
        </div>

        {/* Create New Album */}
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: "var(--bg-dark)",
            border: "1px solid var(--border-subtle)",
            marginBottom: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700 }}>Create New Album</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              className="input-dark"
              placeholder="Album Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              type="text"
              className="input-dark"
              placeholder="Subtitle"
              value={newSubtitle}
              onChange={(e) => setNewSubtitle(e.target.value)}
            />
            <button className="btn btn-neon" onClick={handleCreate}>
              <FolderPlus size={14} /> Create
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ALBUM_COVER_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setNewPreset(p.id)}
                style={{
                  border:
                    newPreset === p.id
                      ? "2px solid #00e5ff"
                      : "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8,
                  padding: 3,
                  background: "transparent",
                  cursor: "pointer",
                }}
                title={p.displayName}
              >
                <AlbumCoverArt preset={p.id} size={32} borderRadius={6} />
              </button>
            ))}
          </div>
        </div>

        {/* Existing Albums */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflowY: "auto" }}>
          {albums.map((album) => {
            const isActive = album.id === activeAlbumId;
            return (
              <div
                key={album.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 10,
                  borderRadius: 10,
                  background: isActive ? "rgba(0,229,255,0.08)" : "var(--bg-dark)",
                  border: isActive
                    ? "1px solid rgba(0,229,255,0.5)"
                    : "1px solid var(--border-subtle)",
                }}
              >
                <AlbumCoverArt
                  preset={album.coverPreset}
                  customDataUrl={album.customCoverDataUrl}
                  size={44}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{album.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {album.subtitle} • {album.songs.length} song(s)
                  </div>
                </div>
                {!isActive && (
                  <button
                    className="btn"
                    onClick={() => setActiveAlbumId(album.id)}
                  >
                    Set Active
                  </button>
                )}
                <button
                  className="btn btn-danger"
                  onClick={() => deleteAlbum(album.id)}
                  title="Delete Album"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 14,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn" onClick={handleBackup}>
              <Download size={14} /> Backup All
            </button>
            <button className="btn" onClick={handleRestore}>
              <Upload size={14} /> Restore
            </button>
            <button className="btn" onClick={resetDemoAlbum}>
              <RotateCcw size={14} /> Reset Demo
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {statusMsg && (
              <span style={{ fontSize: 11, color: "#00e5ff" }}>{statusMsg}</span>
            )}
            <button
              className="btn btn-neon"
              onClick={() => {
                saveCurrentSongToActiveAlbum();
                onClose();
              }}
            >
              Save Current Song & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
