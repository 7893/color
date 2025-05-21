// src/app.js

import { initializeApp } from "firebase/app";
import { getPerformance } from "firebase/performance";

const firebaseConfig = {
  apiKey: "AIzaSyAE2SzXcfhMxf-ZeDtvWo0NVnPlzUo0T5s",
  authDomain: "e50914.firebaseapp.com",
  projectId: "e50914",
  storageBucket: "e50914.firebasestorage.app",
  messagingSenderId: "942223279536",
  appId: "1:942223279536:web:27aa4c8a8a2b1528b68275",
  measurementId: "G-VBW6HEHRH4"
};

const app = initializeApp(firebaseConfig);
try {
  const perf = getPerformance(app);
  console.log("Firebase Performance Monitoring initialized for e50914.");
} catch (e) {
  console.error("Error initializing Firebase Performance Monitoring for e50914:", e);
}

const masterColorsList = [
  { hex: '#4285F4', name: 'Google Blue' }, { hex: '#DB4437', name: 'Google Red' },
  { hex: '#F4B400', name: 'Google Yellow', needsDarkText: true }, { hex: '#0F9D58', name: 'Google Green' },
  { hex: '#1877F2', name: 'Meta Blue' }, { hex: '#0078D4', name: 'Microsoft Blue' },
  { hex: '#86868B', name: 'Apple Gray' }, { hex: '#FF9900', name: 'Amazon Orange', needsDarkText: true },
  { hex: '#1DB954', name: 'Spotify Green' }, { hex: '#E50914', name: 'Netflix Red' },
  { hex: '#1DA1F2', name: 'Connect Blue' }, { hex: '#0A66C2', name: 'LinkedIn Blue' },
  { hex: '#007BFF', name: 'Primary Blue' }, { hex: '#28A745', name: 'Success Green' },
  { hex: '#DC3545', name: 'Danger Red' }, { hex: '#FFC107', name: 'Warning Yellow', needsDarkText: true },
  { hex: '#181717', name: 'GitHub Black' }, { hex: '#4A154B', name: 'Slack Purple' },
  { hex: '#00457C', name: 'PayPal Blue' }, { hex: '#000000', name: 'Uber Black' },
  { hex: '#F44336', name: 'Material Red 500' }, { hex: '#E91E63', name: 'Material Pink 500' },
  { hex: '#FFCDD2', name: 'Material Red 100', needsDarkText: true }, { hex: '#F8BBD0', name: 'Material Pink 100', needsDarkText: true },
  { hex: '#9C27B0', name: 'Material Purple 500' }, { hex: '#673AB7', name: 'Material Deep Purple 500' },
  { hex: '#3F51B5', name: 'Material Indigo 500' }, { hex: '#7E57C2', name: 'Material Deep Purple 400' },
  { hex: '#2196F3', name: 'Material Blue 500' }, { hex: '#03A9F4', name: 'Material Light Blue 500' },
  { hex: '#00BCD4', name: 'Material Cyan 500' }, { hex: '#009688', name: 'Material Teal 500' },
  { hex: '#90CAF9', name: 'Material Blue 200', needsDarkText: true }, { hex: '#4CAF50', name: 'Material Green 500' },
  { hex: '#8BC34A', name: 'Material Light Green 500' }, { hex: '#CDDC39', name: 'Material Lime 500', needsDarkText: true },
  { hex: '#AED581', name: 'Material Light Green 300', needsDarkText: true }, { hex: '#FFEB3B', name: 'Material Yellow 500', needsDarkText: true },
  { hex: '#FFC107', name: 'Material Amber 500', needsDarkText: true }, { hex: '#FF9800', name: 'Material Orange 500' },
  { hex: '#FF5722', name: 'Material Deep Orange 500' }, { hex: '#795548', name: 'Material Brown 500' },
  { hex: '#9E9E9E', name: 'Material Grey 500' }, { hex: '#607D8B', name: 'Material Blue Grey 500' },
  { hex: '#BDBDBD', name: 'Material Grey 400' }, { hex: '#424242', name: 'Material Grey 800' },
  { hex: '#FAFAFA', name: 'Material Grey 50', needsDarkText: true }, { hex: '#212121', name: 'Material Grey 900' },
  { hex: '#FFFFFF', name: 'White', needsDarkText: true }, { hex: '#333333', name: 'Dark Charcoal' },
  { hex: '#F0F8FF', name: 'Alice Blue', needsDarkText: true }, { hex: '#FAEBD7', name: 'Antique White', needsDarkText: true },
  { hex: '#FF6347', name: 'Tomato' }, { hex: '#FFD700', name: 'Gold', needsDarkText: true },
  { hex: '#ADFF2F', name: 'Green Yellow', needsDarkText: true }, { hex: '#4682B4', name: 'Steel Blue' },
  { hex: '#D2691E', name: 'Chocolate' }, { hex: '#20B2AA', name: 'Light Sea Green' },
  { hex: '#C71585', name: 'Medium Violet Red' }, { hex: '#6A5ACD', name: 'Slate Blue' },
  { hex: '#F5F5DC', name: 'Beige', needsDarkText: true }, { hex: '#A0522D', name: 'Sienna' },
  { hex: '#66CDAA', name: 'Medium Aquamarine', needsDarkText: true }, { hex: '#BA55D3', name: 'Medium Orchid' },
  { hex: '#FFA07A', name: 'Light Salmon', needsDarkText: true }, { hex: '#DDA0DD', name: 'Plum' },
  { hex: '#87CEEB', name: 'Sky Blue', needsDarkText: true }, { hex: '#FFB6C1', name: 'Light Pink', needsDarkText: true },
  { hex: '#F0E68C', name: 'Khaki', needsDarkText: true }, { hex: '#E6E6FA', name: 'Lavender', needsDarkText: true },
  { hex: '#008080', name: 'Teal' }, { hex: '#800000', name: 'Maroon' },
  { hex: '#000080', name: 'Navy' }, { hex: '#808000', name: 'Olive' },
  { hex: '#C0C0C0', name: 'Silver', needsDarkText: true }, { hex: '#F5DEB3', name: 'Wheat', needsDarkText: true },
  { hex: '#DEB887', name: 'Burly Wood', needsDarkText: true }
];

let container;
let currentTopZIndexOnClick;

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function generateRandomSwatches() {
  if (!container) {
    // console.error('paletteContainer not found in generateRandomSwatches.'); // 已移至 DOMContentLoaded
    return;
  }
  container.innerHTML = '';
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const shuffledMasterList = [...masterColorsList].sort(() => 0.5 - Math.random());
  const selectedColors = shuffledMasterList.slice(0, 20);
  currentTopZIndexOnClick = selectedColors.length;

  const minWidthPercent = 0.10;
  const maxWidthPercent = 0.22;
  const minHeightPercent = 0.10;
  const maxHeightPercent = 0.22;

  const minAbsSize = 80;
  // baseMaxAbsSize 是基于视口30%和250px的初步最大值
  const baseMaxAbsSize = Math.min(viewportWidth * 0.3, viewportHeight * 0.3, 250);
  const edgePadding = 10;

  selectedColors.forEach((colorItem, index) => {
    const swatch = document.createElement('div');
    swatch.classList.add('color-swatch');
    swatch.style.backgroundColor = colorItem.hex;
    if (colorItem.needsDarkText) {
      swatch.classList.add('text-dark');
    }

    const colorInfo = document.createElement('div');
    colorInfo.classList.add('color-info');
    colorInfo.innerHTML = `${colorItem.hex}<br>${colorItem.name}`;
    swatch.appendChild(colorInfo);

    // 1. 计算期望尺寸 (基于百分比和绝对值限制)
    let desiredWidth = (Math.random() * (maxWidthPercent - minWidthPercent) + minWidthPercent) * viewportWidth;
    let swatchWidth = Math.max(minAbsSize, Math.min(desiredWidth, baseMaxAbsSize));

    let desiredHeight = (Math.random() * (maxHeightPercent - minHeightPercent) + minHeightPercent) * viewportHeight;
    let swatchHeight = Math.max(minAbsSize, Math.min(desiredHeight, baseMaxAbsSize));

    // 2. 再次限制尺寸，确保适应屏幕可用空间（减去两边padding）
    //    并确保至少有一个很小的尺寸（例如20px），以防计算结果为0或负。
    const maxDrawableWidth = Math.max(20, viewportWidth - (2 * edgePadding));
    const maxDrawableHeight = Math.max(20, viewportHeight - (2 * edgePadding));

    swatchWidth = Math.min(swatchWidth, maxDrawableWidth);
    swatchHeight = Math.min(swatchHeight, maxDrawableHeight);

    swatch.style.width = `${swatchWidth}px`;
    swatch.style.height = `${swatchHeight}px`;

    // 3. 计算定位 (使用确保边界的逻辑)
    //    可供色块左上角随机移动的水平范围
    const availableWidthForRandomOffset = viewportWidth - swatchWidth - (2 * edgePadding);
    const randomXOffset = Math.random() * Math.max(0, availableWidthForRandomOffset); // 确保不乘以负数
    const finalLeft = edgePadding + randomXOffset;
    swatch.style.left = `${finalLeft}px`;

    //    可供色块左上角随机移动的垂直范围
    const availableHeightForRandomOffset = viewportHeight - swatchHeight - (2 * edgePadding);
    const randomYOffset = Math.random() * Math.max(0, availableHeightForRandomOffset); // 确保不乘以负数
    const finalTop = edgePadding + randomYOffset;
    swatch.style.top = `${finalTop}px`;

    swatch.style.zIndex = index;

    swatch.addEventListener('click', function () {
      currentTopZIndexOnClick++;
      this.style.zIndex = currentTopZIndexOnClick;
      const hexToCopy = colorItem.hex;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(hexToCopy).then(() => {
          console.log(`Color ${hexToCopy} copied to clipboard!`);
        }).catch(err => {
          console.error('Failed to copy color to clipboard: ', err);
        });
      } else {
        console.warn('Clipboard API not available. Could not copy color.');
      }
    });

    container.appendChild(swatch);
    setTimeout(() => {
      swatch.style.opacity = '1';
    }, index * 50 + 50);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  container = document.getElementById('paletteContainer');
  if (container) {
    generateRandomSwatches();
    window.addEventListener('resize', debounce(generateRandomSwatches, 250));
  } else {
    console.error('Element with ID "paletteContainer" not found after DOMContentLoaded.');
  }
});