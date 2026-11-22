import React, { useEffect, useState } from "react";
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  Tv,
  X,
} from "lucide-react";
import {
  extractYouTubeVideoId,
  sharedYouTubeEngine,
  YouTubeEngineState,
} from "../audio/youTubeAudioEngine";
import { openExternalUrl } from "../core/fileBridge";
import { useFretStack } from "../state/useFretStackStore";

type PlayerSizeMode = "compact" | "standard" | "theater";

const SIZE_PRESETS: Record<PlayerSizeMode, { width: number; height: number; label: string }> = {
  compact: { width: 320, height: 180, label: "Compact (320×180)" },
  standard: { width: 420, height: 236, label: "Standard (420×236)" },
  theater: { width: 540, height: 304, label: "Theater (540×304)" },
};

export const YouTubeSyncHost: React.FC = () => {
  const { song } = useFretStack();
  const [engineState, setEngineState] = useState<YouTubeEngineState>({
    isReady: false,
    isPlaying: false,
    isBuffering: false,
    currentTime: 0,
    duration: 0,
    videoId: null,
    errorCode: null,
    isUserAction: false,
    isEnded: false,
  });

  const [sizeMode, setSizeMode] = useState<PlayerSizeMode>("compact");
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const isYouTubeSource =
    song.audioSource.sourceType === "External Stream / YouTube Link";
  const videoId = isYouTubeSource
    ? extractYouTubeVideoId(song.audioSource.webUrl)
    : null;

  // Mount YouTube engine into DOM container
  useEffect(() => {
    sharedYouTubeEngine.mount("fret-tab-runner-yt-player");
    const unsubscribe = sharedYouTubeEngine.subscribe((state) => {
      setEngineState(state);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // When song or webUrl changes, un-dismiss and load video
  useEffect(() => {
    if (isYouTubeSource && videoId) {
      setIsDismissed(false);
      sharedYouTubeEngine.loadVideo(videoId);
    }
  }, [isYouTubeSource, videoId, song.id]);

  // When playback starts from the runner engine, ensure the player is visible
  useEffect(() => {
    if (engineState.isPlaying && isDismissed) {
      setIsDismissed(false);
    }
  }, [engineState.isPlaying]);

  // If user dismisses the player, pause playback to comply with YouTube ToS
  // (audiovisual content must not play audio when video is hidden/dismissed)
  const handleClose = () => {
    sharedYouTubeEngine.pause();
    setIsDismissed(true);
  };

  const handleCycleSize = () => {
    setSizeMode((prev) => {
      if (prev === "compact") return "standard";
      if (prev === "standard") return "theater";
      return "compact";
    });
  };

  const isVisible = isYouTubeSource && Boolean(videoId) && !isDismissed;
  const currentDim = SIZE_PRESETS[sizeMode];

  return (
    <>
      {/* 
        Persistent DOM container hosting YouTube iframe.
        In compliance with YouTube API Terms of Service & Developer Policies:
        1. Audio is never separated from video (closing/hiding pauses playback).
        2. Iframe viewport meets standard minimum dimensions (320x180 16:9).
        3. Header and controls are placed outside and above the iframe to ensure zero obscuring of video, title, or ads.
      */}
      <div
        id="fret-tab-runner-yt-player-container"
        style={{
          position: "fixed",
          bottom: isVisible ? 24 : -9999,
          right: isVisible ? 24 : -9999,
          width: currentDim.width,
          opacity: isVisible ? 1 : 0.001,
          pointerEvents: isVisible ? "auto" : "none",
          zIndex: 9999,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: isVisible
            ? "0 10px 30px rgba(0,0,0,0.7), 0 0 20px rgba(0,229,255,0.25)"
            : "none",
          border: isVisible ? "1px solid rgba(0,229,255,0.4)" : "none",
          background: "#0a0e17",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
        }}
      >
        {/* Dedicated Top Header Bar (Positioned ABOVE the iframe, never overlaying video) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 10px",
            background: "rgba(10, 14, 23, 0.98)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            <Tv size={13} color="#00e5ff" />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
              title={song.title || "YouTube Backing Video"}
            >
              {song.title || "YouTube Backing Video"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                fontSize: 9,
                padding: "1px 5px",
                borderRadius: 4,
                fontWeight: 600,
                background: engineState.isPlaying
                  ? "rgba(0,229,255,0.2)"
                  : "rgba(255,255,255,0.08)",
                color: engineState.isPlaying ? "#00e5ff" : "var(--text-muted)",
              }}
            >
              {engineState.isBuffering
                ? "Buffering"
                : engineState.isPlaying
                ? "In Sync"
                : "Paused"}
            </span>

            {/* Resize Toggle */}
            <button
              className="btn"
              style={{ padding: 3, background: "rgba(255,255,255,0.06)" }}
              onClick={handleCycleSize}
              title={`Resize: ${currentDim.label} - Click to cycle size`}
            >
              {sizeMode === "theater" ? (
                <Minimize2 size={11} />
              ) : (
                <Maximize2 size={11} />
              )}
            </button>

            {/* Watch on YouTube Attribution Link */}
            {song.audioSource.webUrl && (
              <button
                className="btn"
                style={{ padding: 3, background: "rgba(255,255,255,0.06)" }}
                onClick={() => openExternalUrl(song.audioSource.webUrl || "")}
                title="Watch on YouTube"
              >
                <ExternalLink size={11} />
              </button>
            )}

            {/* Close Player (pauses playback and hides) */}
            <button
              className="btn"
              style={{ padding: 3, background: "rgba(255,255,255,0.06)" }}
              onClick={handleClose}
              title="Close YouTube Player (pauses playback)"
            >
              <X size={11} />
            </button>
          </div>
        </div>

        {/* 
          Target container where YT.Player is attached.
          Strictly unobscured with exact 16:9 aspect ratio.
        */}
        <div
          style={{
            width: currentDim.width,
            height: currentDim.height,
            background: "#000",
            position: "relative",
          }}
        >
          <div
            id="fret-tab-runner-yt-player"
            style={{ width: "100%", height: "100%" }}
          />

          {/* Embed Restriction Fallback Notice */}
          {engineState.errorCode && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(15, 23, 42, 0.95)",
                padding: 14,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: 8,
                zIndex: 20,
              }}
            >
              <span style={{ fontSize: 11, color: "#ff4d4f", fontWeight: 700 }}>
                Embedding Restricted by Video Owner (Code {engineState.errorCode})
              </span>
              <p style={{ fontSize: 10, color: "var(--text-secondary)", margin: 0 }}>
                This video can only be played directly on YouTube.
              </p>
              <button
                className="btn btn-neon"
                style={{ fontSize: 10, padding: "3px 8px" }}
                onClick={() => openExternalUrl(song.audioSource.webUrl || "")}
              >
                <ExternalLink size={10} /> Watch on YouTube
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
