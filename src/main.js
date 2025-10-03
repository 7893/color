import './styles/main.css';
import { PaletteApp } from './app/PaletteApp.js';
import { initGL } from './utils/gl.js';
import { masterColorsList } from './data/colors.js';
import { CONFIG } from './config/constants.js';

document.addEventListener('DOMContentLoaded', () => {
  initGL();
  new PaletteApp('paletteContainer', CONFIG, masterColorsList);
});
