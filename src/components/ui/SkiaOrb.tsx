import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable } from 'react-native';
import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import { useRealm } from '@/context/RealmContext';

interface SkiaOrbProps {
  size?: number;
  /** External 0→1 intensity (e.g. the scene's pulse) — brightens and swells the core. */
  pulseValue?: Animated.Value;
  /** Adds a steady glow — OATH attending. */
  listening?: boolean;
  onPress?: () => void;
}

// A living presence, drawn on the GPU. Domain-warped fractal plasma churns in
// the core, light blooms at the rim, film grain breaks the digital flatness,
// and a dark void holds the centre — the black-hole signature.
const SKSL = `
uniform float2 u_res;
uniform float  u_time;
uniform float3 u_color;
uniform float3 u_deep;
uniform float  u_intensity;

float hash(float2 p){
  p = fract(p * float2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}
float vnoise(float2 p){
  float2 i = floor(p);
  float2 f = fract(p);
  float2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + float2(1.0, 0.0));
  float c = hash(i + float2(0.0, 1.0));
  float d = hash(i + float2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(float2 p){
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++){
    v += amp * vnoise(p);
    p = p * 2.02;
    amp *= 0.5;
  }
  return v;
}
half4 main(float2 fragCoord){
  float2 uv = (fragCoord - 0.5 * u_res) / u_res.y;
  float r = length(uv);
  float t = u_time * 0.12;

  // swirl the field around the centre, then domain-warp it into plasma
  float ang = atan(uv.y, uv.x);
  float2 sw = uv + 0.18 * float2(cos(ang * 3.0 + t * 2.0), sin(ang * 3.0 - t * 2.0)) * r;
  float2 q = float2(fbm(sw * 2.8 + t), fbm(sw * 2.8 + float2(5.2, 1.3) - t));
  float n = fbm(sw * 3.4 + q * 1.7 + t * 0.6);

  float body = smoothstep(0.56, 0.0, r);
  float3 col = mix(u_deep * 0.55, u_color, clamp(n * 1.25 * body + (0.5 - r) * 1.1, 0.0, 1.0));

  // accretion ring — a hot rim of light at the event horizon
  float ring = smoothstep(0.32, 0.24, r) - smoothstep(0.24, 0.15, r);
  col += u_color * max(ring, 0.0) * (1.1 + 0.8 * n) * (1.0 + u_intensity);

  // outer bloom
  float rim = smoothstep(0.56, 0.30, r) * (0.4 + 0.6 * n);
  col += u_color * rim * (0.5 + u_intensity * 0.8);

  // dark void centre
  float voidc = smoothstep(0.16, 0.03, r);
  col = mix(col, float3(0.0, 0.0, 0.0), voidc * 0.96);

  // film grain
  float g = hash(fragCoord * 1.3 + u_time);
  col += (g - 0.5) * 0.03;

  float alpha = smoothstep(0.60, 0.42, r);
  alpha = max(alpha, rim * 0.45);
  col *= (0.72 + u_intensity * 0.6);
  return half4(col * alpha, alpha);
}
`;

function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function SkiaOrb({ size = 300, pulseValue, listening = false, onPress }: SkiaOrbProps) {
  const { realm } = useRealm();
  const effect = useMemo(() => Skia.RuntimeEffect.Make(SKSL), []);

  const [time, setTime] = useState(0);
  const start = useRef(Date.now());
  const pulseRef = useRef(0);

  // Track the external pulse without forcing extra renders.
  useEffect(() => {
    if (!pulseValue) return;
    const id = pulseValue.addListener(({ value }) => {
      pulseRef.current = value;
    });
    return () => pulseValue.removeListener(id);
  }, [pulseValue]);

  // Drive the shader clock.
  useEffect(() => {
    let raf: number;
    const loop = () => {
      setTime((Date.now() - start.current) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const accent = hexToRgb01(realm.accent);
  const deep = hexToRgb01(realm.orbColors[1]);
  const intensity = Math.min(1.4, pulseRef.current + (listening ? 0.22 : 0));

  const uniforms = useMemo(
    () => ({
      u_res: [size, size],
      u_time: time,
      u_color: accent,
      u_deep: deep,
      u_intensity: intensity,
    }),
    // recompute every frame as time changes
    [size, time, accent[0], accent[1], accent[2], deep[0], deep[1], deep[2], intensity],
  );

  if (!effect) return null;

  const canvas = (
    <Canvas style={{ width: size, height: size }}>
      <Fill>
        <Shader source={effect} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={20}>
        {canvas}
      </Pressable>
    );
  }
  return canvas;
}

// Default export so the component can be lazy-loaded — on web this ensures the
// Skia web API binds only after CanvasKit (WASM) has loaded.
export default SkiaOrb;
