/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the actual room mapping code without bringing native modules into Node.
const helpers = {};
vm.runInNewContext(ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../src/features/registration/registrationHelpers.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText, { exports: helpers });

const room = (status = 'full') => ({
  id: 'room', status, capacity: 2, available: 0,
  beds: [{ id: 'old-resident', status: 'occupied' }, { id: 'other', status: 'reserved' }],
});
const from = { 'old-resident': '2027-02-01' };

test('an occupied bed becomes selectable for a future term without changing source occupancy', () => {
  const source = room();
  const mapped = helpers.withHolds(source, new Set(), null, from);
  assert.equal(mapped.status, 'available');
  assert.equal(mapped.available, 1);
  assert.equal(mapped.beds[0].status, 'available');
  assert.equal(mapped.beds[0].availableFrom, '2027-02-01');
  assert.equal(source.beds[0].status, 'occupied');
});

test('another student holding the future bed removes it from available places', () => {
  const mapped = helpers.withHolds(room(), new Set(['old-resident']), null, from);
  assert.equal(mapped.available, 0);
  assert.equal(mapped.beds[0].status, 'reserved');
  assert.equal(mapped.beds[0].availableFrom, undefined);
});

test('own future bed hold stays selectable for confirmation', () => {
  const mapped = helpers.withHolds(room(), new Set(['old-resident']), 'old-resident', from);
  assert.equal(mapped.available, 1);
  assert.equal(mapped.beds[0].availableFrom, '2027-02-01');
});

test('a maintenance room stays locked even with a future vacancy', () => {
  assert.equal(helpers.withHolds(room('maintenance'), new Set(), null, from).status, 'maintenance');
});

test('legacy availability does not expose occupied beds', () => {
  const mapped = helpers.withHolds(room(), new Set(), null);
  assert.equal(mapped.available, 0);
  assert.equal(mapped.beds[0].status, 'occupied');
});
