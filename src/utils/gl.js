const CLEAR_COLOR = [0x1C / 255, 0x1C / 255, 0x1E / 255, 1];
const MAX_COLORS = 8;

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;
uniform int u_colorCount;
uniform vec3 u_colors[${MAX_COLORS}];
uniform float u_parallax;

void main() {
  vec2 uv = v_uv;
  vec2 centered = uv - 0.5;
  float time = u_time * 0.05;
  vec3 base = vec3(${CLEAR_COLOR[0]}, ${CLEAR_COLOR[1]}, ${CLEAR_COLOR[2]});
  vec3 accum = base;
  float totalWeight = 1.0;

  for (int i = 0; i < ${MAX_COLORS}; i++) {
    if (i >= u_colorCount) {
      continue;
    }

    float idx = float(i);
    vec2 offset = vec2(
      sin(time + idx * 1.7) * 0.15,
      cos(time * 0.8 + idx * 1.3) * 0.15
    );
    vec2 flow = centered + offset * (0.4 + u_parallax * 0.2);
    float bands = sin((flow.x * 3.14159) + idx * 0.7 + time * 0.6);
    float mask = smoothstep(0.55, 0.0, length(flow));
    float weight = mix(0.08, 0.35, (bands * 0.5 + 0.5)) * mask;

    accum += u_colors[i] * weight;
    totalWeight += weight;
  }

  vec3 color = mix(base, accum / totalWeight, 0.5);
  gl_FragColor = vec4(color, 1.0);
}
`;

function resizeCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = Math.floor(window.innerWidth * dpr);
  const displayHeight = Math.floor(window.innerHeight * dpr);

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }

  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
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
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
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
    ? clean.split('').map(ch => ch + ch).join('')
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

  const gl = canvas.getContext('webgl2', { powerPreference: 'high-performance' })
    || canvas.getContext('webgl', { powerPreference: 'high-performance' });

  if (!gl) return null;

  const program = createProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
      3, -1,
      -1, 3
    ]),
    gl.STATIC_DRAW
  );

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const uniformLocations = {
    time: gl.getUniformLocation(program, 'u_time'),
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    colorCount: gl.getUniformLocation(program, 'u_colorCount'),
    colors: gl.getUniformLocation(program, 'u_colors'),
    parallax: gl.getUniformLocation(program, 'u_parallax')
  };

  const colorBuffer = new Float32Array(MAX_COLORS * 3);
  let colorCount = 0;

  function updatePaletteColors(hexColors = []) {
    const limited = hexColors.slice(0, MAX_COLORS);
    colorBuffer.fill(0);
    colorCount = limited.length;

    limited.forEach((hex, index) => {
      const [r, g, b] = hexToRgb(hex);
      const baseIndex = index * 3;
      colorBuffer[baseIndex] = r;
      colorBuffer[baseIndex + 1] = g;
      colorBuffer[baseIndex + 2] = b;
    });

    gl.useProgram(program);
    gl.uniform1i(uniformLocations.colorCount, colorCount);
    gl.uniform3fv(uniformLocations.colors, colorBuffer);
  }

  resizeCanvas(canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(...CLEAR_COLOR);

  let frameId = 0;

  const render = (timestamp) => {
    gl.useProgram(program);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(uniformLocations.time, timestamp * 0.001);
    gl.uniform2f(uniformLocations.resolution, canvas.width, canvas.height);
    const parallaxStrength = Math.min(0.6, (colorCount / MAX_COLORS) * 0.5);
    gl.uniform1f(uniformLocations.parallax, parallaxStrength);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    frameId = window.requestAnimationFrame(render);
  };

  frameId = window.requestAnimationFrame(render);

  const handleResize = () => {
    resizeCanvas(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  window.addEventListener('resize', handleResize, { passive: true });

  // Seed with base color to avoid uninitialized uniforms.
  updatePaletteColors([`#${CLEAR_COLOR.slice(0, 3).map(v => {
    const hex = Math.round(v * 255).toString(16).padStart(2, '0');
    return hex;
  }).join('')}`]);

  return {
    canvas,
    gl,
    updatePaletteColors,
    destroy() {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.useProgram(null);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (program) gl.deleteProgram(program);
    }
  };
}
