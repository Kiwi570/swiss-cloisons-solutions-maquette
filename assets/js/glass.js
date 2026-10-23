/* La vitre coulissante : deux panneaux vitrés bord à bord rendus en WebGL (OGL) sur la photo d'ouverture.
   Réfraction sur les chants, liseré chromatique, reflet, bande dépolie, profilés alu.
   Sans WebGL ou en mode calme : la vitre CSS reste affichée et la photo est intacte. */
import { Renderer } from './vendor/ogl/core/Renderer.js';
import { Program } from './vendor/ogl/core/Program.js';
import { Mesh } from './vendor/ogl/core/Mesh.js';
import { Texture } from './vendor/ogl/core/Texture.js';
import { Triangle } from './vendor/ogl/extras/Triangle.js';

const SCS = window.SCS || {};
const hero = document.querySelector('[data-glass]');
const canvas = hero && hero.querySelector('.hero__gl');
const img = hero && hero.querySelector('.hero__media img');

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform vec2 uRes;
uniform vec2 uImg;
uniform float uTime;
uniform float uPane;
uniform float uWidth;
uniform float uIntro;
uniform float uClose;
uniform float uBand;
varying vec2 vUv;

vec2 cover(vec2 uv) {
  float rs = uRes.x / uRes.y, ri = uImg.x / uImg.y;
  vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return (uv - 0.5) * s + 0.5;
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
vec3 tex(vec2 uv) { return texture2D(tMap, cover(clamp(uv, 0.001, 0.999))).rgb; }

void main() {
  vec2 uv = vUv;
  float px = 1.0 / uRes.x;
  float w = mix(uWidth, 1.3, uClose);
  float c = mix(uPane, 0.5, uClose);
  float l = c - w * 0.5, r = c + w * 0.5;
  float inP = step(l, uv.x) * step(uv.x, r);
  float dl = (uv.x - l) / px, dr = (r - uv.x) / px, dm = abs(uv.x - c) / px;
  float edge = min(dl, dr);
  float side = sign(uv.x - c);
  float bevel = exp(-edge / 16.0) * 22.0 * side - exp(-dm / 7.0) * 6.0 * side;
  float wob = (noise(vec2(uv.y * 2.5 + uTime * 0.04, uv.x * 1.7 + side)) - 0.5) * 5.0;
  vec2 off = vec2((bevel + wob + 7.0) * px, (noise(vec2(uv.x * 3.0, uv.y * 2.0)) - 0.5) * 2.0 * px) * inP;
  float ca = (exp(-edge / 34.0) * 3.5 + 0.7) * px * inP;
  vec3 col;
  col.r = tex(uv + off + vec2(ca, 0.0)).r;
  col.g = tex(uv + off).g;
  col.b = tex(uv + off - vec2(ca, 0.0)).b;

  float band = smoothstep(uBand, uBand + 0.0015, uv.y) * (1.0 - smoothstep(uBand + 0.075, uBand + 0.0765, uv.y)) * inP;
  if (band > 0.0) {
    vec3 b = vec3(0.0);
    float jit = hash(gl_FragCoord.xy) * 6.283;
    for (int i = 0; i < 20; i++) {
      float a = float(i) * 2.39996 + jit;
      vec2 o = vec2(cos(a), sin(a) * uRes.x / uRes.y) * sqrt(float(i) + 1.0) * 5.0 * px;
      b += tex(uv + o);
    }
    b /= 20.0;
    vec2 cell = fract(gl_FragCoord.xy / 5.0) - 0.5;
    float dots = (1.0 - smoothstep(0.18, 0.26, length(cell))) * 0.03;
    col = mix(col, mix(b, vec3(0.972, 0.984, 0.98), 0.58) + dots, band);
  }
  col = mix(col, col * vec3(0.9, 0.985, 0.97) + vec3(0.0, 0.022, 0.02), 0.8 * inP);

  float s = uv.x * 0.55 + uv.y * 0.9 - (c * 0.55 + 0.52) - sin(uTime * 0.25) * 0.05;
  float streak = exp(-pow(s / 0.06, 2.0)) * 0.15 + exp(-pow((s - 0.16) / 0.014, 2.0)) * 0.09;
  col += streak * inP * (1.0 - band * 0.6);

  float prof = (1.0 - smoothstep(2.5, 4.0, dl)) * step(0.0, dl) + (1.0 - smoothstep(2.5, 4.0, dr)) * step(0.0, dr);
  float sh = (1.0 - smoothstep(4.0, 12.0, dl)) * step(4.0, dl) + (1.0 - smoothstep(4.0, 12.0, dr)) * step(4.0, dr);
  col = mix(col, vec3(0.6, 0.64, 0.66) + (uv.y - 0.5) * 0.1, clamp(prof, 0.0, 1.0) * inP);
  float hi = (1.0 - smoothstep(0.0, 1.2, abs(dl - 4.6))) + (1.0 - smoothstep(0.0, 1.2, abs(dr - 4.6)));
  col = mix(col, vec3(1.0), clamp(hi, 0.0, 1.0) * 0.7 * inP);
  col *= 1.0 - 0.14 * clamp(sh, 0.0, 1.0) * inP;
  float joint = (1.0 - smoothstep(0.0, 1.4, dm)) * inP;
  col = mix(col, vec3(1.0), joint * 0.75);
  float jointSh = (1.0 - smoothstep(1.4, 5.0, dm)) * step(1.4, dm) * inP;
  col *= 1.0 - jointSh * 0.06;

  float outD = min(abs(uv.x - l), abs(uv.x - r)) / px;
  col *= mix(0.94 + 0.06 * smoothstep(0.0, 60.0, outD) * 0.0, 1.0, inP);
  col *= 1.0 - (1.0 - inP) * 0.12 * exp(-outD / 18.0);
  col = mix(vec3(0.953, 0.949, 0.933), col, smoothstep(0.0, 1.0, uIntro));
  gl_FragColor = vec4(col, 1.0);
}
`;

function start() {
  if (!hero || !canvas || !img || SCS.calm) return;
  let renderer, gl;
  try {
    renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio || 1, 1.6), alpha: false, antialias: false, powerPreference: 'high-performance' });
    gl = renderer.gl;
    if (!gl) throw new Error('webgl');
  } catch (e) { return; }
  const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
  const mobile = window.matchMedia('(max-width: 720px)').matches;
  const program = new Program(gl, {
    vertex, fragment,
    uniforms: {
      tMap: { value: texture }, uRes: { value: [1, 1] }, uImg: { value: [16, 9] }, uTime: { value: 0 },
      uPane: { value: 1.6 }, uWidth: { value: mobile ? 0.56 : 0.38 }, uIntro: { value: 0 }, uClose: { value: 0 }, uBand: { value: 0.4 }
    }
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  const u = program.uniforms;

  const resize = () => {
    const r = hero.getBoundingClientRect();
    renderer.setSize(r.width, r.height);
    u.uRes.value = [gl.canvas.width, gl.canvas.height];
  };
  window.addEventListener('resize', resize);
  resize();

  const state = { target: 0.64, current: 1.6, mouse: false, visible: true, close: 0 };
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = hero.getBoundingClientRect();
    state.mouse = true;
    state.target = Math.min(0.82, Math.max(0.24, (e.clientX - r.left) / r.width));
  });
  hero.addEventListener('pointerleave', () => { state.mouse = false; });
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { state.visible = en[0].isIntersecting; }, { threshold: 0 }).observe(hero);

  const intro = { v: 0, pane: 1.6 };
  let introStarted = false;
  const runIntro = () => {
    if (introStarted) return; introStarted = true;
    const g = window.gsap;
    if (g) {
      g.to(intro, { v: 1, duration: 1.6, ease: 'power2.out' });
      g.to(intro, { pane: 0.64, duration: 1.9, ease: 'expo.out', onComplete: () => { intro.done = true; } });
    } else { intro.v = 1; intro.pane = 0.64; intro.done = true; }
  };

  const load = () => {
    const src = img.currentSrc || img.src;
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => {
      texture.image = im;
      u.uImg.value = [im.naturalWidth, im.naturalHeight];
      hero.classList.add('gl-on');
      if (SCS.introDone) runIntro(); else window.addEventListener('scs:intro', runIntro, { once: true });
      setTimeout(runIntro, 3200);
    };
    im.src = src;
  };
  if (img.complete && img.naturalWidth) load(); else img.addEventListener('load', load, { once: true });

  SCS.glass = { setClose: (v) => { state.close = v; } };
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); hero.classList.remove('gl-on'); }, false);

  let t0 = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (!state.visible || !texture.image) return;
    const t = (now - t0) / 1000;
    if (!state.mouse) state.target = 0.64 + Math.sin(t * 0.22) * (mobile ? 0.05 : 0.1);
    if (intro.done) state.current += (state.target - state.current) * 0.055;
    else state.current = intro.pane;
    u.uTime.value = t;
    u.uPane.value = state.current;
    u.uIntro.value = intro.v;
    u.uClose.value += (state.close - u.uClose.value) * 0.12;
    renderer.render({ scene: mesh });
  };
  requestAnimationFrame(loop);
}

start();
