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
    this.lastLayout = null;
    this.paletteListeners = [];
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
        this.saveSnapshot({ preferBeacon: true });
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
      const target = this.computeTargetPosition(index, layout);
      const position = this.animateIn(swatch, layout, target);
      positions.push({ ...position, color: colorItem.hex });
    });

    this.currentSnapshot = {
      colors: selectedColors.map(c => c.hex),
      positions,
      deviceType: layout.width > 1024 ? 'desktop' : layout.width > 768 ? 'tablet' : 'mobile'
    };
    this.lastLayout = layout;
    this.notifyPaletteUpdate(this.currentSnapshot.colors, layout);
  }

  async saveSnapshot(options = {}) {
    if (!this.currentSnapshot) return;
    
    const snapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      colors: JSON.stringify(this.currentSnapshot.colors),
      positions: JSON.stringify(this.currentSnapshot.positions),
      deviceType: this.currentSnapshot.deviceType,
      createdAt: new Date().toISOString()
    };

    if (options.preferBeacon) {
      saveSnapshot(snapshot, { preferBeacon: true });
      return;
    }

    await saveSnapshot(snapshot);
  }

  onPaletteUpdate(callback) {
    if (typeof callback === 'function') {
      this.paletteListeners.push(callback);
      if (this.currentSnapshot && this.lastLayout) {
        callback({
          colors: [...this.currentSnapshot.colors],
          layout: { ...this.lastLayout }
        });
      }
    }
  }

  notifyPaletteUpdate(colorHexes, layout) {
    const payload = {
      colors: [...colorHexes],
      layout: { ...layout }
    };

    this.paletteListeners.forEach(listener => {
      try {
        listener(payload);
      } catch (error) {
        console.error('Palette listener error:', error);
      }
    });
  }

  getHaltonValue(index, base) {
    let result = 0;
    let f = 1;
    let i = index + 1;
    while (i > 0) {
      f /= base;
      result += f * (i % base);
      i = Math.floor(i / base);
    }
    return result;
  }

  pseudoRandom(index, offset = 0) {
    const seed = (index + 1) * 12.9898 + offset * 78.233;
    const value = Math.sin(seed) * 43758.5453;
    return value - Math.floor(value);
  }

  computeTargetPosition(index, layout) {
    const normX = this.getHaltonValue(index, 2);
    const normY = this.getHaltonValue(index, 3);

    const marginX = Math.min(layout.size * 0.4, layout.width * 0.08);
    const marginY = Math.min(layout.size * 0.4, layout.height * 0.08);

    const usableWidth = Math.max(layout.width - 2 * marginX, layout.size);
    const usableHeight = Math.max(layout.height - 2 * marginY, layout.size);

    const maxLeft = marginX + Math.max(usableWidth - layout.size, 0);
    const maxTop = marginY + Math.max(usableHeight - layout.size, 0);

    const jitterXRange = Math.min(layout.size * 0.2, Math.max(usableWidth - layout.size, 0) * 0.5);
    const jitterYRange = Math.min(layout.size * 0.2, Math.max(usableHeight - layout.size, 0) * 0.5);

    let left = marginX + normX * Math.max(usableWidth - layout.size, 0);
    let top = marginY + normY * Math.max(usableHeight - layout.size, 0);

    left += (this.pseudoRandom(index, 1) - 0.5) * 2 * jitterXRange;
    top += (this.pseudoRandom(index, 2) - 0.5) * 2 * jitterYRange;

    left = Math.min(Math.max(left, marginX), maxLeft);
    top = Math.min(Math.max(top, marginY), maxTop);

    return { x: left, y: top };
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

  animateIn(swatch, layout, target) {
    const rotation = Math.random() * 360;
    const initialScale = 0.1;
    const initialX = Math.random() * layout.width;
    const initialY = Math.random() * layout.height;

    swatch.style.setProperty('--inverse-rotation', `-${rotation}deg`);

    const initialTransform = `translate3d(${initialX}px, ${initialY}px, 0) scale(${initialScale}) rotate(${rotation}deg)`;
    swatch.style.transform = initialTransform;

    const restingTransform = `translate3d(${target.x}px, ${target.y}px, 0) scale(1) rotate(${rotation}deg)`;

    requestAnimationFrame(() => {
      swatch.style.transform = restingTransform;
      swatch.style.opacity = '1';
    });

    return { x: target.x, y: target.y, rotation };
  }
}
