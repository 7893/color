const container = document.getElementById('paletteContainer');

// 示例配色：彩虹色
const colors = [
  '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF',
  '#843b62', '#f9ed69', '#9ad0ec', '#6a0572',
  '#355c7d', '#f67280', '#c06c84', '#6c5b7b'
];

colors.forEach((color, index) => {
  const block = document.createElement('div');
  block.classList.add('color-block');
  block.style.backgroundColor = color;

  // 添加延迟动画效果
  setTimeout(() => {
    block.classList.add('visible');
  }, index * 100);

  container.appendChild(block);
});
