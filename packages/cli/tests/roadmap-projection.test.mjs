import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import test from 'node:test';

const repo = path.resolve(import.meta.dirname, '../../..');
const cli = path.join(repo, 'dist/kflow.mjs');

function tempProject() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'kflow-projection-'));
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd });
  fs.writeFileSync(path.join(cwd, 'README.md'), '# test\n');
  execFileSync('git', ['add', 'README.md'], { cwd });
  execFileSync('git', ['commit', '-qm', 'init'], { cwd });
  return cwd;
}
function run(cwd, args, expect = 0) {
  const result = spawnSync(process.execPath, [cli, ...args, '--json'], { cwd, encoding: 'utf8' });
  assert.equal(result.status, expect, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}
const featBody = (id, status, depends) => {
  const results = status === 'accepted' ? '### 实现\n完成。\n\n### 验证\n通过。\n\n### 审查\n通过。\n\n### 上下文同步\n无需。\n' : '### 实现\n\n### 验证\n\n### 审查\n\n### 上下文同步\n';
  return `---\nid: ${id}\nstatus: ${status}\ndepends_on: [${depends.join(', ')}]\n---\n\n# ${id}\n\n## 目标行为\n做事。\n\n## 范围与非目标\n仅此。\n\n## 验收场景\n通过。\n\n## 测试契约\n测试。\n\n## 关键决策\n无。\n\n## 交付结果\n\n${results}`;
};

function makeRoadmap(cwd, ids) {
  const created = run(cwd, ['work', 'create', 'roadmap', 'plan']);
  const root = path.join(cwd, created.path);
  const spec = path.join(root, 'spec.md');
  fs.writeFileSync(spec, fs.readFileSync(spec, 'utf8').replace('## Feature 索引\n', `## Feature 索引\n${ids.map((i) => `- ${i}`).join('\n')}\n`));
  return { root, path: created.path };
}

test('frontier/blocked/next 反映依赖就绪度', () => {
  const cwd = tempProject(); run(cwd, ['init', '--tools', 'none']);
  const { root, path: rel } = makeRoadmap(cwd, ['FEAT-01', 'FEAT-02', 'FEAT-03']);
  const feats = path.join(root, 'feats');
  fs.writeFileSync(path.join(feats, '01-a.md'), featBody('FEAT-01', 'accepted', []));
  fs.writeFileSync(path.join(feats, '02-b.md'), featBody('FEAT-02', 'proposed', ['FEAT-01']));
  fs.writeFileSync(path.join(feats, '03-c.md'), featBody('FEAT-03', 'proposed', ['FEAT-02']));
  const shown = run(cwd, ['work', 'show', rel]);
  assert.deepEqual(shown.frontier, ['FEAT-02']);
  assert.deepEqual(shown.blocked, [{ id: 'FEAT-03', missing: ['FEAT-02'] }]);
  assert.equal(shown.next, 'FEAT-02');
});

test('全部 accepted 时 frontier 空、next null', () => {
  const cwd = tempProject(); run(cwd, ['init', '--tools', 'none']);
  const { root, path: rel } = makeRoadmap(cwd, ['FEAT-01', 'FEAT-02']);
  const feats = path.join(root, 'feats');
  fs.writeFileSync(path.join(feats, '01-a.md'), featBody('FEAT-01', 'accepted', []));
  fs.writeFileSync(path.join(feats, '02-b.md'), featBody('FEAT-02', 'accepted', ['FEAT-01']));
  const shown = run(cwd, ['work', 'show', rel]);
  assert.deepEqual(shown.frontier, []);
  assert.deepEqual(shown.blocked, []);
  assert.equal(shown.next, null);
});

test('同层多个就绪时 next 取文件编号靠前者且稳定', () => {
  const cwd = tempProject(); run(cwd, ['init', '--tools', 'none']);
  const { root, path: rel } = makeRoadmap(cwd, ['FEAT-01', 'FEAT-02']);
  const feats = path.join(root, 'feats');
  fs.writeFileSync(path.join(feats, '01-a.md'), featBody('FEAT-01', 'proposed', []));
  fs.writeFileSync(path.join(feats, '02-b.md'), featBody('FEAT-02', 'proposed', []));
  const first = run(cwd, ['work', 'show', rel]);
  const second = run(cwd, ['work', 'show', rel]);
  assert.deepEqual(first.frontier, ['FEAT-01', 'FEAT-02']);
  assert.equal(first.next, 'FEAT-01');
  assert.deepEqual(first.frontier, second.frontier);
});

test('非 roadmap Work 不含投影字段', () => {
  const cwd = tempProject(); run(cwd, ['init', '--tools', 'none']);
  const created = run(cwd, ['work', 'create', 'feat', 'plain']);
  const shown = run(cwd, ['work', 'show', created.path]);
  assert.equal('frontier' in shown, false);
  assert.equal('blocked' in shown, false);
  assert.equal('next' in shown, false);
});

test('缺失依赖由校验层报错，投影层不崩溃', () => {
  const cwd = tempProject(); run(cwd, ['init', '--tools', 'none']);
  const { root, path: rel } = makeRoadmap(cwd, ['FEAT-01']);
  fs.writeFileSync(path.join(root, 'feats', '01-a.md'), featBody('FEAT-01', 'proposed', ['FEAT-99']));
  const shown = run(cwd, ['work', 'show', rel], 1);
  assert.equal(shown.ok, false);
  assert.ok(shown.diagnostics.some((d) => /不存在的依赖/.test(d.message)));
});
