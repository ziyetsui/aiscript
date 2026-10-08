// Typewriter sound synthesised with Web Audio (spec 0002 §9.4): no audio files, no bundle weight.
// A key click per character (random pitch, softer for punctuation), a carriage return per paragraph, a bell per turn.
let ctx: AudioContext | null = null;
let enabled = (() => { try { return localStorage.getItem('tw-sound') !== 'off'; } catch { return true; } })();

export const soundOn = () => enabled;
export function setSound(on: boolean): void {
  enabled = on;
  try { localStorage.setItem('tw-sound', on ? 'on' : 'off'); } catch { /* storage may be unavailable */ }
  if (on) ensure();
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
  if (!c || !enabled) return;
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
  g.gain.value = gain;
  src.connect(bp).connect(g).connect(c.destination);
  src.start();
}

export function keyClick(ch: string): void {
  if (/\s/.test(ch)) return;
  const punct = /[，。、；：！？,.;:!?“”"'（）()—…]/.test(ch);
  noiseBurst(0.03, 1800 + Math.random() * 1400, punct ? 0.12 : 0.22);
}

export function carriageReturn(): void {
  noiseBurst(0.12, 700, 0.18);
}

export function bell(): void {
  const c = ensure();
  if (!c || !enabled) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.value = 2093;
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.08, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.9);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.95);
}
