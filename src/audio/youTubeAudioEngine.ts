/**
 * YouTube Audio & Video Engine for FretTabRunner
 * Manages loading of the YouTube IFrame API and bi-directional playback synchronization.
 */

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export type YouTubePlayerState =
  | "unstarted"
  | "ended"
  | "playing"
  | "paused"
  | "buffering"
  | "cued"
  | "error";

export interface YouTubeEngineState {
  isReady: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  videoId: string | null;
  errorCode: number | null;
}

export type YouTubeListener = (state: YouTubeEngineState) => void;

/**
 * Extracts an 11-character YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=guOi0UaE9EI&list=...
 * - https://youtu.be/guOi0UaE9EI
 * - https://www.youtube.com/embed/guOi0UaE9EI
 * - https://www.youtube.com/shorts/guOi0UaE9EI
 * - https://music.youtube.com/watch?v=guOi0UaE9EI
 * - Raw 11-character video ID
 */
export function extractYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Standard watch query: ?v=ID or &v=ID
  const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vMatch) return vMatch[1];

  // youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // embed, shorts, or v/
  const pathMatch = trimmed.match(/(?:embed|shorts|v)\/([a-zA-Z0-9_-]{11})/);
  if (pathMatch) return pathMatch[1];

  // Direct 11-character ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

let apiScriptPromise: Promise<void> | null = null;

export function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }
  if (apiScriptPromise) {
    return apiScriptPromise;
  }

  apiScriptPromise = new Promise((resolve) => {
    // If the script is already added to DOM
    const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      const first = document.getElementsByTagName("script")[0];
      first?.parentNode?.insertBefore(script, first);
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevReady === "function") prevReady();
      resolve();
    };

    // Polling fallback in case onYouTubeIframeAPIReady already triggered
    const interval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(interval);
        resolve();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, 10000);
  });

  return apiScriptPromise;
}

export class YouTubeAudioEngine {
  private player: any = null;
  private containerElementId: string | null = null;
  private _isReady = false;
  private _currentVideoId: string | null = null;
  private _isPlaying = false;
  private _isBuffering = false;
  private _lastReportedTime = 0;
  private _duration = 0;
  private _volume = 1.0;
  private _isMuted = false;
  private _playbackRate = 1.0;
  private _errorCode: number | null = null;

  private pendingVideoId: string | null = null;
  private pendingSeekSeconds: number | null = null;
  private pendingPlay = false;

  private listeners = new Set<YouTubeListener>();

  public get isReady(): boolean {
    return this._isReady && this.player !== null;
  }

  public get isPlayingBack(): boolean {
    return this._isPlaying;
  }

  public get isBuffering(): boolean {
    return this._isBuffering;
  }

  public get currentTime(): number {
    if (this.player && typeof this.player.getCurrentTime === "function") {
      try {
        const t = this.player.getCurrentTime();
        if (typeof t === "number" && !isNaN(t)) {
          this._lastReportedTime = t;
        }
      } catch {
        // Ignore cross-origin access during transitions
      }
    }
    return this._lastReportedTime;
  }

  public get duration(): number {
    if (this.player && typeof this.player.getDuration === "function") {
      try {
        const d = this.player.getDuration();
        if (typeof d === "number" && !isNaN(d)) {
          this._duration = d;
        }
      } catch {
        // Ignore
      }
    }
    return this._duration;
  }

  public get videoId(): string | null {
    return this._currentVideoId;
  }

  public get errorCode(): number | null {
    return this._errorCode;
  }

  public subscribe(listener: YouTubeListener): () => void {
    this.listeners.add(listener);
    listener(this.getStateSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snap = this.getStateSnapshot();
    this.listeners.forEach((l) => l(snap));
  }

  private getStateSnapshot(): YouTubeEngineState {
    return {
      isReady: this.isReady,
      isPlaying: this._isPlaying,
      isBuffering: this._isBuffering,
      currentTime: this.currentTime,
      duration: this.duration,
      videoId: this._currentVideoId,
      errorCode: this._errorCode,
    };
  }

  public async mount(containerElementId: string): Promise<void> {
    if (this.containerElementId === containerElementId && this.player) {
      return;
    }
    this.containerElementId = containerElementId;
    await loadYouTubeIframeApi();

    if (!window.YT || !window.YT.Player) {
      console.warn("YouTube IFrame API not yet ready");
      return;
    }

    const container = document.getElementById(containerElementId);
    if (!container) return;

    if (this.player && typeof this.player.destroy === "function") {
      try {
        this.player.destroy();
      } catch {
        // Ignore
      }
      this.player = null;
      this._isReady = false;
    }

    this.player = new window.YT.Player(containerElementId, {
      height: "100%",
      width: "100%",
      videoId: this.pendingVideoId || this._currentVideoId || "",
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        enablejsapi: 1,
        fs: 0,
        origin: typeof window !== "undefined" ? window.location.origin : undefined,
      },
      events: {
        onReady: (event: any) => this.handlePlayerReady(event),
        onStateChange: (event: any) => this.handlePlayerStateChange(event),
        onError: (event: any) => this.handlePlayerError(event),
      },
    });
  }

  private handlePlayerReady(_event: any): void {
    this._isReady = true;
    this._errorCode = null;
    this.applyVolumeAndMute();
    this.applyPlaybackRate();

    if (this.pendingVideoId) {
      const vid = this.pendingVideoId;
      const seekSec = this.pendingSeekSeconds ?? 0;
      this.pendingVideoId = null;
      this.pendingSeekSeconds = null;
      this.loadVideo(vid, seekSec, this.pendingPlay);
      this.pendingPlay = false;
    } else if (this.pendingSeekSeconds !== null) {
      this.seek(this.pendingSeekSeconds);
      this.pendingSeekSeconds = null;
      if (this.pendingPlay) {
        this.play();
        this.pendingPlay = false;
      }
    } else if (this.pendingPlay) {
      this.play();
      this.pendingPlay = false;
    }

    this.notify();
  }

  private handlePlayerStateChange(event: any): void {
    const state = event.data;
    // YT.PlayerState: -1 = UNSTARTED, 0 = ENDED, 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, 5 = CUED
    if (state === 1) {
      this._isPlaying = true;
      this._isBuffering = false;
    } else if (state === 2) {
      this._isPlaying = false;
      this._isBuffering = false;
    } else if (state === 3) {
      this._isBuffering = true;
    } else if (state === 0) {
      this._isPlaying = false;
      this._isBuffering = false;
    }
    this.notify();
  }

  private handlePlayerError(event: any): void {
    this._errorCode = Number(event.data) || -1;
    console.warn(`YouTube Player encountered error code: ${this._errorCode}`);
    this.notify();
  }

  public loadVideo(videoId: string, startSeconds = 0, autoPlay = false): void {
    this._errorCode = null;
    if (!this.isReady) {
      this.pendingVideoId = videoId;
      this.pendingSeekSeconds = startSeconds;
      this.pendingPlay = autoPlay;
      return;
    }

    if (this._currentVideoId === videoId) {
      if (startSeconds > 0) {
        this.seek(startSeconds);
      }
      if (autoPlay) {
        this.play();
      }
      return;
    }

    this._currentVideoId = videoId;
    try {
      if (autoPlay) {
        this.player.loadVideoById({
          videoId,
          startSeconds: Math.max(0, startSeconds),
        });
        this._isPlaying = true;
      } else {
        this.player.cueVideoById({
          videoId,
          startSeconds: Math.max(0, startSeconds),
        });
        this._isPlaying = false;
      }
    } catch (err) {
      console.warn("Failed to load YouTube video", err);
    }
    this.notify();
  }

  public play(atSeconds?: number): void {
    this.pendingPlay = true;
    if (!this.isReady) {
      if (atSeconds !== undefined) {
        this.pendingSeekSeconds = atSeconds;
      }
      return;
    }

    try {
      if (atSeconds !== undefined && !isNaN(atSeconds)) {
        const clamped = Math.max(0, atSeconds);
        this.player.seekTo(clamped, true);
        this._lastReportedTime = clamped;
      }
      this.applyVolumeAndMute();
      this.applyPlaybackRate();
      this.player.playVideo();
      this._isPlaying = true;
      this.pendingPlay = false;
      this.notify();
    } catch (err) {
      console.warn("YouTube play failed", err);
    }
  }

  public pause(): void {
    this.pendingPlay = false;
    if (!this.isReady) return;
    try {
      this.player.pauseVideo();
      this._isPlaying = false;
      this.notify();
    } catch {
      // Ignore
    }
  }

  public seek(seconds: number): void {
    const clamped = Math.max(0, seconds);
    if (!this.isReady) {
      this.pendingSeekSeconds = clamped;
      return;
    }
    try {
      this.player.seekTo(clamped, true);
      this._lastReportedTime = clamped;
      this.notify();
    } catch {
      // Ignore
    }
  }

  public stop(): void {
    this.pendingPlay = false;
    if (!this.isReady) return;
    try {
      this.player.stopVideo();
      this._isPlaying = false;
      this.notify();
    } catch {
      // Ignore
    }
  }

  public clear(): void {
    this.stop();
    this._currentVideoId = null;
    this.pendingVideoId = null;
    this.pendingSeekSeconds = null;
    this._errorCode = null;
    this.notify();
  }

  public setVolume(volumeFraction: number): void {
    this._volume = Math.max(0, Math.min(1, volumeFraction));
    this.applyVolumeAndMute();
  }

  public setMuted(muted: boolean): void {
    this._isMuted = muted;
    this.applyVolumeAndMute();
  }

  private applyVolumeAndMute(): void {
    if (!this.isReady) return;
    try {
      if (this._isMuted) {
        this.player.mute();
      } else {
        this.player.unMute();
        this.player.setVolume(Math.round(this._volume * 100));
      }
    } catch {
      // Ignore
    }
  }

  public setPlaybackRate(rate: number): void {
    this._playbackRate = Math.max(0.25, Math.min(2.0, rate));
    this.applyPlaybackRate();
  }

  private applyPlaybackRate(): void {
    if (!this.isReady) return;
    try {
      if (typeof this.player.setPlaybackRate === "function") {
        this.player.setPlaybackRate(this._playbackRate);
      }
    } catch {
      // Ignore
    }
  }
}

export const sharedYouTubeEngine = new YouTubeAudioEngine();
