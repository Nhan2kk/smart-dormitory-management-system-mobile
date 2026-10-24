/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function load(file) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    require: relative => load(path.resolve(path.dirname(file), `${relative}.ts`)),
  });
  return exports;
}
const { fromSupport } = load(path.join(__dirname, '../src/features/requests/requestModel.ts'));
const request = {
  id: 'YCBT-PORTAL', title: 'Leaking tap', description: 'Uploaded from Student Portal',
  issueType: 'plumbing', issueLocation: 'room', priority: 'medium', status: 'pending',
  building: 'A', room: '101', submittedAt: '2026-10-24T10:00:00+07:00',
  history: [], source: 'student_submitted',
};

test('mobile detail retains all portal evidence URLs rather than only a count', () => {
  const attachments = [
    { id: 'photo-1', kind: 'image', name: 'tap.jpg', url: 'https://example.test/tap.jpg' },
    { id: 'photo-2', kind: 'image', name: 'pipe.png', url: 'https://example.test/pipe.png' },
  ];
  const detail = fromSupport({ ...request, attachments });
  assert.equal(detail.attachments, attachments);
  assert.equal(detail.attachments[1].url, attachments[1].url);
});

test('requests without evidence still open normally', () => {
  assert.equal(fromSupport({ ...request, attachments: [] }).attachments.length, 0);
  assert.equal(fromSupport(request).attachments.length, 0);
});
