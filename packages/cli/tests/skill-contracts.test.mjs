import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repo = path.resolve(import.meta.dirname, '../../..');
const root = path.join(repo, 'skills');
const expected = ['k-author', 'k-feat', 'k-flow', 'k-grilling', 'k-implement', 'k-issue', 'k-knowledge', 'k-onboard', 'k-prototype', 'k-reconcile', 'k-refactor', 'k-research', 'k-review', 'k-roadmap'];
const read = (name) => fs.readFileSync(path.join(root, name, 'SKILL.md'), 'utf8');
const requires = (text, patterns) => patterns.forEach((pattern) => assert.match(text, pattern));
const walkMd = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMd(next));
    else if (entry.name.endsWith('.md')) out.push(next);
  }
  return out;
};

test('发布拓扑包含且仅包含产品 Skill', () => {
  assert.deepEqual(fs.readdirSync(root).sort(), expected);
  const plugin = JSON.parse(fs.readFileSync(path.join(repo, '.claude-plugin/plugin.json'), 'utf8'));
  assert.deepEqual(plugin.skills.map((entry) => entry.replace('./skills/', '')).sort(), expected);
  for (const file of walkMd(root)) {
    const text = fs.readFileSync(file, 'utf8');
    const rel = path.relative(root, file);
    assert.ok(text.split('\n').length <= 300, `${rel} 超过 300 行`);
    assert.doesNotMatch(text, /\.\.\/(?:k-|_shared)/, `${rel} 依赖 sibling Skill`);
  }
});

test('k-flow 加载项目上下文并路由全部负责人且不扩大授权', () => {
  const text = read('k-flow');
  requires(text, [/project-map\/index\.md/, /k-roadmap/, /k-research/, /k-prototype/, /k-implement/, /k-grilling/, /k-author/, /k-reconcile/, /不扩大实现/]);
  assert.doesNotMatch(text, /k-architecture/);
});

test('onboard 创建渐进式已核实地图和 AGENTS 契约', () => {
  const text = read('k-onboard');
  requires(text, [/有界扫描/, /未知/, /project-map\/index\.md/, /AGENTS\.md/, /kflow map validate/]);
  assert.doesNotMatch(text, /--skill/);
});

test('实施型 Skill 保持可执行反馈闭环和双轴审查', () => {
  for (const name of ['k-feat', 'k-issue', 'k-refactor', 'k-roadmap']) {
    requires(read(name), [/k-grilling/, /k-implement/]);
  }
  requires(read('k-feat'), [/Spec Clear/, /red/, /green/, /同一命令或探针/, /Spec 与 Standards 双轴审查/, /禁止自动删除/]);
  requires(read('k-issue'), [/诊断请求不等于修复授权/, /故障症状 `red`/, /同一信号观察 `green`/, /没有能变红的信号/, /Spec 与 Standards 双轴审查/, /references\/diagnose\.md/]);
  requires(read('k-refactor'), [/green/, /characterization test/, /小步改变结构/, /改变外部行为/, /双轴审查/]);
  assert.doesNotMatch(read('k-refactor'), /k-architecture/);
});

test('roadmap 是带编号 Feature 文件的渐进式共享地图', () => {
  requires(read('k-roadmap'), [/roadmap-\{slug\}/, /feats\/NN-readable-name\.md/, /depends_on/, /尚未明确/, /frontier/, /目标行为 red/, /由用户决定/]);
});

test('探索与上下文 Skill 保持授权边界', () => {
  requires(read('k-research'), [/一手证据/, /不授予实现/, /由用户决定/]);
  requires(read('k-prototype'), [/一个决策问题/, /不能静默晋升/, /由用户决定/]);
  const reconcile = read('k-reconcile');
  requires(reconcile, [/代码与正式 owner 优先/, /不能发明/, /map validate/]);
  assert.doesNotMatch(reconcile, /--skill/);
  assert.doesNotMatch(reconcile, /Architecture/);
});

test('review 是独立批准者且冻结 diff', () => {
  const text = read('k-review');
  requires(text, [/独立/, /base/, /head/, /review_passed/, /risk_accepted/, /存在未勾的 blocking 或 important/, /nit/, /Spec/, /Standards/, /work\.md/, /不创建 `review\.md`/]);
  assert.doesNotMatch(text, /不创建子 Agent/);
});

test('knowledge 写回 AGENTS 或 project-map', () => {
  const text = read('k-knowledge');
  requires(text, [/AGENTS\.md/, /project-map/, /k-author/]);
  assert.doesNotMatch(text, /\.kflow\/lessons\//);
  assert.doesNotMatch(text, /attention\.md/);
});

test('手法 references 在对应主人包内', () => {
  const exists = (skill, file) => assert.ok(fs.existsSync(path.join(root, skill, 'references', file)), `${skill}/references/${file}`);
  exists('k-implement', 'tdd.md');
  exists('k-review', 'two-axis.md');
  exists('k-grilling', 'domain.md');
  exists('k-issue', 'diagnose.md');
  exists('k-author', 'writing.md');
  requires(read('k-implement'), [/references\/tdd\.md/]);
  requires(read('k-grilling'), [/references\/domain\.md/]);
  requires(read('k-review'), [/references\/two-axis\.md/]);
  requires(read('k-author'), [/references\/writing\.md/]);
});
