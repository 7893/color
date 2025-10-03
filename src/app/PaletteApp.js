import { getTextColorClass, pickRandomColors } from '../utils/helpers.js';
import { saveSnapshot } from '../services/api.js';

export class PaletteApp {
  constructor(containerId, config, colors) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Container not found');
      return;
    }
    this.config = config;
    this.colors = colors;
    this.highestZIndex = 0;
    this.resizeTimer = null;
    this.currentSnapshot = null;
    this.userId = this.getUserId();
    this.init();
  }

  init() {
    this.generateSwatches();
    this.attachGlobalListeners();
  }

  getUserId() {
    let userId = localStorage.getItem('color-user-id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('color-user-id', userId);
    }
    return userId;
  }

  attachGlobalListeners() {
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.generateSwatches(), 250);
    });

    window.addEventListener('beforeunload', () => {
      if (this.currentSnapshot) {
        this.saveSnapshot();
      }
    });
  }

  generateSwatches() {
    this.container.innerHTML = '';
    const layout = this.calculateLayoutParameters();
    const selectedColors = pickRandomColors(this.colors, layout.swatchCount);
    this.highestZIndex = selectedColors.length;

    const positions = [];
    selectedColors.forEach((colorItem, index) => {
      const swatch = this.createSwatchElement(colorItem, layout, index);
      this.container.appendChild(swatch);
      const position = this.animateIn(swatch, layout);
      positions.push({ ...position, color: colorItem.hex });
    });

    this.currentSnapshot = {
      colors: selectedColors.map(c => c.hex),
      positions,
      deviceType: layout.width > 1024 ? 'desktop' : layout.width > 768 ? 'tablet' : 'mobile'
    };
  }

  async saveSnapshot() {
    if (!this.currentSnapshot) return;
    
    const snapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      colors: JSON.stringify(this.currentSnapshot.colors),
      positions: JSON.stringify(this.currentSnapshot.positions),
      deviceType: this.currentSnapshot.deviceType,
      createdAt: new Date().toISOString()
    };

    await saveSnapshot(snapshot);
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
    info.classList.add(getTextColorClass(colorItem.hex));

    inner.appendChild(info);
    swatch.appendChild(inner);

    this.attachSwatchListeners(swatch, colorItem);
    return swatch;
  }

  attachSwatchListeners(swatch, colorItem) {
    swatch.addEventListener('mouseenter', () => {
      this.highestZIndex++;
      swatch.style.zIndex = this.highestZIndex;
    });

    swatch.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard?.writeText(colorItem.hex).catch(err => console.error('Copy failed', err));
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

    const restingTransform = `translate3d(${finalX}px, ${finalY}px, 0) scale(1) rotate(${rotation}deg)`;

    requestAnimationFrame(() => {
      swatch.style.transform = restingTransform;
      swatch.style.opacity = '1';
    });

    return { x: finalX, y: finalY, rotation };
  }
}
