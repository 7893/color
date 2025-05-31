import { masterColorsList } from './colors.js';

// --- 可调整的动态参数 ---
const BASE_SWATCH_SIZE_SCREEN_FACTOR = 0.16;
const DESIRED_SCREEN_FILL_RATIO = 0.45;
const MIN_SWATCH_COUNT_ABSOLUTE = 5;       // 【调整】修改了常量名，并设定为绝对最小数量
const MAX_SWATCH_COUNT_INITIAL_CAP = 30; // 初始数量计算的软上限

const MIN_BLOCK_SIZE_FACTOR_OF_REF_DIM = 0.07;
const MAX_BLOCK_SIZE_FACTOR_OF_REF_DIM = 0.22;
const ABSOLUTE_MIN_BLOCK_SIZE_PX = 50;

const FONT_SIZE_TO_BLOCK_RATIO = 0.10;
const MIN_ABSOLUTE_FONT_SIZE_PX = 8;
// --- 结束：可调整的动态参数 ---

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

  const distCenterToCorner = size / Math.sqrt(2);
  const minSafeCenterX = distCenterToCorner;
  const maxSafeCenterX = containerWidth - distCenterToCorner;
  const minSafeCenterY = distCenterToCorner;
  const maxSafeCenterY = containerHeight - distCenterToCorner;

  let centerX, centerY;
  let rotation = Math.random() * 360;

  if (maxSafeCenterX <= minSafeCenterX || maxSafeCenterY <= minSafeCenterY) {
    centerX = containerWidth / 2;
    centerY = containerHeight / 2;
    rotation = 0;
  } else {
    centerX = minSafeCenterX + Math.random() * (maxSafeCenterX - minSafeCenterX);
    centerY = minSafeCenterY + Math.random() * (maxSafeCenterY - minSafeCenterY);
  }

  const x = centerX - size / 2;
  const y = centerY - size / 2;

  swatch._rotationAngle = rotation;
  swatch._restingTransform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rotation.toFixed(2)}deg)`;
}

function generateRandomSwatches() {
  if (!container) return;
  container.innerHTML = '';

  const containerWidth = container.clientWidth;
  const containerHeight = Math.max(container.clientHeight, window.innerHeight);
  const screenArea = containerWidth * containerHeight;
  const referenceDimension = Math.min(containerWidth, containerHeight);

  // 1. 计算基础色块大小 (baseSwatchSize)
  let baseSwatchSize = referenceDimension * BASE_SWATCH_SIZE_SCREEN_FACTOR;

  // 2. 根据 baseSwatchSize 和期望填充率，估算初始数量 (initialCountEstimate)
  const totalAreaToFill = screenArea * DESIRED_SCREEN_FILL_RATIO;
  const singleSwatchNominalArea = Math.max(1, baseSwatchSize * baseSwatchSize);
  let initialCountEstimate = Math.round(totalAreaToFill / singleSwatchNominalArea);

  // 3. 对初始数量进行钳制
  let count = Math.max(MIN_SWATCH_COUNT_ABSOLUTE, Math.min(initialCountEstimate, masterColorsList.length, MAX_SWATCH_COUNT_INITIAL_CAP));

  // 【核心改进】将计算出的数量再减少30%
  count = Math.round(count * 0.70);

  // 【核心改进】确保减少后的数量不会低于绝对最小数量，且不超过颜色库总数
  count = Math.max(MIN_SWATCH_COUNT_ABSOLUTE, Math.min(count, masterColorsList.length));


  // 4. 根据最终确定的数量 (新的、减少后的 count)，反过来精确计算最终的色块大小 (finalBlockSize)
  const finalSingleSwatchArea = totalAreaToFill / Math.max(1, count); // 使用新的 count
  let finalBlockSize = Math.sqrt(finalSingleSwatchArea);

  // 5. 对 finalBlockSize 应用基于屏幕参考维度的“软”上下限，并加入绝对最小像素值
  finalBlockSize = Math.max(
    ABSOLUTE_MIN_BLOCK_SIZE_PX,
    referenceDimension * MIN_BLOCK_SIZE_FACTOR_OF_REF_DIM,
    Math.min(finalBlockSize, referenceDimension * MAX_BLOCK_SIZE_FACTOR_OF_REF_DIM)
  );
  finalBlockSize = Math.min(finalBlockSize, referenceDimension * 0.35);

  // 6. 字体大小根据最终的 finalBlockSize 动态调整
  const fontSize = Math.max(MIN_ABSOLUTE_FONT_SIZE_PX, finalBlockSize * FONT_SIZE_TO_BLOCK_RATIO) + 'px';

  // --- (用于调试观察) ---
  // console.log(`Screen: ${containerWidth}x${containerHeight} (RefDim: ${referenceDimension.toFixed(0)})`);
  // console.log(`Initial Count Est.: ${initialCountEstimate}, Clamped Initial: ${Math.max(MIN_SWATCH_COUNT_ABSOLUTE, Math.min(initialCountEstimate, masterColorsList.length, MAX_SWATCH_COUNT_INITIAL_CAP))}`);
  // console.log(`Final Count (reduced 30%): ${count}, Final BlockSize: ${finalBlockSize.toFixed(2)}, Font Size: ${fontSize}`);
  // ---

  const shuffled = [...masterColorsList].sort(() => 0.5 - Math.random());
  const selectedColors = shuffled.slice(0, count);
  highestZIndex = selectedColors.length;

  selectedColors.forEach((colorItem, index) => {
    const swatch = document.createElement('div');
    swatch.classList.add('color-swatch');
    swatch.style.backgroundColor = colorItem.hex;
    swatch.style.width = `${finalBlockSize}px`;
    swatch.style.height = `${finalBlockSize}px`;
    swatch.style.opacity = '0';
    swatch.style.willChange = 'transform, opacity';
    swatch._rotationAngle = 0;

    const colorInfo = document.createElement('div');
    colorInfo.classList.add('color-info');
    colorInfo.innerHTML = `${colorItem.name}<br>${colorItem.hex}`;
    colorInfo.style.fontSize = fontSize;
    swatch.appendChild(colorInfo);

    repositionSwatch(swatch);

    colorInfo.style.setProperty('--rotation-inverse', `-${swatch._rotationAngle}deg`);

    swatch.style.transform = `translate3d(${Math.random() * containerWidth}px, -200px, 0) rotate(${(Math.random() - 0.5) * 90}deg)`;
    swatch._restingZIndex = index;
    swatch.style.zIndex = index;

    // --- Event Listeners (保持不变) ---
    swatch.addEventListener('mouseenter', () => { /* ... */ });
    swatch.addEventListener('mouseleave', () => { /* ... */ });
    swatch.addEventListener('click', () => { /* ... */ });
    // --- End Event Listeners ---

    container.appendChild(swatch);

    requestAnimationFrame(() => {
      setTimeout(() => {
        swatch.style.transition = 'transform 1.2s cubic-bezier(0.2, 1, 0.3, 1), opacity 0.8s ease-in';
        swatch.style.transform = swatch._restingTransform;
        swatch.style.opacity = '1';
        swatch.classList.add('is-settled');
      }, index * 50 + 50);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  container = document.getElementById('paletteContainer');
  if (container) {
    generateRandomSwatches();
    window.addEventListener('resize', () => {
      clearTimeout(window._resizeTimer);
      window._resizeTimer = setTimeout(generateRandomSwatches, 200);
    });
  }
});