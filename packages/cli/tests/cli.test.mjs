import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import test from 'node:test';

const repo = path.resolve(import.meta.dirname, '../../..');
const cli = path.join(repo, 'dist/kflow.mjs');
const currentSkills = ['k-flow', 'k-onboard', 'k-feat', 'k-issue', 'k-refactor', 'k-roadmap', 'k-review', 'k-knowledge'];
const legacyRoots = ['requirements', 'architecture', 'roadmap', 'features', 'issues', 'refactors', 'compound', 'reference'];
const agentToolIds = ['amazon-q', 'antigravity', 'auggie', 'bob', 'codex', 'claude', 'cline', 'codeartsagent', 'forgecode', 'codebuddy', 'continue', 'costrict', 'crush', 'cursor', 'factory', 'gemini', 'github-copilot', 'hermes', 'iflow', 'junie', 'kilocode', 'kimi', 'kiro', 'lingma', 'vibe', 'oh-my-pi', 'opencode', 'pi', 'qoder', 'qwen', 'roocode', 'trae', 'windsurf', 'zcode', 'workbuddy'];

function tempProject() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'kflow-cli-'));
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

test('init creates only the minimal project state and installs eight skills', () => {
  const cwd = tempProject(); const first = run(cwd, ['init', '--tools', 'codex,claude']);
  assert.equal(first.ok, true);
  assert.ok(fs.existsSync(path.join(cwd, '.kflow/attention.md')));
  assert.ok(fs.existsSync(path.join(cwd, '.kflow/cursors/.gitkeep')));
  assert.ok(fs.existsSync(path.join(cwd, '.kflow/lessons/.gitkeep')));
  for (const root of legacyRoots) assert.equal(fs.existsSync(path.join(cwd, '.kflow', root)), false);
  for (const name of currentSkills) {
    assert.ok(fs.existsSync(path.join(cwd, '.agents/skills', name, 'SKILL.md')));
    assert.equal(fs.lstatSync(path.join(cwd, '.codex/skills', name)).isSymbolicLink(), true);
    assert.equal(fs.lstatSync(path.join(cwd, '.claude/skills', name)).isSymbolicLink(), true);
  }
  assert.deepEqual(fs.readdirSync(path.join(cwd, '.agents/skills')).sort(), [...currentSkills].sort());
  assert.equal(run(cwd, ['doctor']).ok, true);
  assert.equal(run(cwd, ['init', '--tools', 'codex,claude']).ok, true);
});

test('init --tools all supports the complete Agent platform matrix', () => {
  const cwd = tempProject();
  const initialized = run(cwd, ['init', '--tools', 'all']);
  assert.deepEqual(initialized.tools, agentToolIds);
  assert.ok(fs.existsSync(path.join(cwd, '.amazonq/skills/k-flow/SKILL.md')));
  assert.ok(fs.existsSync(path.join(cwd, '.github/skills/k-flow/SKILL.md')));
  assert.ok(fs.existsSync(path.join(cwd, '.windsurf/skills/k-flow/SKILL.md')));
  assert.ok(fs.existsSync(path.join(cwd, '.workbuddy/skills/k-flow/SKILL.md')));
});

test('non-interactive init without detected or selected Agents fails before creating project state', () => {
  const cwd = tempProject();
  const initialized = spawnSync(process.execPath, [cli, 'init', '--json'], { cwd, encoding: 'utf8' });
  assert.equal(initialized.status, 1);
  assert.match(initialized.stderr, /No Agent tools were detected/);
  assert.match(initialized.stderr, /--tools all.*--tools none.*--yes/s);
  assert.equal(fs.existsSync(path.join(cwd, '.agents')), false);
  assert.equal(fs.existsSync(path.join(cwd, '.kflow')), false);
});

test('init --yes installs every detected Agent without prompting', () => {
  const cwd = tempProject();
  fs.mkdirSync(path.join(cwd, '.codex'));
  fs.writeFileSync(path.join(cwd, 'CLAUDE.md'), '# Claude\n');
  const initialized = run(cwd, ['init', '--yes']);
  assert.deepEqual(initialized.tools, ['codex', 'claude']);
});

test('CLI executes when launched through a global-style symlink', () => {
  const cwd = tempProject();
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kflow-bin-'));
  const linkedCli = path.join(binDir, 'kflow');
  fs.symlinkSync(cli, linkedCli);
  const initialized = spawnSync(linkedCli, ['init', '--tools', 'none', '--json'], { cwd, encoding: 'utf8' });
  assert.equal(initialized.status, 0, initialized.stderr || initialized.stdout);
  assert.equal(JSON.parse(initialized.stdout).ok, true);
  assert.ok(fs.existsSync(path.join(cwd, '.agents/skills/k-flow/SKILL.md')));
});

test('doctor reports old state as legacy without failing or rewriting it', () => {
  const cwd = tempProject(); run(cwd, ['init', '--tools', 'none']);
  const oldCursorRoot = path.join(cwd, '.kflow/work'); fs.mkdirSync(oldCursorRoot);
  fs.writeFileSync(path.join(oldCursorRoot, 'old.md'), 'historical cursor\n');
  const legacy = path.join(cwd, '.kflow/features/old'); fs.mkdirSync(legacy, { recursive: true });
  fs.writeFileSync(path.join(legacy, 'old-work.md'), 'historical content\n');
  const diagnosis = run(cwd, ['doctor']);
  assert.equal(diagnosis.ok, true);
  assert.deepEqual(diagnosis.legacy, ['.kflow/work/', '.kflow/features/']);
  assert.equal(fs.readFileSync(path.join(oldCursorRoot, 'old.md'), 'utf8'), 'historical cursor\n');
  assert.equal(fs.readFileSync(path.join(legacy, 'old-work.md'), 'utf8'), 'historical content\n');
});

test('optional cursor captures only recovery state and validates', () => {
  const cwd = tempProject(); run(cwd, ['init', '--tools', 'none']);
  assert.equal(run(cwd, ['status']).counts.active, 0);
  const created = run(cwd, ['cursor', 'create', 'k-feat', 'export-csv', '--summary', '导出 CSV']);
  const file = path.join(cwd, created.path); const text = fs.readFileSync(file, 'utf8');
  assert.match(text, /owner: k-feat/);
  assert.match(text, /status: active/);
  assert.match(text, /git_head: [a-f0-9]{40}/);
  assert.match(text, /dirty_paths:/);
  assert.match(text, /## 验证信号/);
  assert.doesNotMatch(text, /stage:|review:|feedback_loop:|## Trace|## Fact Sync/);
  const completed = text
    .replace('## 目标\n', '## 目标\n导出选择记录。\n')
    .replace('## 范围与非目标\n', '## 范围与非目标\n仅 CSV，不含格式。\n')
    .replace('## 当前状态\n', '## 当前状态\n准备建立 red。\n')
    .replace('## 下一步\n', '## 下一步\n添加失败测试。\n')
    .replace('## 验证信号\n', '## 验证信号\nnpm test -- export-csv。\n')
    .replace('## 关键决策与证据\n', '## 关键决策与证据\n使用现有导出 seam。\n');
  fs.writeFileSync(file, completed);
  assert.equal(run(cwd, ['cursor', 'validate', created.path]).ok, true);
  assert.equal(run(cwd, ['status']).counts.active, 1);
  const shown = run(cwd, ['cursor', 'show', 'export-csv']);
  assert.equal(shown.owner, 'k-feat');
  assert.equal(shown.status, 'active');
  assert.equal(shown.next, '添加失败测试。');
  assert.equal(shown.signal, 'npm test -- export-csv。');
  assert.deepEqual(shown.blockedBy, null);
});

test('Skill-originated CLI calls append a redacted invocation record', () => {
  const cwd = tempProject(); run(cwd, ['init', '--tools', 'none']);
  const log = path.join(cwd, '.kflow/cli-invocations.jsonl');
  assert.equal(fs.existsSync(log), false);
  const created = run(cwd, ['cursor', 'create', 'k-feat', 'audit-export', '--summary', 'sensitive summary', '--skill', 'k-feat']);
  assert.equal(created.ok, true);
  const records = fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(records.length, 1);
  assert.equal(records[0].skill, 'k-feat');
  assert.equal(records[0].command, 'cursor create');
  assert.equal(records[0].ok, true);
  assert.equal(records[0].target, '.kflow/cursors/audit-export.md');
  assert.match(records[0].at, /^\d{4}-\d{2}-\d{2}T/);
  assert.doesNotMatch(JSON.stringify(records[0]), /sensitive summary/);
  assert.equal(fs.statSync(log).mode & 0o777, 0o600);
});

test('Skill invocation records are bounded to the latest 200 entries', () => {
  const cwd = tempProject(); run(cwd, ['init', '--tools', 'none']);
  for (let index = 0; index < 205; index += 1) run(cwd, ['status', '--skill', 'k-flow']);
  const records = fs.readFileSync(path.join(cwd, '.kflow/cli-invocations.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(records.length, 200);
  assert.ok(records.every((record) => record.skill === 'k-flow' && record.command === 'status'));
});

test('invalid Skill attribution fails without executing or writing a record', () => {
  const cwd = tempProject(); run(cwd, ['init', '--tools', 'none']);
  const result = spawnSync(process.execPath, [cli, 'status', '--skill', 'not-a-skill', '--json'], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid --skill/);
  assert.equal(fs.existsSync(path.join(cwd, '.kflow/cli-invocations.jsonl')), false);
});

test('init installs referenced Skill assets and doctor reports missing assets', () => {
  const cwd = tempProject(); run(cwd, ['init', '--tools', 'none']);
  const debug = path.join(cwd, '.agents/skills/k-issue/references/debug.md');
  const wayfinding = path.join(cwd, '.agents/skills/k-roadmap/references/wayfinding.md');
  assert.ok(fs.existsSync(debug));
  assert.ok(fs.existsSync(wayfinding));
  fs.rmSync(debug);
  const diagnosis = run(cwd, ['doctor'], 1);
  assert.deepEqual(diagnosis.issues, [{ code: 'missing-skill-asset', path: '.agents/skills/k-issue/references/debug.md' }]);
  assert.equal(run(cwd, ['init', '--tools', 'none', '--force']).ok, true);
  assert.ok(fs.existsSync(debug));
});

test('cursor rejects invalid owners and incomplete recovery contracts', () => {
  const cwd = tempProject(); run(cwd, ['init', '--tools', 'none']);
  const invalidOwner = spawnSync(process.execPath, [cli, 'cursor', 'create', 'k-guide', 'docs', '--json'], { cwd, encoding: 'utf8' });
  assert.equal(invalidOwner.status, 1); assert.match(invalidOwner.stderr, /Invalid owner/);
  const created = run(cwd, ['cursor', 'create', 'k-issue', 'cache-regression']);
  const file = path.join(cwd, created.path);
  let text = fs.readFileSync(file, 'utf8');
  let validation = run(cwd, ['cursor', 'validate', created.path], 1);
  assert.match(validation.errors.join('\n'), /empty section: 目标/);
  text = text
    .replace('## 目标\n', '## 目标\n复现缓存回归。\n')
    .replace('## 范围与非目标\n', '## 范围与非目标\n只诊断缓存模块。\n')
    .replace('## 当前状态\n', '## 当前状态\n等待复现。\n')
    .replace('## 下一步\n', '## 下一步\n运行复现命令。\n')
    .replace('## 验证信号\n', '## 验证信号\nnpm test -- cache。\n')
    .replace('## 关键决策与证据\n', '## 关键决策与证据\n尚无。\n')
    .replace('status: active', 'status: blocked');
  fs.writeFileSync(file, text);
  validation = run(cwd, ['cursor', 'validate', created.path], 1);
  assert.match(validation.errors.join('\n'), /blocked cursor requires a non-empty 阻塞 section/);
  fs.writeFileSync(file, text.replace('## 阻塞\n', '## 阻塞\n缺少测试服务；服务恢复后重试。\n'));
  assert.equal(run(cwd, ['cursor', 'validate', created.path]).ok, true);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('## 下一步', '## Removed'));
  validation = run(cwd, ['cursor', 'validate', created.path], 1);
  assert.match(validation.errors.join('\n'), /missing section: 下一步/);
});

test('document search and validation remain path-neutral utilities', () => {
  const cwd = tempProject(); run(cwd, ['init', '--tools', 'none']);
  const docs = path.join(cwd, 'docs'); fs.mkdirSync(docs);
  fs.writeFileSync(path.join(docs, 'decision.md'), `---\ndoc_type: decision\nstatus: current\ntags: [workflow]\n---\n\nUse project-owned docs.\n`);
  const found = run(cwd, ['document', 'search', '--dir', 'docs', '--filter', 'doc_type=decision', '--query', 'project-owned']);
  assert.equal(found.count, 1);
  assert.equal(run(cwd, ['document', 'validate', '--file', 'docs/decision.md', '--require', 'doc_type']).ok, true);
});
