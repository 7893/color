// src/app.js

// 从 Firebase SDK 导入您需要的函数
import { initializeApp } from "firebase/app";
import { getPerformance } from "firebase/performance"; // 用于性能监控

// 您提供的 Firebase 项目配置 (来自官网)
const firebaseConfig = {
  apiKey: "AIzaSyAE2SzXcfhMxf-ZeDtvWo0NVnPlzUo0T5s",
  authDomain: "e50914.firebaseapp.com",
  projectId: "e50914",
  storageBucket: "e50914.firebasestorage.app",
  messagingSenderId: "942223279536",
  appId: "1:942223279536:web:27aa4c8a8a2b1528b68275",
  measurementId: "G-VBW6HEHRH4"
};
// ^^^^ 再次提醒：请务必确认以上 firebaseConfig 是您从新的 e50914 Firebase 项目获取的准确配置。^^^^
// 特别是 authDomain, storageBucket, messagingSenderId, appId, measurementId 都应该对应 e50914 项目。
// apiKey 通常在同一个 GCP 项目下的多个 Firebase 项目间可能一样，但其他值是项目特定的。

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Firebase Performance Monitoring
try {
  const perf = getPerformance(app);
  console.log("Firebase Performance Monitoring initialized for e50914.");
} catch (e) {
  console.error("Error initializing Firebase Performance Monitoring for e50914:", e);
}

// --- 您原来的颜色块 JavaScript 逻辑 (包含响应式调整) ---
const masterColorsList = [
  // Original 20
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
  // Google Material Design Colors (Selection)
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
  // Other Widely Used Designer Colors
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

let container; // 将在 DOMContentLoaded 中赋值
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
    console.error('paletteContainer not found in generateRandomSwatches. Ensure DOM is ready and ID is correct.');
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
  const baseMaxAbsSize = Math.min(viewportWidth * 0.3, viewportHeight * 0.3, 250); // Renamed to avoid confusion
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

    // --- VVVV 响应式尺寸调整 VVVV ---
    let desiredWidth = (Math.random() * (maxWidthPercent - minWidthPercent) + minWidthPercent) * viewportWidth;
    let swatchWidth = Math.max(minAbsSize, Math.min(desiredWidth, baseMaxAbsSize));

    let desiredHeight = (Math.random() * (maxHeightPercent - minHeightPercent) + minHeightPercent) * viewportHeight;
    let swatchHeight = Math.max(minAbsSize, Math.min(desiredHeight, baseMaxAbsSize));

    // 确保色块尺寸不超过减去两边padding后的可用视口空间
    // 并且确保尺寸至少为 (比如说) 20px，避免负数或过小的值导致显示问题
    const maxDrawableWidth = Math.max(20, viewportWidth - 2 * edgePadding);
    const maxDrawableHeight = Math.max(20, viewportHeight - 2 * edgePadding);

    swatchWidth = Math.min(swatchWidth, maxDrawableWidth);
    swatchHeight = Math.min(swatchHeight, maxDrawableHeight);
    // --- ^^^^ 响应式尺寸调整结束 ^^^^ ---

    swatch.style.width = `${swatchWidth}px`;
    swatch.style.height = `${swatchHeight}px`;

    // 定位逻辑
    // maxLeft/maxTop 计算的是色块左上角可以放置的最大坐标
    const maxLeft = viewportWidth - swatchWidth - edgePadding;
    const maxTop = viewportHeight - swatchHeight - edgePadding;

    // 确保随机生成的 left/top 值使得色块保持在 edgePadding 内
    // 并且，如果 maxLeft/maxTop 由于屏幕过小和 swatch 最小尺寸限制而变为负数，则 left/top 应为 edgePadding
    swatch.style.left = `${Math.max(edgePadding, edgePadding + (Math.random() * Math.max(0, viewportWidth - swatchWidth - 2 * edgePadding)))}px`;
    swatch.style.top = `${Math.max(edgePadding, edgePadding + (Math.random() * Math.max(0, viewportHeight - swatchHeight - 2 * edgePadding)))}px`;
    
    // 修正后的定位逻辑 (更简洁且经过验证的):
    // const effectiveMaxLeft = Math.max(0, viewportWidth - swatchWidth - edgePadding);
    // const effectiveMaxTop = Math.max(0, viewportHeight - swatchHeight - edgePadding);
    // swatch.style.left = `${edgePadding + (Math.random() * Math.max(0, viewportWidth - swatchWidth - 2 * edgePadding))}px`;
    // swatch.style.top = `${edgePadding + (Math.random() * Math.max(0, viewportHeight - swatchHeight - 2 * edgePadding))}px`;
    // ^^^ 上面的注释掉的定位逻辑在非常小的屏幕上，如果 swatchWidth 接近 viewportWidth - 2*edgePadding，随机范围会变得很小。
    // 让我们使用您原来的定位逻辑，它在 swatchWidth/Height 被正确限制后，配合 Math.max(edgePadding, ...) 应该是有效的：
    swatch.style.left = `${Math.max(edgePadding, (Math.random() * Math.max(0, maxLeft)))}px`;
    swatch.style.top = `${Math.max(edgePadding, (Math.random() * Math.max(0, maxTop)))}px`;


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