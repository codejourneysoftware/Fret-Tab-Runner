import React, { useEffect, useState } from "react";
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  Radio,
  Tv,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  extractYouTubeVideoId,
  sharedYouTubeEngine,
  YouTubeEngineState,
} from "../audio/youTubeAudioEngine";
import { openExternalUrl } from "../core/fileBridge";
import { useFretStack } from "../state/useFretStackStore";

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
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(false);
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

  // When song or webUrl changes, un-dismiss the player if it was closed
  useEffect(() => {
    if (videoId) {
      setIsDismissed(false);
    }
  }, [videoId, song.id]);

  if (!isYouTubeSource || !videoId) {
    return (
      <div
        id="fret-tab-runner-yt-player-container"
        style={{
          position: "fixed",
          bottom: -9999,
          left: -9999,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <div id="fret-tab-runner-yt-player" />
      </div>
    );
  }

  return (
    <>
      {/* Persistent DOM element hosting YouTube iframe so it never gets unmounted */}
      <div
        id="fret-tab-runner-yt-player-container"
        style={{
          position: "fixed",
          bottom: isDismissed || isMinimized ? -9999 : 24,
          right: isDismissed || isMinimized ? -9999 : 24,
          width: isDismissed || isMinimized ? 1 : 320,
          height: isDismissed || isMinimized ? 1 : 180,
          opacity: isDismissed || isMinimized ? 0.01 : 1,
          pointerEvents: isDismissed || isMinimized ? "none" : "auto",
          zIndex: 9999,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.6), 0 0 15px rgba(0,229,255,0.3)",
          border: "1px solid rgba(0,229,255,0.4)",
          background: "#000",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Top Floating Control Bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            padding: "4px 8px",
            background:
              "linear-gradient(to bottom, rgba(10,14,23,0.92) 0%, rgba(10,14,23,0.4) 75%, transparent 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
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
            }}
          >
            <Tv size={12} color="#00e5ff" />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#fff",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {song.title || "YouTube Backing"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                fontSize: 9,
                padding: "1px 5px",
                borderRadius: 4,
                background: engineState.isPlaying
                  ? "rgba(0,229,255,0.25)"
                  : "rgba(255,255,255,0.1)",
                color: engineState.isPlaying ? "#00e5ff" : "var(--text-muted)",
              }}
            >
              {engineState.isBuffering
                ? "Buffering..."
                : engineState.isPlaying
                ? "Synced"
                : "Paused"}
            </span>
            <button
              className="btn"
              style={{ padding: 2, background: "rgba(0,0,0,0.5)" }}
              onClick={() => setIsMinimized(true)}
              title="Minimize to Pill"
            >
              <Minimize2 size={11} />
            </button>
            <button
              className="btn"
              style={{ padding: 2, background: "rgba(0,0,0,0.5)" }}
              onClick={() => setIsDismissed(true)}
              title="Hide Video (Audio Continues)"
            >
              <X size={11} />
            </button>
          </div>
        </div>

        {/* Target container where YT.Player is attached */}
        <div
          id="fret-tab-runner-yt-player"
          style={{ width: "100%", height: "100%" }}
        />

        {/* Error overlay if embed is restricted */}
        {engineState.errorCode && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.94)",
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
              Playback Restricted (Code {engineState.errorCode})
            </span>
            <p style={{ fontSize: 10, color: "var(--text-secondary)", margin: 0 }}>
              The video owner has restricted embedding on external sites.
            </p>
            <button
              className="btn btn-neon"
              style={{ fontSize: 10, padding: "3px 8px" }}
              onClick={() => openExternalUrl(song.audioSource.webUrl || "")}
            >
              <ExternalLink size={10} /> Open on YouTube
            </button>
          </div>
        )}
      </div>

      {/* Floating Pill when Minimized or Dismissed */}
      {(isMinimized || isDismissed) && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            background: "rgba(10, 14, 23, 0.92)",
            border: "1px solid rgba(0, 229, 255, 0.4)",
            borderRadius: 20,
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.5), 0 0 10px rgba(0,229,255,0.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Radio
            size={13}
            color={engineState.isPlaying ? "#00e5ff" : "var(--text-muted)"}
            className={engineState.isPlaying ? "animate-pulse" : ""}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#fff",
                maxWidth: 140,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {song.title || "YouTube Audio"}
            </span>
            <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
              {engineState.isPlaying ? "Playing in Sync" : "Paused"} •{" "}
              {song.audioSource.isMuted ? (
                <VolumeX size={9} style={{ display: "inline" }} />
              ) : (
                <Volume2 size={9} style={{ display: "inline" }} />
              )}
            </span>
          </div>

          <button
            className="btn btn-neon"
            style={{ padding: "3px 6px", fontSize: 10 }}
            onClick={() => {
              setIsMinimized(false);
              setIsDismissed(false);
            }}
            title="Expand YouTube Video"
          >
            <Maximize2 size={11} />
          </button>
        </div>
      )}
    </>
  );
};
