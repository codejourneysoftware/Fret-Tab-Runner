/**
 * Extended Karplus-Strong physical string modeling synthesizer using Web Audio API.
 * Mirrors the exact string-dependent FIR bridge reflection damping, fractional delay
 * linear interpolation, plectrum attack transient, DC-block highpass, and brilliance EQ.
 */

const STRING_PHYSICS: Record<number, { sVal: number; decay: number; brightness: number }> = {
  1: { sVal: 0.16, decay: 0.9989, brightness: 0.95 }, // High E
  2: { sVal: 0.18, decay: 0.9986, brightness: 0.95 }, // B
  3: { sVal: 0.21, decay: 0.9983, brightness: 0.88 }, // G
  4: { sVal: 0.25, decay: 0.9979, brightness: 0.88 }, // D
  5: { sVal: 0.29, decay: 0.9975, brightness: 0.82 }, // A
  6: { sVal: 0.32, decay: 0.9970, brightness: 0.82 }, // Low E
};

function renderKarplusStrongBuffer(
  ctx: AudioContext,
  frequency: number,
  stringNumber: number,
  velocity: number
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const clampedFreq = Math.max(35.0, Math.min(3000.0, frequency));
  const clampedStr = Math.max(1, Math.min(6, stringNumber));
  const phys = STRING_PHYSICS[clampedStr] ?? STRING_PHYSICS[6];

  const targetDelay = sampleRate / clampedFreq - phys.sVal;
  const intDelay = Math.max(2, Math.floor(targetDelay));
  const fracDelay = targetDelay - intDelay;
  const bufLen = intDelay + 2;
  const delayLine = new Float32Array(bufLen);

  // Plectrum excitation with pick-snap transient
  let lpNoise = 0.0;
  for (let i = 0; i < bufLen; i++) {
    const white = Math.random() * 2.0 - 1.0;
    lpNoise = lpNoise * (1.0 - phys.brightness) + white * phys.brightness;
    const transient = i < 8 ? ((8 - i) / 8.0) * white * 0.45 : 0.0;
    delayLine[i] = (lpNoise + transient) * velocity;
  }

  const maxSamples = Math.floor(sampleRate * 3.5);
  const out = new Float32Array(maxSamples);

  let writeIdx = 0;
  let prevSample = 0.0;
  let envelope = 1.0;

  // DC-block highpass state
  let hpX1 = 0.0;
  let hpY1 = 0.0;
  const hpR = 0.992;

  // Brilliance high-shelf EQ (+3.2 dB @ 3.5 kHz)
  const w0 = (2.0 * Math.PI * 3500.0) / sampleRate;
  const A = Math.pow(10.0, 3.2 / 40.0);
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = (sinW0 / 2.0) * Math.sqrt(2.0);
  const sqrtA = Math.sqrt(A);
  const a0 = A + 1.0 - (A - 1.0) * cosW0 + 2.0 * sqrtA * alpha;
  const eqB0 = (A * (A + 1.0 + (A - 1.0) * cosW0 + 2.0 * sqrtA * alpha)) / a0;
  const eqB1 = (-2.0 * A * (A - 1.0 + (A + 1.0) * cosW0)) / a0;
  const eqB2 = (A * (A + 1.0 + (A - 1.0) * cosW0 - 2.0 * sqrtA * alpha)) / a0;
  const eqA1 = (2.0 * (A - 1.0 - (A + 1.0) * cosW0)) / a0;
  const eqA2 = (A + 1.0 - (A - 1.0) * cosW0 - 2.0 * sqrtA * alpha) / a0;

  let eqX1 = 0.0;
  let eqX2 = 0.0;
  let eqY1 = 0.0;
  let eqY2 = 0.0;

  let actualLength = maxSamples;
  const minActiveSamples = Math.floor(sampleRate * 0.15);

  for (let i = 0; i < maxSamples; i++) {
    const readIdx0 = (writeIdx - intDelay + bufLen) % bufLen;
    const readIdx1 = (readIdx0 - 1 + bufLen) % bufLen;
    const sample =
      delayLine[readIdx0] * (1.0 - fracDelay) + delayLine[readIdx1] * fracDelay;

    const filtered = (1.0 - phys.sVal) * sample + phys.sVal * prevSample;
    prevSample = sample;
    delayLine[writeIdx] = filtered * phys.decay;
    writeIdx = (writeIdx + 1) % bufLen;

    // DC-block highpass
    const hpOut = sample - hpX1 + hpR * hpY1;
    hpX1 = sample;
    hpY1 = hpOut;

    // Brilliance high-shelf EQ
    const eqOut =
      eqB0 * hpOut + eqB1 * eqX1 + eqB2 * eqX2 - eqA1 * eqY1 - eqA2 * eqY2;
    eqX2 = eqX1;
    eqX1 = hpOut;
    eqY2 = eqY1;
    eqY1 = eqOut;

    out[i] = Math.tanh(eqOut * 0.65);

    envelope = envelope * 0.9997 + Math.abs(sample) * 0.0003;
    if (i > minActiveSamples && envelope < 0.00005) {
      actualLength = i + 1;
      break;
    }
  }

  const audioBuffer = ctx.createBuffer(1, actualLength, sampleRate);
  audioBuffer.copyToChannel(out.subarray(0, actualLength), 0);
  return audioBuffer;
}

export class PolyphonicGuitarSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private volume = 0.85;

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public pluck(
    frequency: number,
    stringNumber: number,
    velocity = 0.85,
    durationSeconds?: number
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const key = `${Math.round(frequency * 10)}_${stringNumber}`;
    let buf = this.bufferCache.get(key);
    if (!buf) {
      buf = renderKarplusStrongBuffer(ctx, frequency, stringNumber, 0.9);
      if (this.bufferCache.size > 120) {
        const firstKey = this.bufferCache.keys().next().value;
        if (firstKey) this.bufferCache.delete(firstKey);
      }
      this.bufferCache.set(key, buf);
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const noteGain = ctx.createGain();
    const velGain = Math.max(0.1, Math.min(1.0, velocity));
    noteGain.gain.setValueAtTime(velGain, ctx.currentTime);

    if (durationSeconds && durationSeconds > 0.05 && durationSeconds < buf.duration) {
      const releaseStart = ctx.currentTime + durationSeconds;
      noteGain.gain.setValueAtTime(velGain, releaseStart);
      noteGain.gain.exponentialRampToValueAtTime(0.001, releaseStart + 0.14);
    }

    src.connect(noteGain);
    noteGain.connect(this.masterGain);
    src.start();
    if (durationSeconds && durationSeconds < buf.duration) {
      src.stop(ctx.currentTime + durationSeconds + 0.16);
    }
  }
}
