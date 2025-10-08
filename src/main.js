import './styles/main.css';
import { PaletteApp } from './app/PaletteApp.js';
import { initGL } from './utils/gl.js';
import { masterColorsList } from './data/colors.js';
import { CONFIG } from './config/constants.js';

document.addEventListener('DOMContentLoaded', () => {
  const glHandle = initGL();
  const app = new PaletteApp('paletteContainer', CONFIG, masterColorsList);

  if (glHandle?.updatePaletteColors && typeof app?.onPaletteUpdate === 'function') {
    app.onPaletteUpdate(({ colors }) => {
      glHandle.updatePaletteColors(colors);
    });
  }

  window.addEventListener('beforeunload', () => {
    glHandle?.destroy?.();
  });
});
