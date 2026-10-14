import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PaletteApp } from '../src/app/PaletteApp.js';
import { CONFIG } from '../src/config/constants.js';

// Stub drawing only; exercise the real palette selection and resize lifecycle.
class Palette extends PaletteApp {
  createSwatchElement(color) { return { color }; }
  animateIn() {}
}

test('opening selects a new palette; resizing preserves it without persistence', t => {
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
  app.onPaletteUpdate(update => updates.push(update));
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
