// 必须在JS文件的开头引入CSS，Vite才能将其打包
import '../css/style.css';

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getPerformance } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-performance.js";

const firebaseConfig = {
  apiKey: "AIzaSyAE2SzXcfhMxf-ZeDtvWo0NVnPlzUo0T5s",
  authDomain: "e50914.firebaseapp.com",
  projectId: "e50914",
  storageBucket: "e50914.appspot.com",
  messagingSenderId: "942223279536",
  appId: "1:942223279536:web:27aa4c8a8a2b1528b68275",
  measurementId: "G-VBW6HEHRH4"
};

try {
  const app = initializeApp(firebaseConfig);
  getPerformance(app);
} catch (e) {
  console.error("Failed to initialize Firebase:", e);
}

const masterColorsList = [
  { hex: '#4285F4', name: 'Google Blue' },
  { hex: '#DB4437', name: 'Google Red' },
  { hex: '#F4B400', name: 'Google Yellow' },
  { hex: '#0F9D58', name: 'Google Green' },
  { hex: '#1877F2', name: 'Meta Blue' },
  { hex: '#0078D4', name: 'Microsoft Blue' },
  { hex: '#86868B', name: 'Apple Gray' },
  { hex: '#FF9900', name: 'Amazon Orange' },
  { hex: '#1DB954', name: 'Spotify Green' },
  { hex: '#E50914', name: 'Netflix Red' },
  { hex: '#1DA1F2', name: 'Twitter Blue' },
  { hex: '#0A66C2', name: 'LinkedIn Blue' },
  { hex: '#007BFF', name: 'Primary Blue' },
  { hex: '#28A745', name: 'Success Green' },
  { hex: '#DC3545', name: 'Danger Red' },
  { hex: '#FFC107', name: 'Warning Yellow' },
  { hex: '#181717', name: 'GitHub Black' },
  { hex: '#4A154B', name: 'Slack Purple' },
  { hex: '#00457C', name: 'PayPal Blue' },
  { hex: '#000000', name: 'Uber Black' }
];

let container;
let highestZIndex = 0;

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function getTextColorForBackground(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 150 ? 'dark-text' : 'light-text';
}

function createRipple(event, swatch) {
  const ripple = document.createElement("span");
  ripple.classList.add("ripple");
  const rect = swatch.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
  swatch.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

function generateRandomSwatches() {
  if (!container) return;
  container.innerHTML = '';
  const shuffled = [...masterColorsList].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 18);
  highestZIndex = selected.length;
  const { clientWidth: w, clientHeight: h } = container;
  const size = Math.min(w, h) * 0.2;
  const pad = size * 0.2;

  selected.forEach((color, index) => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color.hex;
    const info = document.createElement('div');
    info.className = 'color-info';
    info.innerHTML = `${color.name}<br>${color.hex}`;
    swatch.appendChild(info);
    swatch.style.width = swatch.style.height = `${size}px`;

    const x = pad + Math.random() * (w - size - pad * 2);
    const y = pad + Math.random() * (h - size - pad * 2);
    const rot = (Math.random() - 0.5) * 40;
    const resting = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;
    swatch._restingTransform = resting;

    const initX = Math.random() * w;
    const initRot = (Math.random() - 0.5) * 90;
    swatch.style.transform = `translate3d(${initX}px, -200px, 0) rotate(${initRot}deg)`;
    swatch._restingZIndex = index;
    swatch.style.zIndex = index;

    swatch.addEventListener('mouseenter', () => {
      swatch.style.transition = 'transform 0.25s ease-out';
      swatch.style.transform = resting + ' scale(1.1)';
      swatch.style.zIndex = 999;
    });

    swatch.addEventListener('mouseleave', () => {
      swatch.style.transition = 'transform 0.25s ease-out';
      swatch.style.transform = resting;
      swatch.style.zIndex = swatch._restingZIndex;
    });

    swatch.addEventListener('click', (e) => {
      document.querySelectorAll('.color-info.is-visible').forEach(el => el.classList.remove('is-visible'));
      highestZIndex++;
      swatch._restingZIndex = highestZIndex;
      swatch.style.zIndex = highestZIndex;
      const textColorClass = getTextColorForBackground(color.hex);
      info.classList.remove('text-dark');
      if (textColorClass === 'dark-text') info.classList.add('text-dark');
      info.classList.add('is-visible');
      navigator.clipboard?.writeText(color.hex);
      createRipple(e, swatch);
    });

    container.appendChild(swatch);
    setTimeout(() => {
      swatch.style.transition = 'transform 1.2s cubic-bezier(0.2, 1, 0.3, 1), opacity 0.8s ease-in';
      swatch.style.transform = resting;
      swatch.classList.add('is-settled');
    }, 50);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  container = document.getElementById('paletteContainer');
  if (container) {
    generateRandomSwatches();
    window.addEventListener('resize', debounce(generateRandomSwatches, 250));
    container.addEventListener('mousemove', e => {
      const swatches = container.querySelectorAll('.color-swatch::before');
      container.querySelectorAll('.color-swatch').forEach(el => {
        el.style.setProperty('--x', e.clientX);
        el.style.setProperty('--y', e.clientY);
      });
    });
  }
});
