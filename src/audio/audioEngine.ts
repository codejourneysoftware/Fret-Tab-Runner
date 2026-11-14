import { PolyphonicGuitarSynth } from "./karplusStrongSynth";
import { MetronomeSynth } from "./metronomeSynth";

/**
 * Coordinates Karplus-Strong string synthesis, metronome clicks, and HTMLAudioElement backing tracks.
 */
export class FretStackAudioEngine {
  public readonly guitarSynth = new PolyphonicGuitarSynth();
  public readonly metronome = new MetronomeSynth();

  private audioElement: HTMLAudioElement | null = null;
  private loadedSourceUrl: string | null = null;
  private playbackRate = 1.0;
  private musicVolume = 0.85;
  private isMusicMuted = false;

  public loadBackingAudioUrl(url: string | null): void {
    if (!url) {
      this.unloadBackingAudio();
      return;
    }
    if (this.loadedSourceUrl === url && this.audioElement) {
      return;
    }
    this.unloadBackingAudio();
    const audio = new Audio(url);
    audio.preload = "auto";
    audio.preservesPitch = true;
    audio.playbackRate = this.playbackRate;
    audio.volume = this.isMusicMuted ? 0 : this.musicVolume;
    this.audioElement = audio;
    this.loadedSourceUrl = url;
  }

  public unloadBackingAudio(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = "";
      this.audioElement = null;
    }
    this.loadedSourceUrl = null;
  }

  public get hasBackingAudio(): boolean {
    return this.audioElement !== null && this.loadedSourceUrl !== null;
  }

  public get currentBackingTimeSeconds(): number {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  public get isBackingPlaying(): boolean {
    return Boolean(this.audioElement && !this.audioElement.paused && !this.audioElement.ended);
  }

  public playBacking(atSeconds: number): void {
    if (!this.audioElement) return;
    const clamped = Math.max(0, atSeconds);
    if (Math.abs(this.audioElement.currentTime - clamped) > 0.04) {
      this.audioElement.currentTime = clamped;
    }
    this.audioElement.playbackRate = this.playbackRate;
    this.audioElement.volume = this.isMusicMuted ? 0 : this.musicVolume;
    void this.audioElement.play().catch(() => {
      // Ignore autoplay blocks before user gesture
    });
  }

  public pauseBacking(): void {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
  }

  public seekBacking(seconds: number): void {
    if (!this.audioElement) return;
    this.audioElement.currentTime = Math.max(0, seconds);
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = Math.max(0.25, Math.min(4.0, rate));
    if (this.audioElement) {
      this.audioElement.playbackRate = this.playbackRate;
    }
  }

  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      this.audioElement.volume = this.isMusicMuted ? 0 : this.musicVolume;
    }
  }

  public setMusicMuted(muted: boolean): void {
    this.isMusicMuted = muted;
    if (this.audioElement) {
      this.audioElement.volume = this.isMusicMuted ? 0 : this.musicVolume;
    }
  }

  public triggerString(
    frequency: number,
    stringNumber: number,
    velocity = 0.85,
    durationSeconds?: number
  ): void {
    this.guitarSynth.pluck(frequency, stringNumber, velocity, durationSeconds);
  }

  public triggerMetronome(accented: boolean): void {
    this.metronome.click(accented);
  }
}

export const sharedAudioEngine = new FretStackAudioEngine();
