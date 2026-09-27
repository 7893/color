export const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

varying vec2 v_uv;
uniform float u_time;
uniform int u_colorCount;
uniform vec3 u_colors[8];
uniform float u_parallax;

void main() {
  vec2 uv = v_uv;
  vec2 centered = uv - 0.5;
  float time = u_time * 0.05;
  vec3 base = vec3(0.10980392156862745, 0.10980392156862745, 0.11764705882352941);
  vec3 accum = base;
  float totalWeight = 1.0;

  for (int i = 0; i < 8; i++) {
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
    float mask = (1.0 - smoothstep(0.0, 0.55, length(flow)));
    float weight = mix(0.08, 0.35, (bands * 0.5 + 0.5)) * mask;

    accum += u_colors[i] * weight;
    totalWeight += weight;
  }

  vec3 color = mix(base, accum / totalWeight, 0.5);
  gl_FragColor = vec4(color, 1.0);
}
`;

