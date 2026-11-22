import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PaletteApp } from '../src/app/PaletteApp.js';
import { CONFIG } from '../src/config/constants.js';
import { masterColorsList } from '../src/data/colors.js';
import {
  DARK_TEXT_HEX,
  LIGHT_TEXT_HEX,
  getContrastRatio,
  getRelativeLuminance,
  getTextColorClass,
} from '../src/utils/helpers.js';
import { TIME_WRAP_SECONDS, wrapShaderTime } from '../src/utils/gl.js';

// Stub drawing only; exercise the real palette selection and resize lifecycle.
class Palette extends PaletteApp {
  createSwatchElement(color) { return { color }; }
  animateIn() {}
}

function createMockClassList() {
  const classes = new Set();
  return {
    add(...items) { items.forEach((item) => classes.add(item)); },
    remove(...items) { items.forEach((item) => classes.delete(item)); },
    toggle(item, force) {
      if (force === undefined) {
        if (classes.has(item)) classes.delete(item);
        else classes.add(item);
        return classes.has(item);
      }
      if (force) classes.add(item);
      else classes.delete(item);
      return Boolean(force);
    },
    contains(item) { return classes.has(item); },
  };
}

function createMockElement(tagName) {
  const attributes = new Map();
  const listeners = new Map();
  const styleProps = new Map();
  const el = {
    tagName: tagName.toUpperCase(),
    type: '',
    id: '',
    className: '',
    textContent: '',
    value: '',
    children: [],
    parentNode: null,
    classList: createMockClassList(),
    style: {
      setProperty(name, value) { styleProps.set(name, value); },
      getPropertyValue(name) { return styleProps.get(name) ?? ''; },
    },
    setAttribute(name, value) { attributes.set(name, String(value)); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    appendChild(child) {
      child.parentNode = el;
      el.children.push(child);
      return child;
    },
    removeChild(child) {
      const idx = el.children.indexOf(child);
      if (idx >= 0) el.children.splice(idx, 1);
      child.parentNode = null;
      return child;
    },
    remove() {
      if (el.parentNode) el.parentNode.removeChild(el);
    },
    replaceChildren(...nodes) {
      el.children.forEach((child) => { child.parentNode = null; });
      el.children = [];
      nodes.forEach((node) => el.appendChild(node));
    },
    addEventListener(name, callback) {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(callback);
    },
    dispatchEvent(name, event = {}) {
      const handlers = listeners.get(name) || [];
      handlers.forEach((handler) => handler(event));
    },
    select() {},
    setSelectionRange() {},
  };
  return el;
}

function collectFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

test('opening selects a new palette; resizing preserves it without persistence', (t) => {
  const listeners = {};
  const container = { appendChild() {}, innerHTML: '' };
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  globalThis.window = {
    innerWidth: 1280, innerHeight: 800,
    addEventListener: (name, callback) => { listeners[name] = callback; },
  };
  globalThis.document = { getElementById: () => container };
  t.after(() => {
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
  });
  t.mock.method(globalThis, 'fetch', () => { throw Error('Unexpected network request'); });
  const random = t.mock.method(Math, 'random', () => 0);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const colors = Array.from({ length: 40 }, (_, i) => ({ hex: '#' + i.toString(16).padStart(6, '0') }));
  const app = new Palette('palette', CONFIG, colors);
  assert.equal(app.currentColors.length, 25);
  const initial = [...app.currentColors];
  const updates = [];
  app.onPaletteUpdate((update) => updates.push(update));
  assert.equal(updates.length, 1);

  // A burst of resize events should produce one layout update after 250ms.
  random.mock.mockImplementation(() => 0.99);
  window.innerWidth = 600;
  listeners.resize();
  t.mock.timers.tick(100);
  listeners.resize();
  t.mock.timers.tick(249);
  assert.equal(updates.length, 1);
  t.mock.timers.tick(1);
  assert.equal(updates.length, 2);
  assert.equal(app.currentColors.length, 12);
  assert.deepEqual(app.currentColors, initial.slice(0, 12));
  assert.deepEqual(updates[1].colors, initial.slice(0, 12));
  assert.equal(updates[1].layout.width, 600);

  // Resizing at the same breakpoint keeps the displayed colors.
  const mobile = [...app.currentColors];
  random.mock.mockImplementation(() => 0.25);
  window.innerWidth = 650;
  listeners.resize();
  t.mock.timers.tick(250);
  assert.equal(app.currentColors.length, 12);
  assert.deepEqual(app.currentColors, mobile);

  window.innerWidth = 900;
  listeners.resize();
  t.mock.timers.tick(250);
  assert.equal(app.currentColors.length, 16);
  assert.deepEqual(app.currentColors, initial.slice(0, 16));

  // Returning to desktop restores the entire original palette.
  window.innerWidth = 1280;
  listeners.resize();
  t.mock.timers.tick(250);
  assert.deepEqual(app.currentColors, initial);

  // A new page instance makes a fresh random selection.
  const reopened = new Palette('palette', CONFIG, colors);
  assert.equal(reopened.currentColors.length, 25);
  assert.notDeepEqual(reopened.currentColors, initial);
  assert.deepEqual(Object.keys(listeners), ['resize']);
});

test('WCAG 2.1 contrast selects optimal text color for all 55 brand colors', () => {
  assert.equal(masterColorsList.length, 55);
  assert.equal(getRelativeLuminance('#000000'), 0);
  assert.equal(getRelativeLuminance('#FFFFFF'), 1);
  assert.equal(getContrastRatio('#000000', '#FFFFFF'), 21);

  const expectedDarkFixed = [
    '#2ECC71',
    '#00BCD4',
    '#1ABC9C',
    '#1DB954',
    '#03A9F4',
    '#4CAF50',
    '#1DA1F2',
    '#4285F4',
    '#0F9D58',
    '#86868B',
    '#FF4500',
    '#F44336',
    '#2196F3',
    '#009688',
    '#FF5722',
    '#3498DB',
    '#7F8C8D',
  ];

  for (const hex of expectedDarkFixed) {
    assert.equal(getTextColorClass(hex), 'text-dark', `Expected text-dark for ${hex}`);
  }

  for (const { hex, name } of masterColorsList) {
    const chosen = getTextColorClass(hex);
    const lightRatio = getContrastRatio(hex, LIGHT_TEXT_HEX);
    const darkRatio = getContrastRatio(hex, DARK_TEXT_HEX);
    const expected = darkRatio > lightRatio ? 'text-dark' : 'text-light';
    const chosenRatio = chosen === 'text-dark' ? darkRatio : lightRatio;

    assert.equal(chosen, expected, `Wrong contrast choice for ${name} (${hex})`);
    assert.ok(
      chosenRatio >= 3.7,
      `Contrast ratio ${chosenRatio.toFixed(2)} too low for ${name} (${hex})`
    );
  }
});

test('Halton Cranley-Patterson layout stays within bounds and preserves 2D stratification', (t) => {
  const container = { appendChild() {}, replaceChildren() {} };
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  globalThis.window = {
    innerWidth: 1280,
    innerHeight: 800,
    addEventListener() {},
  };
  globalThis.document = { getElementById: () => container };
  t.after(() => {
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
  });

  const app = new Palette('palette', CONFIG, masterColorsList);

  for (const [width, height] of [[1280, 800], [900, 700], [375, 667]]) {
    window.innerWidth = width;
    window.innerHeight = height;

    for (const [offsetX, offsetY] of [[0.13, 0.71], [0.64, 0.29], [0.91, 0.04]]) {
      const layout = { ...app.calculateLayoutParameters(), offsetX, offsetY };
      const points = Array.from({ length: layout.swatchCount }, (_, i) =>
        app.computeTargetPosition(i, layout)
      );

      for (const p of points) {
        assert.ok(p.x >= 0, `x out of lower bound: ${p.x}`);
        assert.ok(p.y >= 0, `y out of lower bound: ${p.y}`);
        assert.ok(p.x + layout.size <= width + 1e-6, `x exceeds viewport: ${p.x} + ${layout.size} > ${width}`);
        assert.ok(p.y + layout.size <= height + 1e-6, `y exceeds viewport: ${p.y} + ${layout.size} > ${height}`);
      }

      if (layout.swatchCount === CONFIG.DESKTOP_COUNT) {
        const midX = (width - layout.size) / 2;
        const midY = (height - layout.size) / 2;
        const quadrants = [0, 0, 0, 0];
        for (const p of points) {
          const q = (p.x >= midX ? 1 : 0) + (p.y >= midY ? 2 : 0);
          quadrants[q]++;
        }
        for (const count of quadrants) {
          assert.ok(
            count >= 4,
            `Expected well-stratified Halton quadrants (>=4 each), got ${JSON.stringify(quadrants)}`
          );
        }
      }
    }
  }
});

test('swatches render accessible buttons, support focus/copy feedback, double-rAF, and reduced motion', async (t) => {
  const container = createMockElement('main');
  const toast = createMockElement('div');
  toast.id = 'copyToast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  const body = createMockElement('body');
  body.appendChild(container);
  body.appendChild(toast);

  const rafQueue = [];
  let reducedMotion = false;
  let clipboardBehavior = 'resolve';
  const copiedValues = [];

  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const oldRaf = globalThis.requestAnimationFrame;

  globalThis.window = {
    innerWidth: 1280,
    innerHeight: 800,
    addEventListener() {},
    matchMedia: () => ({ matches: reducedMotion }),
  };
  globalThis.document = {
    body,
    getElementById: (id) => (id === 'paletteContainer' ? container : id === 'copyToast' ? toast : null),
    createElement: createMockElement,
    execCommand: (cmd) => cmd === 'copy' && clipboardBehavior === 'fallback',
  };
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      clipboard: {
        writeText: async (text) => {
          if (clipboardBehavior === 'resolve') {
            copiedValues.push(text);
            return;
          }
          throw new Error('Clipboard denied');
        },
      },
    },
  });
  globalThis.requestAnimationFrame = (cb) => {
    rafQueue.push(cb);
    return rafQueue.length;
  };

  t.after(() => {
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
    if (oldNavigator) Object.defineProperty(globalThis, 'navigator', oldNavigator);
    else delete globalThis.navigator;
    if (oldRaf === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = oldRaf;
  });

  t.mock.timers.enable({ apis: ['setTimeout'] });

  const sampleColors = [
    { hex: '#2ECC71', name: 'Flat Green' },
    { hex: '#002147', name: 'Oxford Blue' },
  ];
  const app = new PaletteApp('paletteContainer', { ...CONFIG, DESKTOP_COUNT: 2 }, sampleColors);

  assert.equal(container.children.length, 2);
  const firstSwatch = container.children[0];
  assert.equal(firstSwatch.tagName, 'BUTTON');
  assert.equal(firstSwatch.type, 'button');
  assert.match(firstSwatch.getAttribute('aria-label'), /, click to copy$/);

  // Double-rAF: still hidden after first rAF, visible only after second rAF.
  assert.equal(firstSwatch.style.opacity, '0');
  const firstPass = rafQueue.splice(0);
  firstPass.forEach((fn) => fn());
  assert.equal(firstSwatch.style.opacity, '0');
  const secondPass = rafQueue.splice(0);
  secondPass.forEach((fn) => fn());
  assert.equal(firstSwatch.style.opacity, '1');

  // Focus raises z-index just like mouseenter.
  const zBefore = Number(firstSwatch.style.zIndex);
  firstSwatch.dispatchEvent('focus');
  assert.ok(Number(firstSwatch.style.zIndex) > zBefore);

  // Click copies via clipboard API and announces in live toast.
  firstSwatch.dispatchEvent('click', { stopPropagation() {} });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(copiedValues.length, 1);
  assert.equal(toast.textContent, `Copied ${copiedValues[0]}`);
  assert.equal(toast.classList.contains('is-visible'), true);
  assert.equal(toast.classList.contains('is-error'), false);

  // Fallback execCommand succeeds when Clipboard API rejects.
  clipboardBehavior = 'fallback';
  firstSwatch.dispatchEvent('click', { stopPropagation() {} });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(toast.textContent, `Copied ${copiedValues[0]}`);
  assert.equal(toast.classList.contains('is-error'), false);

  // Error feedback shown when both clipboard and fallback fail.
  clipboardBehavior = 'fail';
  firstSwatch.dispatchEvent('click', { stopPropagation() {} });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(toast.textContent, `Could not copy ${copiedValues[0]}`);
  assert.equal(toast.classList.contains('is-error'), true);

  // Reduced motion places swatches immediately without queuing rAF.
  reducedMotion = true;
  rafQueue.length = 0;
  app.generateSwatches();
  assert.equal(rafQueue.length, 0);
  assert.equal(container.children[0].style.opacity, '1');
});

test('WebGL time wrapping keeps u_time bounded for FP16 mobile shaders', () => {
  assert.equal(wrapShaderTime(0), 0);
  assert.ok(wrapShaderTime(10_000) > 9.99 && wrapShaderTime(10_000) < 10.01);

  // After 1000 hours, wrapped time remains safely in [0, TIME_WRAP_SECONDS) << 65504.
  const afterThousandHours = wrapShaderTime(1000 * 3600 * 1000);
  assert.ok(afterThousandHours >= 0 && afterThousandHours < TIME_WRAP_SECONDS);
  assert.ok(TIME_WRAP_SECONDS < 1000);

  const glSource = readFileSync(new URL('../src/utils/gl.js', import.meta.url), 'utf8');
  assert.match(glSource, /powerPreference:\s*'default'/);
  assert.doesNotMatch(glSource, /high-performance/);
});

test('markup and source contain zero inline styles, zero inline scripts, and zero innerHTML', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /maximum-scale/i);
  assert.doesNotMatch(html, /user-scalable/i);
  assert.doesNotMatch(html, /<style\b/i);
  assert.doesNotMatch(html, /\sstyle\s*=/i);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
  assert.match(html, /aria-live="polite"/);

  const srcDir = new URL('../src/', import.meta.url).pathname;
  for (const file of collectFiles(srcDir)) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /\.innerHTML\b/, `Found innerHTML in ${file}`);
    assert.doesNotMatch(source, /setAttribute\(\s*['"]style['"]/, `Found inline style attr in ${file}`);
  }

  const css = readFileSync(new URL('../src/styles/main.css', import.meta.url), 'utf8');
  assert.match(css, /\.color-info\.text-dark\s*\{[^}]*text-shadow:\s*none;/s);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(hover:\s*none\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});
