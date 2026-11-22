const CLEAR_COLOR = [0x1C / 255, 0x1C / 255, 0x1E / 255, 1];
const MAX_COLORS = 8;

// Exact common period (in seconds) of the shader's 1.0x, 0.8x, and 0.6x cycles at 0.05 rad/s,
// keeping u_time well within FP16 (mediump) range on long-lived mobile tabs.
export const TIME_WRAP_SECONDS = 200 * Math.PI;

import { VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE } from './palette-shaders.js';

export function wrapShaderTime(timestampMs) {
  const seconds = timestampMs * 0.001;
  return ((seconds % TIME_WRAP_SECONDS) + TIME_WRAP_SECONDS) % TIME_WRAP_SECONDS;
}

function setCanvasHidden(canvas, hidden) {
  if (canvas.classList) {
    canvas.classList.toggle('is-hidden', hidden);
  }
}

function resizeCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2500000 / Math.max(1, window.innerWidth * window.innerHeight)));
  const displayWidth = Math.floor(window.innerWidth * dpr);
  const displayHeight = Math.floor(window.innerHeight * dpr);

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${info}`);
  }

  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  let fragmentShader;
  try {
    fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  } catch (error) {
    gl.deleteShader(vertexShader);
    throw error;
  }
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error(`Program link failed: ${info}`);
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const value = parseInt(clean.length === 3
    ? clean.split('').map((ch) => ch + ch).join('')
    : clean, 16);

  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255
  ];
}

export function initGL() {
  const canvas = document.getElementById('glCanvas');
  if (!canvas) return null;
  const gl = canvas.getContext('webgl', { powerPreference: 'default' });
  if (!gl) return null;

  const motionQuery = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  const isReducedMotion = () => Boolean(motionQuery?.matches);

  let program = null, positionBuffer = null, uniforms;
  let frameId = 0, lost = false, destroyed = false;
  const colorBuffer = new Float32Array(MAX_COLORS * 3);
  let colorCount = 0;

  function release() {
    if (positionBuffer) gl.deleteBuffer(positionBuffer);
    if (program) gl.deleteProgram(program);
    positionBuffer = program = null;
  }
  function drawFrame(timeSeconds) {
    if (destroyed || lost || !program) return;
    gl.uniform1f(uniforms.time, timeSeconds);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function initialize() {
    try {
      program = createProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
      gl.useProgram(program);
      positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      uniforms = {
        time: gl.getUniformLocation(program, 'u_time'),
        colorCount: gl.getUniformLocation(program, 'u_colorCount'),
        colors: gl.getUniformLocation(program, 'u_colors'),
        parallax: gl.getUniformLocation(program, 'u_parallax'),
      };
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.clearColor(...CLEAR_COLOR);
      resizeCanvas(canvas);
      gl.viewport(0, 0, canvas.width, canvas.height);
      uploadColors();
      setCanvasHidden(canvas, false);
      return true;
    } catch (error) {
      release();
      setCanvasHidden(canvas, true);
      console.warn('Background animation unavailable', error);
      return false;
    }
  }
  function uploadColors() {
    if (!program || lost || destroyed) return;
    gl.useProgram(program);
    gl.uniform1i(uniforms.colorCount, colorCount);
    gl.uniform3fv(uniforms.colors, colorBuffer);
    gl.uniform1f(uniforms.parallax, Math.min(0.6, (colorCount / MAX_COLORS) * 0.5));
  }
  function updatePaletteColors(hexColors = []) {
    const limited = hexColors.slice(0, MAX_COLORS);
    colorBuffer.fill(0);
    colorCount = limited.length;
    limited.forEach((hex, index) => colorBuffer.set(hexToRgb(hex), index * 3));
    uploadColors();
    if (isReducedMotion()) {
      drawFrame(0);
    }
  }
  function render(timestamp) {
    frameId = 0;
    if (destroyed || lost || !program || document.hidden) return;
    drawFrame(wrapShaderTime(timestamp));
    if (!isReducedMotion()) {
      frameId = requestAnimationFrame(render);
    }
  }
  function stop() {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }
  function start() {
    if (destroyed || lost || !program || document.hidden) return;
    if (isReducedMotion()) {
      stop();
      drawFrame(0);
      return;
    }
    if (!frameId) frameId = requestAnimationFrame(render);
  }
  function handleResize() {
    if (destroyed || lost || !program) return;
    resizeCanvas(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (isReducedMotion()) {
      drawFrame(0);
    }
  }
  function visibility() { document.hidden ? stop() : start(); }
  function handleMotionChange() { start(); }
  function contextLost(event) {
    event.preventDefault();
    lost = true;
    stop();
    setCanvasHidden(canvas, true);
  }
  function contextRestored() {
    if (destroyed) return;
    lost = false;
    if (initialize()) start();
  }
  if (!initialize()) return null;
  updatePaletteColors(['#1c1c1e']);
  window.addEventListener('resize', handleResize, { passive: true });
  document.addEventListener('visibilitychange', visibility);
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  motionQuery?.addEventListener?.('change', handleMotionChange);
  start();
  return {
    canvas, gl, updatePaletteColors,
    destroy() {
      destroyed = true;
      stop();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      motionQuery?.removeEventListener?.('change', handleMotionChange);
      release();
    },
  };
}
