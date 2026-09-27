import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
let submit;
mock.module('../src/services/api.js', { exports: { saveSnapshot: (...args) => submit(...args) } });
const { PaletteApp } = await import('../src/app/PaletteApp.js');
const create = () => Object.assign(Object.create(PaletteApp.prototype), {
  currentSnapshot: { colors: ['#112233'], positions: [], deviceType: 'desktop' },
  userId: 'test', snapshotSaved: false, pendingSave: null,
});

test('only an acknowledged request marks a snapshot saved; concurrent events share it', async () => {
  let finish, calls = 0;
  submit = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  const app = create();
  const first = app.saveSnapshot();
  const second = app.saveSnapshot();
  assert.equal(app.snapshotSaved, false);
  assert.equal(calls, 1);
  finish({ success: true });
  await Promise.all([first, second]);
  assert.equal(app.snapshotSaved, true);
});

test('a rejected save remains retryable', async () => {
  submit = async () => { throw Error('offline'); };
  const app = create();
  const log = mock.method(console, 'error', () => {});
  await app.saveSnapshot();
  assert.equal(app.snapshotSaved, false);
  submit = async () => ({ success: true });
  await app.saveSnapshot();
  assert.equal(app.snapshotSaved, true);
  log.mock.restore();
});

test('late acknowledgement cannot mark a resized snapshot saved', async () => {
  let finish;
  submit = () => new Promise(resolve => { finish = resolve; });
  const app = create();
  const pending = app.saveSnapshot();
  app.currentSnapshot = { ...app.currentSnapshot, positions: [{ x: 10, y: 20 }] };
  finish({ success: true });
  await pending;
  assert.equal(app.snapshotSaved, false);
});
