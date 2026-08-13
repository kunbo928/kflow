import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import test from 'node:test';

const repo = path.resolve(import.meta.dirname, '../../..');
const cli = path.join(repo, 'dist/kflow.mjs');
const run = (cwd, args, expected = 0) => {
  const result = spawnSync(process.execPath, [cli, ...args, '--json'], { cwd, encoding: 'utf8' });
  assert.equal(result.status, expected, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
};

test('v3 黑盒链路：init 到 Roadmap accepted', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'kflow-v3-acceptance-'));
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd });
  fs.writeFileSync(path.join(cwd, 'package.json'), '{"scripts":{"test":"node --test"}}\n');
  execFileSync('git', ['add', 'package.json'], { cwd }); execFileSync('git', ['commit', '-qm', 'init'], { cwd });

  assert.equal(run(cwd, ['init', '--tools', 'none']).ok, true);
  assert.equal(run(cwd, ['map', 'validate']).ok, true);
  const created = run(cwd, ['work', 'create', 'roadmap', 'checkout']);
  const root = path.join(cwd, created.path);
  const feat = path.join(root, 'feats/01-checkout.md');
  fs.writeFileSync(feat, `---\nid: FEAT-01\nstatus: accepted\ndepends_on: []\n---\n\n# 下单\n\n## 目标行为\n用户可以完成下单。\n\n## 范围与非目标\n只覆盖单商品。\n\n## 验收场景\n提交后返回订单号。\n\n## 测试契约\nnode --test。\n\n## 关键决策\n复用现有订单入口。\n\n## 交付结果\n\n### 实现\n下单能力已实现。\n\n### 验证\n目标测试通过。\n\n### 审查\n双轴通过。\n\n### 上下文同步\n无需更新。\n`);
  for (const name of ['spec.md', 'work.md']) {
    const file = path.join(root, name);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('status: proposed', 'status: accepted'));
  }
  const spec = path.join(root, 'spec.md');
  fs.writeFileSync(spec, fs.readFileSync(spec, 'utf8')
    .replace('## Feature 索引\n', '## Feature 索引\n- FEAT-01 · 下单（accepted）\n')
    .replace('### 实现\n', '### 实现\n下单能力已交付。\n')
    .replace('### 验证\n', '### 验证\n整体验收通过。\n')
    .replace('### 审查\n', '### 审查\n双轴通过。\n')
    .replace('### 上下文同步\n', '### 上下文同步\n无需更新。\n'));
  const work = path.join(root, 'work.md');
  fs.writeFileSync(work, fs.readFileSync(work, 'utf8')
    .replace('## 当前状态\n', '## 当前状态\n全部 Feature 已完成。\n')
    .replace('## 下一步\n', '## 下一步\n由用户决定是否保留本文件。\n')
    .replace('## 验证证据\n', '## 验证证据\n目标行为 red → green，整体验收通过。\n')
    .replace('## 审查\n', '## 审查\nSpec 与 Standards 均通过。\n')
    .replace('## 上下文同步\n', '## 上下文同步\n项目地图无需更新。\n'));

  assert.equal(run(cwd, ['work', 'validate', created.path]).ok, true);
  const shown = run(cwd, ['work', 'show', 'roadmap-checkout']);
  assert.equal(shown.status, 'accepted');
  fs.rmSync(work);
  assert.equal(run(cwd, ['work', 'validate', created.path]).ok, true);
  assert.equal(run(cwd, ['work', 'show', 'roadmap-checkout']).graduated, true);
  assert.equal(run(cwd, ['status']).counts.accepted, 1);
  assert.equal(run(cwd, ['doctor']).ok, true);
});
