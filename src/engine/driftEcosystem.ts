// The Drift Ecosystem — OATH's orbital structure.
//
// Directive §8.2: Particles don't just drift — they orbit the covenant.
// Every particle traces an elliptical path around the word spoken at the
// start. Inner particles orbit fast; outer particles drift slow. The covenant
// is the gravitational heart: warm, visible, constant.
//
// This is "matter under covenant gravity" — the Drift ecosystem structure
// layered on top of the ambient ParticleField (atmosphere). Together they
// compose: deep ambient haze + visible orbital structure.
//
// Kepler scaling: ω ∝ 1/√r so inner orbits feel urgent, outer ones meditative.
// Eccentricity + inclination variation break mechanical banding.
// Radial noise adds the final organic imperfection.

import { fnv1a, seededFloat } from '@/components/ui/memorySkyLayout';

export interface OrbitalParticle {
  id: number;
  normRadius: number;   // mean orbital radius as fraction of screen height
  angle0: number;       // starting angle (radians)
  speed: number;        // angular velocity (rad/s), Kepler-scaled
  eccentricity: number; // 0 = circular orbit, ~0.65 = strongly elliptical
  incline: number;      // major-axis rotation in the screen plane (radians)
  size: number;         // base radius in px
  baseOpacity: number;
  near: number;         // 0..1 depth — near particles get bloom
  phase: number;        // breath / twinkle offset
  driftAmp: number;     // radial noise amplitude (fraction of radius)
  driftFreq: number;    // radial noise frequency (rad/s)
}

export interface OrbitalFrame {
  x: number;
  y: number;
  r: number;
  opacity: number;
}

// ── Orbit mode — how the field moves to express what OATH is doing ───────────

export type OrbitMode = 'idle' | 'gather' | 'speaking' | 'still';

// Speed multiplier per mode. A single scalar applied to all angular velocities
// — simpler than the full FieldControls system and fast to lerp.
export const ORBIT_SPEED: Record<OrbitMode, number> = {
  idle:     1.00,
  gather:   0.55,  // field slows and pulls inward (via separate gather control)
  speaking: 1.35,  // field opens and accelerates
  still:    0.08,  // near-frozen — one thing is being held
};

// ── Build ─────────────────────────────────────────────────────────────────────

const MIN_R = 0.032;
const MAX_R = 0.430;
const KEPLER_K = 0.17; // ω = K / √normRadius

export function buildOrbitalParticles(count: number, seed = 0xd7f1): OrbitalParticle[] {
  const out: OrbitalParticle[] = [];
  for (let i = 0; i < count; i++) {
    const h = fnv1a(`drift${seed}:${i}`);
    const near = seededFloat(h, 7);

    // √ distribution → uniform 2D disk density (more particles at larger r)
    const normRadius = MIN_R + Math.sqrt(seededFloat(h, 1)) * (MAX_R - MIN_R);

    // Kepler: ω ∝ 1/√r — inner particles complete orbits faster
    const baseSpeed = KEPLER_K / Math.sqrt(normRadius);
    const speed = baseSpeed * (0.80 + seededFloat(h, 11) * 0.40);

    out.push({
      id: i,
      normRadius,
      angle0: seededFloat(h, 2) * Math.PI * 2,
      speed,
      eccentricity: 0.05 + seededFloat(h, 3) * 0.55,
      incline: seededFloat(h, 4) * Math.PI,
      size: 0.55 + near * 1.95,
      baseOpacity: 0.04 + near * 0.30,
      near,
      phase: seededFloat(h, 8) * Math.PI * 2,
      driftAmp: 0.007 + seededFloat(h, 9) * 0.018,
      driftFreq: 0.06 + seededFloat(h, 10) * 0.18,
    });
  }
  return out;
}

// ── Per-frame resolve ─────────────────────────────────────────────────────────

export function orbitalAt(
  p: OrbitalParticle,
  time: number,
  anchorX: number,
  anchorY: number,
  H: number,        // screen height for radius scaling
  speedMult = 1.0,  // from ORBIT_SPEED[mode]
  brightness = 1.0,
): OrbitalFrame {
  const angle = p.angle0 + p.speed * time * speedMult;

  const absRadius = p.normRadius * H;
  const semiMajor = absRadius;
  const semiMinor = semiMajor * Math.sqrt(1 - p.eccentricity * p.eccentricity);

  // Parametric ellipse in local space (center at origin)
  const lx = Math.cos(angle) * semiMajor;
  const ly = Math.sin(angle) * semiMinor;

  // Rotate by orbit inclination to break uniform band orientation
  const ci = Math.cos(p.incline);
  const si = Math.sin(p.incline);

  // Small radial noise prevents orbits looking like perfect geometric paths
  const noise = 1 + Math.sin(time * p.driftFreq + p.phase) * p.driftAmp;

  const x = anchorX + (lx * ci - ly * si) * noise;
  const y = anchorY + (lx * si + ly * ci) * noise;

  // Particles brighten slightly near periapsis (closest approach to covenant)
  const periBoost = 1 + 0.20 * Math.max(0, Math.cos(angle));

  const breath = Math.sin(time * 0.52 + p.phase) * 0.14 + 0.86;
  const opacity = Math.min(0.68, p.baseOpacity * breath * periBoost * brightness);

  return { x, y, r: p.size, opacity };
}
