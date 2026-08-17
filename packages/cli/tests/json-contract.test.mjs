import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import test from 'node:test';

const repo = path.resolve(import.meta.dirname, '../../..');
const cli = path.join(repo, 'dist/kflow.mjs');
const SCHEMA_VERSION = 1;
const LEGACY_KEYS = ['errors', 'issues', 'invalid'];

function tempProject() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'kflow-contract-'));
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd });
  fs.writeFileSync(path.join(cwd, 'README.md'), '# test\n');
  execFileSync('git', ['add', 'README.md'], { cwd });
  execFileSync('git', ['commit', '-qm', 'init'], { cwd });
  return cwd;
}

function raw(cwd, args) {
  return spawnSync(process.execPath, [cli, ...args, '--json'], { cwd, encoding: 'utf8' });
}
function parse(cwd, args) {
  const result = raw(cwd, args);
  const parsed = JSON.parse(result.stdout);
  return { status: result.status, body: parsed };
}

function assertEnvelope(body) {
  assert.equal(body.schemaVersion, SCHEMA_VERSION, `缺少 schemaVersion: ${JSON.stringify(body)}`);
  assert.equal(typeof body.command, 'string');
  assert.equal(typeof body.ok, 'boolean');
  assert.ok(Array.isArray(body.diagnostics), '缺少 diagnostics[]');
  for (const diag of body.diagnostics) {
    assert.ok(['error', 'warning', 'info'].includes(diag.severity), `非法 severity: ${diag.severity}`);
    assert.match(diag.code, /^[a-z][a-z0-9_]*$/, `code 必须是 snake_case: ${diag.code}`);
    assert.equal(typeof diag.message, 'string');
  }
  for (const key of LEGACY_KEYS) assert.ok(!(key in body), `旧问题字段仍存在: ${key}`);
}

test('每个命令的 --json 输出单一文档且符合 envelope', () => {
  const cwd = tempProject();
  assertEnvelope(parse(cwd, ['init', '--tools', 'none']).body);
  assertEnvelope(parse(cwd, ['doctor']).body);
  assertEnvelope(parse(cwd, ['status']).body);
  assertEnvelope(parse(cwd, ['map', 'validate']).body);
  const created = parse(cwd, ['work', 'create', 'feat', 'demo']);
  assertEnvelope(created.body);
  assertEnvelope(parse(cwd, ['work', 'show', created.body.path]).body);
  assertEnvelope(parse(cwd, ['work', 'validate', created.body.path]).body);
  const docs = path.join(cwd, 'docs'); fs.mkdirSync(docs);
  fs.writeFileSync(path.join(docs, 'a.md'), '---\ndoc_type: x\n---\n\nbody\n');
  assertEnvelope(parse(cwd, ['document', 'search', '--dir', 'docs']).body);
  assertEnvelope(parse(cwd, ['document', 'validate', '--dir', 'docs']).body);
});

test('校验失败以 diagnostics + exit 1 表达，成功健康提醒 exit 0', () => {
  const cwd = tempProject();
  parse(cwd, ['init', '--tools', 'none']);
  const created = parse(cwd, ['work', 'create', 'feat', 'broken']);
  const work = path.join(cwd, created.body.path, 'work.md');
  fs.rmSync(work);
  fs.writeFileSync(path.join(cwd, created.body.path, 'spec.md'),
    fs.readFileSync(path.join(cwd, created.body.path, 'spec.md'), 'utf8').replace('status: proposed', 'status: active'));
  const failed = parse(cwd, ['work', 'validate', created.body.path]);
  assert.equal(failed.status, 1);
  assert.equal(failed.body.ok, false);
  assert.ok(failed.body.diagnostics.length > 0);
  assert.ok(failed.body.diagnostics.every((d) => typeof d.code === 'string' && d.code.length > 0 && typeof d.fix === 'string' && d.fix.length > 0));

  const clean = tempProject();
  parse(clean, ['init', '--tools', 'none']);
  fs.mkdirSync(path.join(clean, '.kflow/lessons'));
  const healthy = parse(clean, ['doctor']);
  assert.equal(healthy.status, 0);
  assert.equal(healthy.body.ok, true);
  assert.ok(healthy.body.diagnostics.some((d) => d.severity !== 'error'), '健康提醒应为非 error 诊断');
});

test('stdout 恰好一个 JSON 文档', () => {
  const cwd = tempProject();
  const result = raw(cwd, ['status']);
  const trimmed = result.stdout.trim();
  assert.doesNotThrow(() => JSON.parse(trimmed));
  assert.equal(trimmed.indexOf('}\n{'), -1, 'stdout 出现多个 JSON 文档');
});
