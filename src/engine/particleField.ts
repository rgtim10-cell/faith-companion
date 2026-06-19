// The Living Particle Field — OATH's resting body.
//
// Directive §1/§15.1: OATH always begins as particles, not an orb or a face.
// At rest it is a living field of particles inside darkness. The particles are
// not decoration — they are how OATH thinks, remembers, and responds. This
// module is the Skia-free simulation math (mirrors memorySkyLayout.ts) so the
// native (Skia) and web (SVG) renderers move identically.
//
// The field is intentionally distinct from the memory STARS. Stars are the
// record (specific memories). The field is OATH's ambient presence — alive
// even on Day 1 when there are no memories yet. Memories condense out of the
// field over time; the field is what remains when nothing is being said.

import { fnv1a, seededFloat } from '@/components/ui/memorySkyLayout';

// ── Modes ───────────────────────────────────────────────────────────────────
// A mode is what OATH is *doing* — and the whole field moves to express it.
// These are the seed of the larger "visual modes" system (directive §7):
//   rest     — silence. Gentle drift + breath. OATH is simply present.
//   gather   — OATH is looking through the record (mirror / guidance recall /
//              listening while a thought forms). The field draws inward toward
//              the covenant, tightens, and brightens. "OATH is thinking."
//   speaking — OATH has found something and speaks. The field opens outward
//              and brightens — the answer arriving.
//   still    — a single memory is held. The field slows and dims to near-
//              silence so one light can be heard.
export type FieldMode = 'rest' | 'gather' | 'speaking' | 'still';

export interface FieldControls {
  /** Pull toward the covenant (+) or open away from it (−). */
  gather: number;
  /** Opacity multiplier for the whole field. */
  brightness: number;
  /** Drift amplitude scale — low = calm/slowed, high = alive. */
  drift: number;
}

// Targets each mode eases toward. The renderer interpolates the *current*
// controls toward these every frame, so mode changes feel like the field
// reorganizing itself rather than snapping.
export const MODE_CONTROLS: Record<FieldMode, FieldControls> = {
  rest:     { gather:  0.00, brightness: 1.00, drift: 1.00 },
  gather:   { gather:  0.40, brightness: 1.30, drift: 0.50 },
  speaking: { gather: -0.14, brightness: 1.55, drift: 0.75 },
  still:    { gather:  0.06, brightness: 0.55, drift: 0.22 },
};

export function lerpControls(a: FieldControls, b: FieldControls, t: number): FieldControls {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return {
    gather: a.gather + (b.gather - a.gather) * k,
    brightness: a.brightness + (b.brightness - a.brightness) * k,
    drift: a.drift + (b.drift - a.drift) * k,
  };
}

// ── Particles ─────────────────────────────────────────────────────────────────

export interface Particle {
  id: number;
  /** Resting position in normalized 0..1 space. */
  bx: number;
  by: number;
  /** Base radius in px. */
  size: number;
  baseOpacity: number;
  /** Twinkle / breath phase offset so the field doesn't pulse in unison. */
  phase: number;
  /** Per-particle drift amplitude (px) and speed. */
  driftAmp: number;
  driftSpeed: number;
  /** 0..1 depth — near particles are larger, brighter, drift more (parallax). */
  near: number;
}

// Deterministic field: the same count always yields the same particles, so the
// presence is stable across renders and platforms. Particles bias toward the
// upper-center (the covenant's region) so the field reads as organized around
// the word, with a looser scatter filling the dark.
export function buildParticles(count: number, seed = 0x9e37): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const h = fnv1a(`p${seed}:${i}`);
    const near = seededFloat(h, 7);

    // Gaussian-ish clustering toward center via averaged uniforms.
    const cx = (seededFloat(h, 1) + seededFloat(h, 2) + seededFloat(h, 3)) / 3;
    const cy = (seededFloat(h, 4) + seededFloat(h, 5) + seededFloat(h, 6)) / 3;
    // Map the [0,1] cluster onto the screen. Vertically biased toward the upper
    // half (the covenant's region near 0.40) so the field gathers around the word.
    const bx = 0.08 + cx * 0.84;
    const by = 0.05 + cy * 0.78;

    out.push({
      id: i,
      bx,
      by,
      size: 0.6 + near * 1.9,
      baseOpacity: 0.05 + near * 0.30,
      phase: seededFloat(h, 8) * Math.PI * 2,
      driftAmp: 8 + seededFloat(h, 9) * 26 * (0.4 + near),
      driftSpeed: 0.12 + seededFloat(h, 10) * 0.34,
      near,
    });
  }
  return out;
}

// ── Per-frame resolve ─────────────────────────────────────────────────────────

export interface FieldFrameParams {
  W: number;
  H: number;
  anchorX: number;
  anchorY: number;
  /** Seconds since start. */
  time: number;
  controls: FieldControls;
}

export interface ParticleFrame {
  x: number;
  y: number;
  r: number;
  opacity: number;
}

export function particleAt(p: Particle, params: FieldFrameParams): ParticleFrame {
  const { W, H, anchorX, anchorY, time, controls } = params;

  const restX = p.bx * W;
  const restY = p.by * H;

  // Slow organic drift — two out-of-phase sinusoids so motion never reads linear.
  const dscale = controls.drift * (0.5 + p.near);
  const dx = Math.sin(time * p.driftSpeed + p.phase) * p.driftAmp * dscale;
  const dy = Math.cos(time * p.driftSpeed * 0.8 + p.phase * 1.3) * p.driftAmp * dscale;

  let x = restX + dx;
  let y = restY + dy;

  // Gather: ease toward the covenant (+) or open away from it (−). One formula
  // handles both — with g < 0 the displacement flips, pushing outward. The pull
  // is depth-weighted so near particles move more, giving the motion volume.
  const g = controls.gather * (0.6 + p.near * 0.8);
  x = x + (anchorX - x) * g;
  y = y + (anchorY - y) * g;

  const breath = Math.sin(time * 0.6 + p.phase) * 0.18 + 0.82;
  const r = p.size * (0.85 + p.near * 0.5);
  const opacity = Math.min(0.6, p.baseOpacity * breath * controls.brightness);

  return { x, y, r, opacity };
}
