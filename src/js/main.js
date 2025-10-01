import { masterColorsList } from './colors.js';

const CONFIG = {
  DESKTOP_COUNT: 25,
  TABLET_COUNT: 16,
  MOBILE_COUNT: 12,
  COVERAGE_RATIO: 0.35,
  MIN_SIZE: 90,
  MAX_SIZE: 220,
  FONT_SIZE_RATIO: 0.10,
  MIN_FONT_SIZE: 10,
};

class PaletteApp {
  constructor(containerId, config, colors) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error("Initialization failed: Container not found.");
      return;
    }
    this.config = config;
    this.colors = colors;
    this.highestZIndex = 0;
    this.resizeTimer = null;
    this.init();
  }

  init() {
    this.generateSwatches();
    this.attachGlobalListeners();
  }

  attachGlobalListeners() {
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.generateSwatches(), 250);
    });
  }

  generateSwatches() {
    this.container.innerHTML = '';
    const layout = this.calculateLayoutParameters();
    const selectedColors = this.pickRandomUniqueColors(this.colors, layout.swatchCount);
    this.highestZIndex = selectedColors.length;

    selectedColors.forEach((colorItem, index) => {
      const swatch = this.createSwatchElement(colorItem, layout, index);
      this.container.appendChild(swatch);
      this.animateIn(swatch, layout);
    });
  }

  calculateLayoutParameters() {
    const { width, height } = this.container.getBoundingClientRect();
    const area = width * height;
    let swatchCount;

    if (width > 1024) swatchCount = this.config.DESKTOP_COUNT;
    else if (width > 768) swatchCount = this.config.TABLET_COUNT;
    else swatchCount = this.config.MOBILE_COUNT;

    const totalSwatchesArea = area * this.config.COVERAGE_RATIO;
    const singleSwatchArea = totalSwatchesArea / swatchCount;
    let size = Math.sqrt(singleSwatchArea);
    size = Math.max(this.config.MIN_SIZE, Math.min(this.config.MAX_SIZE, size));
    const fontSize = Math.max(this.config.MIN_FONT_SIZE, size * this.config.FONT_SIZE_RATIO);

    return { width, height, swatchCount, size, fontSize };
  }

  createSwatchElement(colorItem, layout, index) {
    // 最终修复：回归到 swatch > inner > info 的两层稳定结构
    const swatch = document.createElement('div');
    const inner = document.createElement('div');
    const info = document.createElement('div');

    swatch.className = 'color-swatch';
    swatch.style.width = `${layout.size}px`;
    swatch.style.height = `${layout.size}px`;
    swatch.style.zIndex = index;
    swatch.style.opacity = '0';

    inner.className = 'swatch-inner';
    inner.style.backgroundColor = colorItem.hex;

    info.className = 'color-info';
    info.innerHTML = `${colorItem.name}<br>${colorItem.hex}`;
    info.style.fontSize = `${layout.fontSize}px`;
    const textColorClass = this.getTextColorClass(colorItem.hex);
    info.classList.add(textColorClass);

    inner.appendChild(info);
    swatch.appendChild(inner);

    this.attachSwatchListeners(swatch, { colorItem });
    return swatch;
  }

  attachSwatchListeners(swatch, { colorItem }) {
    swatch.addEventListener('mouseenter', () => {
      this.highestZIndex++;
      swatch.style.zIndex = this.highestZIndex;
    });

    swatch.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard?.writeText(colorItem.hex).catch(err => console.error("Copy failed", err));
    });
  }

  animateIn(swatch, layout) {
    const rotation = Math.random() * 360;
    const initialScale = 0.1;
    const initialX = Math.random() * layout.width;
    const initialY = Math.random() * layout.height;

    swatch.style.setProperty('--inverse-rotation', `-${rotation}deg`);

    const initialTransform = `translate3d(${initialX}px, ${initialY}px, 0) scale(${initialScale}) rotate(${rotation}deg)`;
    swatch.style.transform = initialTransform;

    const margin = layout.size * 0.6;
    const finalX = margin + Math.random() * (layout.width - 2 * margin) - layout.size / 2;
    const finalY = margin + Math.random() * (layout.height - 2 * margin) - layout.size / 2;

    // 最终修复：旋转和位移都在同一个 transform 中
    const restingTransform = `translate3d(${finalX}px, ${finalY}px, 0) scale(1) rotate(${rotation}deg)`;

    requestAnimationFrame(() => {
      swatch.style.transform = restingTransform;
      swatch.style.opacity = '1';
    });
  }

  getTextColorClass(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    return luma > 150 ? 'text-dark' : 'text-light';
  }

  pickRandomUniqueColors(list, count) {
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, list.length));
  }
}

function initGL() {
  const canvas = document.getElementById('glCanvas');
  if (!canvas) return null;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const gl = canvas.getContext('webgl2', { powerPreference: 'high-performance' }) || canvas.getContext('webgl', { powerPreference: 'high-performance' });
  if (!gl) return null;
  return { canvas, gl };
}

document.addEventListener('DOMContentLoaded', () => {
  const glCtx = initGL();
  new PaletteApp('paletteContainer', CONFIG, masterColorsList);
});