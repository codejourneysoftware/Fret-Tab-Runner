import React from "react";
import { ALBUM_COVER_PRESETS, AlbumCoverPreset } from "../core/albumModel";

interface AlbumCoverArtProps {
  preset: AlbumCoverPreset;
  customDataUrl?: string;
  size?: number;
  borderRadius?: number;
}

export const AlbumCoverArt: React.FC<AlbumCoverArtProps> = ({
  preset,
  customDataUrl,
  size = 64,
  borderRadius = 10,
}) => {
  if (customDataUrl) {
    return (
      <img
        src={customDataUrl}
        alt="Album Cover"
        style={{
          width: size,
          height: size,
          borderRadius,
          objectFit: "cover",
          border: "1px solid rgba(255,255,255,0.18)",
          flexShrink: 0,
        }}
      />
    );
  }

  const info =
    ALBUM_COVER_PRESETS.find((p) => p.id === preset) ?? ALBUM_COVER_PRESETS[0];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius,
        background: `linear-gradient(135deg, ${info.gradient[0]}, ${info.gradient[1]})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.48),
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.35)",
        border: "1px solid rgba(255,255,255,0.18)",
        flexShrink: 0,
      }}
      title={info.displayName}
    >
      {info.emoji}
    </div>
  );
};
