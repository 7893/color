import './styles/main.css';
import { PaletteApp } from './app/PaletteApp.js';
import { initGL } from './utils/gl.js';
import { masterColorsList } from './data/colors.js';
import { CONFIG } from './config/constants.js';

function showError(message) {
  const screen = document.createElement('div');
  screen.className = 'error-screen';
  screen.setAttribute('role', 'alert');

  const card = document.createElement('div');
  card.className = 'error-card';

  const title = document.createElement('h1');
  title.className = 'error-title';
  title.textContent = 'Error';

  const body = document.createElement('p');
  body.className = 'error-message';
  body.textContent = message;

  card.appendChild(title);
  card.appendChild(body);
  screen.appendChild(card);

  document.body.replaceChildren(screen);
}

function init() {
  try {
    let glHandle = null;
    try {
      glHandle = initGL();
    } catch (error) {
      console.warn('Background animation unavailable', error);
    }
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

    window.addEventListener('pagehide', (event) => {
      if (!event.persisted) glHandle?.destroy?.();
    });
  } catch (error) {
    console.error('Initialization error:', error);
    showError('Failed to initialize the application. Please refresh the page.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
