import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repo = path.resolve(import.meta.dirname, '../../..');
const root = path.join(repo, 'skills');
const expected = ['k-architecture', 'k-feat', 'k-flow', 'k-issue', 'k-knowledge', 'k-onboard', 'k-prototype', 'k-reconcile', 'k-refactor', 'k-research', 'k-review', 'k-roadmap'];
const read = (name) => fs.readFileSync(path.join(root, name, 'SKILL.md'), 'utf8');
const requires = (text, patterns) => patterns.forEach((pattern) => assert.match(text, pattern));

test('发布拓扑包含且仅包含十二个独立 Skill', () => {
  assert.deepEqual(fs.readdirSync(root).sort(), expected);
  for (const name of expected) {
    const text = read(name);
    assert.ok(text.split('\n').length <= 300, `${name} 超过 300 行`);
    assert.doesNotMatch(text, /\.\.\/(?:k-|_shared)/, `${name} 依赖 sibling Skill`);
  }
});

test('k-flow 加载项目上下文并路由全部负责人且不扩大授权', () => {
  requires(read('k-flow'), [/project-map\/index\.md/, /k-roadmap/, /k-research/, /k-prototype/, /k-architecture/, /k-reconcile/, /不扩大实现/]);
});

test('onboard 创建渐进式已核实地图和 AGENTS 契约', () => {
  requires(read('k-onboard'), [/有界扫描/, /未知/, /project-map\/index\.md/, /AGENTS\.md/, /kflow map validate/]);
});

test('实施型 Skill 保持可执行反馈闭环和双轴审查', () => {
  requires(read('k-feat'), [/Spec Clear/, /red/, /green/, /同一命令或探针/, /Spec 与 Standards 双轴审查/, /禁止自动删除/]);
  requires(read('k-issue'), [/诊断请求不等于修复授权/, /故障症状 `red`/, /同一信号观察 `green`/, /没有能变红的信号/, /Spec 与 Standards 双轴审查/]);
  requires(read('k-refactor'), [/green/, /characterization test/, /小步改变结构/, /改变外部行为/, /双轴审查/]);
});

test('roadmap 是带编号 Feature 文件的渐进式共享地图', () => {
  requires(read('k-roadmap'), [/roadmap-\{slug\}/, /feats\/NN-readable-name\.md/, /depends_on/, /尚未明确/, /frontier/, /目标行为 red/, /由用户决定/]);
});

test('探索与上下文 Skill 保持授权边界', () => {
  requires(read('k-research'), [/一手证据/, /不授予实现/, /由用户决定/]);
  requires(read('k-prototype'), [/一个决策问题/, /不能静默晋升/, /由用户决定/]);
  requires(read('k-architecture'), [/不授权代码改动/, /k-refactor/, /k-roadmap/]);
  requires(read('k-reconcile'), [/代码与正式 owner 优先/, /不能发明/, /map validate/]);
});

test('review 是只读双轴叶子且默认不持久化会话', () => {
  requires(read('k-review'), [/只读且为叶子执行器/, /Spec/, /Standards/, /blocking/, /work\.md/, /不创建 `review\.md`/]);
});
