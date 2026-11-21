import React, { useMemo, useState } from "react";
import { Download, Upload, Copy, Check, X, FileCode2 } from "lucide-react";
import {
  decodeSongFromJSON,
  encodeSongToJSON,
  exportToASCIITab,
  exportToMusicXML,
} from "../core/exporters";
import { openTextFileDialog, saveTextFileDialog } from "../core/fileBridge";
import { useFretStack } from "../state/useFretStackStore";

interface ExportImportModalProps {
  onClose: () => void;
}

type TabFormat = "json" | "musicxml" | "ascii";

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  onClose,
}) => {
  const { song, currentTrackIndex, loadSongIntoStudio } = useFretStack();
  const [activeTab, setActiveTab] = useState<TabFormat>("json");
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const previewContent = useMemo(() => {
    if (activeTab === "json") return encodeSongToJSON(song);
    if (activeTab === "musicxml") return exportToMusicXML(song);
    return exportToASCIITab(song, currentTrackIndex);
  }, [activeTab, currentTrackIndex, song]);

  const safeFileBase = song.title.replace(/[^a-z0-9_-]/gi, "_") || "song";

  const handleSave = async () => {
    const extMap: Record<TabFormat, { ext: string; name: string; extensions: string[] }> = {
      json: { ext: "json", name: "Song JSON", extensions: ["json", "fretstack"] },
      musicxml: { ext: "musicxml", name: "MusicXML 4.0", extensions: ["musicxml", "xml"] },
      ascii: { ext: "tab.txt", name: "ASCII Tablature", extensions: ["txt", "tab"] },
    };
    const meta = extMap[activeTab];
    const ok = await saveTextFileDialog(`${safeFileBase}.${meta.ext}`, previewContent, [
      { name: meta.name, extensions: meta.extensions },
    ]);
    if (ok) setStatusMsg(`Saved ${safeFileBase}.${meta.ext}`);
  };

  const handleImportJSON = async () => {
    const picked = await openTextFileDialog([
      { name: "Song Files (*.json, *.fretstack)", extensions: ["json", "fretstack"] },
      { name: "All Files (*.*)", extensions: ["*"] },
    ]);
    if (!picked) return;
    try {
      const imported = decodeSongFromJSON(picked.contents);
      loadSongIntoStudio(imported);
      onClose();
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : "Failed to parse JSON");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: 720, padding: 20 }}
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
            <FileCode2 size={18} color="#00e5ff" />
            <h3 style={{ margin: 0, fontSize: 16 }}>
              Export & Import Open Standards
            </h3>
          </div>
          <button className="btn" onClick={onClose} style={{ padding: 5 }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <button
            className={activeTab === "json" ? "btn btn-neon" : "btn"}
            onClick={() => setActiveTab("json")}
          >
            Song JSON (.json / .fretstack)
          </button>
          <button
            className={activeTab === "musicxml" ? "btn btn-neon" : "btn"}
            onClick={() => setActiveTab("musicxml")}
          >
            MusicXML 4.0 (.musicxml)
          </button>
          <button
            className={activeTab === "ascii" ? "btn btn-neon" : "btn"}
            onClick={() => setActiveTab("ascii")}
          >
            ASCII Tab (.tab.txt)
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={handleImportJSON}>
            <Upload size={14} /> Import Song (.json / .fretstack)
          </button>
        </div>

        <pre
          className="mono"
          style={{
            background: "var(--bg-dark)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 10,
            padding: 12,
            height: 300,
            overflow: "auto",
            fontSize: 11,
            lineHeight: 1.5,
            margin: 0,
            userSelect: "text",
          }}
        >
          {previewContent}
        </pre>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 14,
          }}
        >
          <span style={{ fontSize: 11, color: "#00e5ff" }}>
            {statusMsg ?? ""}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button className="btn btn-neon" onClick={handleSave}>
              <Download size={14} /> Save File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
