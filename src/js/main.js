const MIN_BLOCKS = 16;
const MAX_BLOCKS = 20;

const masterColorsList = [
  // Global Tech Brands
  { hex: '#4285F4', name: 'Google Blue' },
  { hex: '#DB4437', name: 'Google Red' },
  { hex: '#F4B400', name: 'Google Yellow' },
  { hex: '#0F9D58', name: 'Google Green' },
  { hex: '#0078D4', name: 'Microsoft Blue' },
  { hex: '#86868B', name: 'Apple Gray' },
  { hex: '#FF9900', name: 'Amazon Orange' },
  { hex: '#1877F2', name: 'Facebook Blue' },
  { hex: '#1DB954', name: 'Spotify Green' },
  { hex: '#E50914', name: 'Netflix Red' },
  { hex: '#1DA1F2', name: 'Twitter Blue' },
  { hex: '#0A66C2', name: 'LinkedIn Blue' },
  { hex: '#000000', name: 'Uber Black' },
  { hex: '#00457C', name: 'PayPal Blue' },
  { hex: '#4A154B', name: 'Slack Purple' },
  { hex: '#FF4500', name: 'Reddit Orange' },
  { hex: '#9146FF', name: 'Twitch Purple' },

  // Global Universities
  { hex: '#A51C30', name: 'Harvard Crimson' },
  { hex: '#00356B', name: 'Yale Blue' },
  { hex: '#8C1515', name: 'Stanford Cardinal' },
  { hex: '#002147', name: 'Oxford Blue' },
  { hex: '#A3C1AD', name: 'Cambridge Green' },
  { hex: '#72246C', name: 'Tsinghua Purple' },
  { hex: '#C60C30', name: 'Peking Red' },
  { hex: '#002B7F', name: 'UTokyo Blue' },
  { hex: '#1B365D', name: 'MIT Blue' },
  { hex: '#F3C100', name: 'Berkeley Gold' },

  // Material Design Colors
  { hex: '#F44336', name: 'Material Red' },
  { hex: '#E91E63', name: 'Material Pink' },
  { hex: '#9C27B0', name: 'Material Purple' },
  { hex: '#3F51B5', name: 'Material Indigo' },
  { hex: '#2196F3', name: 'Material Blue' },
  { hex: '#03A9F4', name: 'Material Light Blue' },
  { hex: '#00BCD4', name: 'Material Cyan' },
  { hex: '#009688', name: 'Material Teal' },
  { hex: '#4CAF50', name: 'Material Green' },
  { hex: '#8BC34A', name: 'Material Light Green' },
  { hex: '#CDDC39', name: 'Material Lime' },
  { hex: '#FFEB3B', name: 'Material Yellow' },
  { hex: '#FFC107', name: 'Material Amber' },
  { hex: '#FF9800', name: 'Material Orange' },
  { hex: '#FF5722', name: 'Material Deep Orange' },
  { hex: '#795548', name: 'Material Brown' },
  { hex: '#607D8B', name: 'Material Blue Grey' },
  { hex: '#9E9E9E', name: 'Material Grey' },

  // Flat UI Style
  { hex: '#2ECC71', name: 'Flat Green' },
  { hex: '#3498DB', name: 'Flat Blue' },
  { hex: '#E74C3C', name: 'Flat Red' },
  { hex: '#1ABC9C', name: 'Flat Turquoise' },
  { hex: '#9B59B6', name: 'Flat Purple' },
  { hex: '#F39C12', name: 'Flat Orange' },
  { hex: '#D35400', name: 'Flat Dark Orange' },
  { hex: '#34495E', name: 'Flat Midnight Blue' },
  { hex: '#7F8C8D', name: 'Flat Gray' },
  { hex: '#BDC3C7', name: 'Flat Silver' }
];


let container;
let highestZIndex = 0;

function getTextColorForBackground(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 150 ? 'dark-text' : 'light-text';
}

function repositionSwatch(swatch) {
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const size = parseFloat(swatch.style.width);
  const padding = size * 0.2;
  const x = padding + Math.random() * (containerWidth - size - padding * 2);
  const y = padding + Math.random() * (containerHeight - size - padding * 2);
  const rotation = (Math.random() - 0.5) * 40;
  swatch._restingTransform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`;
}

function generateRandomSwatches() {
  if (!container) return;
  container.innerHTML = '';

  const shuffled = [...masterColorsList].sort(() => 0.5 - Math.random());
  const count = Math.floor(Math.random() * (MAX_BLOCKS - MIN_BLOCKS + 1)) + MIN_BLOCKS;
  const selectedColors = shuffled.slice(0, count);
  highestZIndex = selectedColors.length;

  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const base = Math.min(containerWidth, containerHeight);
  const blockSize = base * 0.18;

  selectedColors.forEach((colorItem, index) => {
    const swatch = document.createElement('div');
    swatch.classList.add('color-swatch');
    swatch.style.backgroundColor = colorItem.hex;
    swatch.style.width = `${blockSize}px`;
    swatch.style.height = `${blockSize}px`;
    swatch.style.opacity = '0';
    swatch.style.willChange = 'transform, opacity';

    const colorInfo = document.createElement('div');
    colorInfo.classList.add('color-info');
    colorInfo.innerHTML = `${colorItem.name}<br>${colorItem.hex}`;
    swatch.appendChild(colorInfo);

    repositionSwatch(swatch);
    swatch.style.transform = `translate3d(${Math.random() * containerWidth}px, -200px, 0) rotate(${(Math.random() - 0.5) * 90}deg)`;
    swatch._restingZIndex = index;
    swatch.style.zIndex = index;

    swatch.addEventListener('mouseenter', () => {
      swatch.style.transition = 'transform 0.25s ease-out';
      swatch.style.transform = swatch._restingTransform + ' scale(1.1)';
      swatch.style.zIndex = 999;
    });

    swatch.addEventListener('mouseleave', () => {
      swatch.style.transition = 'transform 0.25s ease-out';
      swatch.style.transform = swatch._restingTransform;
      swatch.style.zIndex = swatch._restingZIndex;
    });

    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-info.is-visible').forEach(el => el.classList.remove('is-visible'));
      highestZIndex++;
      swatch._restingZIndex = highestZIndex;
      swatch.style.zIndex = highestZIndex;

      const textColor = getTextColorForBackground(colorItem.hex);
      colorInfo.classList.remove('text-dark');
      if (textColor === 'dark-text') colorInfo.classList.add('text-dark');
      colorInfo.classList.add('is-visible');
      navigator.clipboard?.writeText(colorItem.hex);
    });

    container.appendChild(swatch);

    requestAnimationFrame(() => {
      setTimeout(() => {
        repositionSwatch(swatch);
        swatch.style.transition = 'transform 1.2s cubic-bezier(0.2, 1, 0.3, 1), opacity 0.8s ease-in';
        swatch.style.transform = swatch._restingTransform;
        swatch.style.opacity = '1';
        swatch.classList.add('is-settled');
      }, index * 100 + 100);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  container = document.getElementById('paletteContainer');
  if (container) {
    generateRandomSwatches();
    window.addEventListener('resize', () => generateRandomSwatches());
  }
});
