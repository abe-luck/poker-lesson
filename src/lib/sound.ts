import type { Volume } from "@/store/settingsStore";

export type SoundName = "deal" | "flip" | "chips" | "turn" | "win";

const GAIN: Record<Volume, number> = { low: 0.05, medium: 0.12, high: 0.25 };

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  context ??= new AudioContext();
  // ブラウザは操作前の再生を止めているので、再生のたびに再開を試みる
  if (context.state === "suspended") void context.resume();
  return context;
}

/** 短い音を鳴らす。音声ファイルは使わず、その場で合成する (0.3秒以内・控えめな音) */
function tone(ctx: AudioContext, volume: number, { freq, type = "sine", start = 0, duration, glideTo }: {
  freq: number;
  type?: OscillatorType;
  start?: number;
  duration: number;
  glideTo?: number;
}) {
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function noise(ctx: AudioContext, volume: number, start: number, duration: number) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  filter.type = "highpass";
  filter.frequency.value = 1800;
  gain.gain.value = volume;
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(ctx.currentTime + start);
}

export function playSound(name: SoundName, volume: Volume) {
  const ctx = getContext();
  if (!ctx) return;
  const v = GAIN[volume];
  switch (name) {
    case "deal":
      noise(ctx, v * 0.8, 0, 0.06);
      noise(ctx, v * 0.8, 0.09, 0.06);
      break;
    case "flip":
      noise(ctx, v, 0, 0.08);
      break;
    case "chips":
      tone(ctx, v * 0.6, { freq: 2400, type: "triangle", duration: 0.05 });
      tone(ctx, v * 0.5, { freq: 2900, type: "triangle", start: 0.05, duration: 0.05 });
      break;
    case "turn":
      tone(ctx, v, { freq: 660, duration: 0.14 });
      tone(ctx, v * 0.8, { freq: 880, start: 0.1, duration: 0.16 });
      break;
    case "win":
      tone(ctx, v, { freq: 523, duration: 0.12 });
      tone(ctx, v, { freq: 659, start: 0.09, duration: 0.12 });
      tone(ctx, v, { freq: 784, start: 0.18, duration: 0.12 });
      break;
  }
}
