// Typewriter sound synthesised with Web Audio (spec 0002 §9.4): no audio files, no bundle weight.
// Manual editor input only: key clicks and carriage returns. AI updates do not call these sounds.
let ctx: AudioContext | null = null;
let volume = (() => { try { const v = Number(localStorage.getItem('tw-volume')); return Number.isFinite(v) && localStorage.getItem('tw-volume') !== null ? v : 1; } catch { return 1; } })();

export const soundVolume = () => volume;
/** 0–1, applied on top of the per-sound gain. */
export function setVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
  try { localStorage.setItem('tw-volume', String(volume)); } catch { /* storage may be unavailable */ }
}

function ensure(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function noiseBurst(dur: number, freq: number, gain: number): void {
  const c = ensure();
  if (!c || volume === 0) return;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = 1.4;
  const g = c.createGain();
  g.gain.value = gain * volume;
  src.connect(bp).connect(g).connect(c.destination);
  src.start();
}

export function keyClick(ch: string): void {
  if (!ch) return;
  const punct = /[，。、；：！？,.;:!?“”"'（）()—…]/.test(ch);
  noiseBurst(0.03, 1800 + Math.random() * 1400, punct ? 0.12 : 0.22);
}

export function carriageReturn(): void {
  noiseBurst(0.12, 700, 0.18);
}
