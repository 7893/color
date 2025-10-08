import './styles/main.css';
import { PaletteApp } from './app/PaletteApp.js';
import { initGL } from './utils/gl.js';
import { masterColorsList } from './data/colors.js';
import { CONFIG } from './config/constants.js';

function showError(message) {
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; color: white; font-family: sans-serif; text-align: center; padding: 20px;">
      <div>
        <h1 style="font-size: 24px; margin-bottom: 10px;">⚠️ Error</h1>
        <p style="font-size: 16px; opacity: 0.8;">${message}</p>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    const glHandle = initGL();
    if (!glHandle) {
      console.warn('WebGL not available, continuing without background animation');
    }

    const app = new PaletteApp('paletteContainer', CONFIG, masterColorsList);
    if (!app || !app.container) {
      throw new Error('Failed to initialize palette app');
    }

    if (glHandle?.updatePaletteColors && typeof app?.onPaletteUpdate === 'function') {
      app.onPaletteUpdate(({ colors }) => {
        glHandle.updatePaletteColors(colors);
      });
    }

    window.addEventListener('beforeunload', () => {
      glHandle?.destroy?.();
    });
  } catch (error) {
    console.error('Initialization error:', error);
    showError('Failed to initialize the application. Please refresh the page.');
  }
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
