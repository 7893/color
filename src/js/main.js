// 必须在JS文件的开头引入CSS，Vite才能将其打包
import '../css/style.css';

// Firebase 初始化逻辑 (这部分在模块中可以保持不变)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getPerformance } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-performance.js";
const firebaseConfig = { apiKey: "AIzaSyAE2SzXcfhMxf-ZeDtvWo0NVnPlzUo0T5s", authDomain: "e50914.firebaseapp.com", projectId: "e50914", storageBucket: "e50914.appspot.com", messagingSenderId: "942223279536", appId: "1:942223279536:web:27aa4c8a8a2b1528b68275", measurementId: "G-VBW6HEHRH4" };
try {
    const app = initializeApp(firebaseConfig);
    const perf = getPerformance(app);
    console.log("Firebase Performance Monitoring initialized using ESM.");
} catch (e) {
    console.error("Failed to initialize Firebase:", e);
}

// 应用主逻辑
const masterColorsList = [ { hex: '#4285F4', name: 'Google Blue' }, { hex: '#DB4437', name: 'Google Red' }, { hex: '#F4B400', name: 'Google Yellow' }, { hex: '#0F9D58', name: 'Google Green' }, { hex: '#1877F2', name: 'Meta Blue' }, { hex: '#0078D4', name: 'Microsoft Blue' }, { hex: '#86868B', name: 'Apple Gray' }, { hex: '#FF9900', name: 'Amazon Orange' }, { hex: '#1DB954', name: 'Spotify Green' }, { hex: '#E50914', name: 'Netflix Red' }, { hex: '#1DA1F2', name: 'Twitter Blue' }, { hex: '#0A66C2', name: 'LinkedIn Blue' }, { hex: '#007BFF', name: 'Primary Blue' }, { hex: '#28A745', name: 'Success Green' }, { hex: '#DC3545', name: 'Danger Red' }, { hex: '#FFC107', name: 'Warning Yellow' }, { hex: '#181717', name: 'GitHub Black' }, { hex: '#4A154B', name: 'Slack Purple' }, { hex: '#00457C', name: 'PayPal Blue' }, { hex: '#000000', name: 'Uber Black' }, { hex: '#F44336', name: 'Material Red' }, { hex: '#E91E63', name: 'Material Pink' }, { hex: '#FFCDD2', name: 'Material Red 100' }, { hex: '#F8BBD0', name: 'Material Pink 100' }, { hex: '#9C27B0', name: 'Material Purple' }, { hex: '#673AB7', name: 'Material Deep Purple' }, { hex: '#3F51B5', name: 'Material Indigo' }, { hex: '#7E57C2', name: 'Material Deep Purple 400' }, { hex: '#2196F3', name: 'Material Blue' }, { hex: '#03A9F4', name: 'Material Light Blue' }, { hex: '#00BCD4', name: 'Material Cyan' }, { hex: '#009688', name: 'Material Teal' }, { hex: '#90CAF9', name: 'Material Blue 200' }, { hex: '#4CAF50', name: 'Material Green' }, { hex: '#8BC34A', name: 'Material Light Green' }, { hex: '#CDDC39', name: 'Material Lime' }, { hex: '#AED581', name: 'Material Light Green 300' }, { hex: '#FFEB3B', name: 'Material Yellow' }, { hex: '#FFC107', name: 'Material Amber' }, { hex: '#FF9800', name: 'Material Orange' }, { hex: '#FF5722', name: 'Material Deep Orange' }, { hex: '#795548', name: 'Material Brown' }, { hex: '#9E9E9E', name: 'Material Grey' }, { hex: '#607D8B', name: 'Material Blue Grey' }, { hex: '#FFFFFF', name: 'White' }, { hex: '#333333', name: 'Dark Charcoal' }, { hex: '#F0F8FF', name: 'Alice Blue' }, { hex: '#FF6347', name: 'Tomato' }, { hex: '#FFD700', 'name': 'Gold' }, { hex: '#4682B4', name: 'Steel Blue' }, { hex: '#D2691E', name: 'Chocolate' }, { hex: '#20B2AA', name: 'Light Sea Green' }, { hex: '#C71585', name: 'Medium Violet Red' }, { hex: '#6A5ACD', name: 'Slate Blue' } ];
let container;
let highestZIndex = 0;

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function getTextColorForBackground(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luma = (0.299 * r + 0.587 * g + 0.114 * b);
    return luma > 150 ? 'dark-text' : 'light-text'; 
}

function generateRandomSwatches() {
    if (!container) return;
    container.innerHTML = '';
    const shuffledMasterList = [...masterColorsList].sort(() => 0.5 - Math.random());
    const selectedColors = shuffledMasterList.slice(0, 18);
    highestZIndex = selectedColors.length;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const smallerDim = Math.min(containerWidth, containerHeight);
    const size = smallerDim * 0.2;
    const padding = size * 0.2;

    selectedColors.forEach((colorItem, index) => {
        const swatch = document.createElement('div');
        swatch.classList.add('color-swatch');
        swatch.style.backgroundColor = colorItem.hex;
        const colorInfo = document.createElement('div');
        colorInfo.classList.add('color-info');
        colorInfo.innerHTML = \`\${colorItem.name}<br>\${colorItem.hex}\`;
        swatch.appendChild(colorInfo);
        swatch.style.width = \`\${size}px\`;
        swatch.style.height = \`\${size}px\`;

        const targetX = padding + Math.random() * (containerWidth - size - padding * 2);
        const targetY = padding + Math.random() * (containerHeight - size - padding * 2);
        const rotation = (Math.random() - 0.5) * 40;
        const restingTransform = \`translate3d(\${targetX}px, \${targetY}px, 0) rotate(\${rotation}deg)\`;
        swatch._restingTransform = restingTransform;
        
        const initialRotation = (Math.random() - 0.5) * 90;
        const initialX = Math.random() * containerWidth;
        swatch.style.transform = \`translate3d(\${initialX}px, -200px, 0) rotate(\${initialRotation}deg)\`;

        swatch._restingZIndex = index;
        swatch.style.zIndex = swatch._restingZIndex;
        
        swatch.addEventListener('mouseenter', function() {
            this.style.transition = 'transform 0.25s ease-out';
            this.style.transform = this._restingTransform + ' scale(1.1)';
            this.style.zIndex = 999;
        });
        swatch.addEventListener('mouseleave', function() {
            this.style.transition = 'transform 0.25s ease-out';
            this.style.transform = this._restingTransform;
            this.style.zIndex = this._restingZIndex;
        });
        swatch.addEventListener('click', function () {
            document.querySelectorAll('.color-info.is-visible').forEach(el => el.classList.remove('is-visible'));
            highestZIndex++;
            this._restingZIndex = highestZIndex;
            this.style.zIndex = this._restingZIndex;
            const textColorClass = getTextColorForBackground(colorItem.hex);
            colorInfo.classList.remove('text-dark');
            if (textColorClass === 'dark-text') {
                colorInfo.classList.add('text-dark');
            }
            colorInfo.classList.add('is-visible');
            if (navigator.clipboard) navigator.clipboard.writeText(colorItem.hex);
        });
        
        container.appendChild(swatch);
        
        setTimeout(() => {
            swatch.style.transition = 'transform 1.2s cubic-bezier(0.2, 1, 0.3, 1), opacity 0.8s ease-in';
            swatch.style.transform = swatch._restingTransform;
            swatch.classList.add('is-settled');
        }, 50);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    container = document.getElementById('paletteContainer');
    if (container) {
        generateRandomSwatches();
        window.addEventListener('resize', debounce(generateRandomSwatches, 250));
    }
});
