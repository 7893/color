export function initGL() {
  const canvas = document.getElementById('glCanvas');
  if (!canvas) return null;
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const gl = canvas.getContext('webgl2', { powerPreference: 'high-performance' }) 
    || canvas.getContext('webgl', { powerPreference: 'high-performance' });
  
  if (!gl) return null;
  return { canvas, gl };
}
