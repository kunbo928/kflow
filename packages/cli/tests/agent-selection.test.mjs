import assert from 'node:assert/strict';
import test from 'node:test';

import { filterChoices, initiallySelectedIds } from '../../../dist/kflow.mjs';

const choices = [
  { id: 'claude', name: 'Claude Code', detected: false },
  { id: 'codex', name: 'Codex', detected: true },
  { id: 'github-copilot', name: 'GitHub Copilot', detected: false },
];

test('interactive Agent selection preselects detected tools', () => {
  assert.deepEqual(initiallySelectedIds(choices), ['codex']);
});

test('interactive Agent selection filters by display name or tool ID', () => {
  assert.deepEqual(filterChoices(choices, 'copilot').map((choice) => choice.id), ['github-copilot']);
  assert.deepEqual(filterChoices(choices, 'CLAUDE').map((choice) => choice.id), ['claude']);
});
