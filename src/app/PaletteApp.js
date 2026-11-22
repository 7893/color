import { getTextColorClass, pickRandomColors } from '../utils/helpers.js';

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
    this.toastTimer = null;
    this.activeTimer = null;
    this.activeSwatch = null;
    this.currentColors = [];
    this.lastLayout = null;
    this.paletteListeners = [];
    this.randomSeed = Math.random() * 10000;
    this.haltonOffsetX = Math.random();
    this.haltonOffsetY = Math.random();
    this.selectedColors = pickRandomColors(this.colors, this.config.DESKTOP_COUNT);
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

  clearContainer() {
    if (typeof this.container.replaceChildren === 'function') {
      this.container.replaceChildren();
    } else if ('textContent' in this.container) {
      this.container.textContent = '';
    }
  }

  generateSwatches() {
    this.clearContainer();
    this.activeSwatch = null;
    const layout = this.calculateLayoutParameters();
    const selectedColors = this.selectedColors.slice(0, layout.swatchCount);
    this.highestZIndex = selectedColors.length;

    selectedColors.forEach((colorItem, index) => {
      const swatch = this.createSwatchElement(colorItem, layout, index);
      this.container.appendChild(swatch);
      const target = this.computeTargetPosition(index, layout);
      this.animateIn(swatch, layout, target);
    });

    this.currentColors = selectedColors.map((c) => c.hex);
    this.lastLayout = layout;
    this.notifyPaletteUpdate(this.currentColors, layout);
  }

  onPaletteUpdate(callback) {
    if (typeof callback === 'function') {
      this.paletteListeners.push(callback);
      if (this.lastLayout) {
        callback({
          colors: [...this.currentColors],
          layout: { ...this.lastLayout }
        });
      }
    }
  }

  offPaletteUpdate(callback) {
    const index = this.paletteListeners.indexOf(callback);
    if (index > -1) {
      this.paletteListeners.splice(index, 1);
    }
  }

  notifyPaletteUpdate(colorHexes, layout) {
    const payload = {
      colors: [...colorHexes],
      layout: { ...layout }
    };

    this.paletteListeners.forEach((listener) => {
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
    const seed = (index + 1) * 12.9898 + offset * 78.233 + this.randomSeed;
    const value = Math.sin(seed) * 43758.5453;
    return value - Math.floor(value);
  }

  computeTargetPosition(index, layout) {
    const baseX = this.getHaltonValue(index, 2);
    const baseY = this.getHaltonValue(index, 3);

    // Cranley-Patterson rotation: one shared shift per axis across all points in the layout.
    const offsetX = Number.isFinite(layout.offsetX) ? layout.offsetX : this.haltonOffsetX;
    const offsetY = Number.isFinite(layout.offsetY) ? layout.offsetY : this.haltonOffsetY;

    const normX = (((baseX + offsetX) % 1) + 1) % 1;
    const normY = (((baseY + offsetY) % 1) + 1) % 1;

    const isMobile = layout.width <= 768;
    const baseMarginX = isMobile ? Math.min(layout.width * 0.03, 20) : Math.min(layout.width * 0.05, 40);
    const baseMarginY = isMobile ? Math.min(layout.height * 0.03, 20) : Math.min(layout.height * 0.05, 40);

    const marginX = Math.max(baseMarginX, layout.size * 0.05);
    const marginY = Math.max(baseMarginY, layout.size * 0.05);

    const usableWidth = Math.max(layout.width - 2 * marginX - layout.size, 0);
    const usableHeight = Math.max(layout.height - 2 * marginY - layout.size, 0);

    const jitterXRange = usableWidth > 0 ? Math.min(layout.size * 0.15, usableWidth * 0.3) : 0;
    const jitterYRange = usableHeight > 0 ? Math.min(layout.size * 0.15, usableHeight * 0.3) : 0;

    let left = marginX + normX * usableWidth;
    let top = marginY + normY * usableHeight;

    left += (this.pseudoRandom(index, 1) - 0.5) * 2 * jitterXRange;
    top += (this.pseudoRandom(index, 2) - 0.5) * 2 * jitterYRange;

    const maxLeft = Math.max(marginX, layout.width - layout.size - marginX);
    const maxTop = Math.max(marginY, layout.height - layout.size - marginY);

    left = Math.max(marginX, Math.min(left, maxLeft));
    top = Math.max(marginY, Math.min(top, maxTop));

    return { x: left, y: top };
  }

  calculateLayoutParameters() {
    const width = window.innerWidth;
    const height = window.innerHeight;
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

    const offsetX = Math.random();
    const offsetY = Math.random();

    return { width, height, swatchCount, size, fontSize, offsetX, offsetY };
  }

  createSwatchElement(colorItem, layout, index) {
    const swatch = document.createElement('button');
    const inner = document.createElement('span');
    const info = document.createElement('span');
    const nameEl = document.createElement('span');
    const hexEl = document.createElement('span');

    swatch.type = 'button';
    swatch.className = 'color-swatch';
    swatch.setAttribute('aria-label', `${colorItem.name} ${colorItem.hex}, click to copy`);
    swatch.style.width = `${layout.size}px`;
    swatch.style.height = `${layout.size}px`;
    swatch.style.zIndex = String(index);
    swatch.style.opacity = '0';

    inner.className = 'swatch-inner';
    inner.style.backgroundColor = colorItem.hex;

    info.className = 'color-info';
    info.style.fontSize = `${layout.fontSize}px`;
    info.classList.add(getTextColorClass(colorItem.hex));

    nameEl.className = 'color-name';
    nameEl.textContent = colorItem.name;

    hexEl.className = 'color-hex';
    hexEl.textContent = colorItem.hex;

    info.appendChild(nameEl);
    info.appendChild(hexEl);
    inner.appendChild(info);
    swatch.appendChild(inner);

    this.attachSwatchListeners(swatch, colorItem);
    return swatch;
  }

  getToastElement() {
    if (typeof document === 'undefined') return null;

    const existing = typeof document.getElementById === 'function'
      ? document.getElementById('copyToast')
      : null;

    if (existing && existing !== this.container) {
      return existing;
    }

    if (!document.body || typeof document.createElement !== 'function') {
      return null;
    }

    const toast = document.createElement('div');
    toast.id = 'copyToast';
    toast.className = 'copy-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toast);
    return toast;
  }

  showCopyFeedback(message, isError = false) {
    const toast = this.getToastElement();
    if (!toast) return;

    clearTimeout(this.toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toast.classList.toggle('is-error', isError);

    this.toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible', 'is-error');
      toast.textContent = '';
    }, 2000);
  }

  async copyHex(hex) {
    const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : null;
    if (clipboard && typeof clipboard.writeText === 'function') {
      try {
        await clipboard.writeText(hex);
        return true;
      } catch {
        // Fall through to legacy textarea copy fallback.
      }
    }

    return this.fallbackCopyText(hex);
  }

  fallbackCopyText(text) {
    if (
      typeof document === 'undefined' ||
      !document.body ||
      typeof document.createElement !== 'function' ||
      typeof document.execCommand !== 'function'
    ) {
      return false;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.className = 'visually-hidden-copy';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange?.(0, text.length);

    let copied = false;
    try {
      copied = Boolean(document.execCommand('copy'));
    } catch {
      copied = false;
    } finally {
      if (typeof textarea.remove === 'function') {
        textarea.remove();
      } else if (textarea.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }
    }

    return copied;
  }

  setActiveSwatch(swatch) {
    if (this.activeSwatch && this.activeSwatch !== swatch) {
      this.activeSwatch.classList?.remove('is-active');
    }
    this.activeSwatch = swatch;
    swatch.classList?.add('is-active');

    clearTimeout(this.activeTimer);
    this.activeTimer = setTimeout(() => {
      swatch.classList?.remove('is-active');
      if (this.activeSwatch === swatch) {
        this.activeSwatch = null;
      }
    }, 1500);
  }

  attachSwatchListeners(swatch, colorItem) {
    const bringToFront = () => {
      this.highestZIndex++;
      swatch.style.zIndex = String(this.highestZIndex);
    };

    swatch.addEventListener('mouseenter', bringToFront);
    swatch.addEventListener('focus', bringToFront);

    swatch.addEventListener('click', (event) => {
      event.stopPropagation();
      bringToFront();
      this.setActiveSwatch(swatch);

      void this.copyHex(colorItem.hex).then((copied) => {
        if (copied) {
          this.showCopyFeedback(`Copied ${colorItem.hex}`, false);
        } else {
          this.showCopyFeedback(`Could not copy ${colorItem.hex}`, true);
        }
      });
    });
  }

  prefersReducedMotion() {
    return Boolean(
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  animateIn(swatch, layout, target) {
    if (this.prefersReducedMotion()) {
      swatch.style.setProperty('--inverse-rotation', '0deg');
      swatch.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) scale(1)`;
      swatch.style.opacity = '1';
      return { x: target.x, y: target.y, rotation: 0 };
    }

    const rotation = Math.random() * 360;
    const initialScale = 0.1;
    const initialX = Math.random() * layout.width;
    const initialY = Math.random() * layout.height;

    swatch.style.setProperty('--inverse-rotation', `-${rotation}deg`);

    const initialTransform = `translate3d(${initialX}px, ${initialY}px, 0) scale(${initialScale}) rotate(${rotation}deg)`;
    swatch.style.transform = initialTransform;

    const restingTransform = `translate3d(${target.x}px, ${target.y}px, 0) scale(1) rotate(${rotation}deg)`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        swatch.style.transform = restingTransform;
        swatch.style.opacity = '1';
      });
    });

    return { x: target.x, y: target.y, rotation };
  }
}
