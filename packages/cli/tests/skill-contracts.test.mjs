import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repo = path.resolve(import.meta.dirname, '../../..');
const skillsRoot = path.join(repo, 'skills');
const expected = ['k-feat', 'k-flow', 'k-issue', 'k-knowledge', 'k-onboard', 'k-refactor', 'k-review', 'k-roadmap'];

function skill(name) {
  return fs.readFileSync(path.join(skillsRoot, name, 'SKILL.md'), 'utf8');
}

function requires(text, patterns) {
  for (const pattern of patterns) assert.match(text, pattern);
}

test('the shipped topology contains exactly eight independent skills', () => {
  assert.deepEqual(fs.readdirSync(skillsRoot).sort(), expected);
  for (const name of expected) {
    assert.ok(fs.existsSync(path.join(skillsRoot, name, 'SKILL.md')));
    assert.ok(skill(name).split('\n').length <= 300, `${name} exceeds the 300-line contract`);
  }
});

test('k-flow routes one owner without weakening authorization', () => {
  requires(skill('k-flow'), [
    /执行、先讨论、咨询还是了解体系/,
    /一次只转一个入口/,
    /转入不扩大授权/,
    /内存 packet/,
  ]);
});

test('k-feat preserves target-red-to-green and risk-proportional safeguards', () => {
  const text = skill('k-feat');
  requires(text, [
    /目标行为 `red → green`/,
    /先把验收场景写进正常测试目录/,
    /red 与 green 必须使用同一命令/,
    /原型是降低不确定性的手段，不是独立任务入口/,
    /决策问题、待验证假设、最低实现、观察项、/,
    /原型通过只证明假设或帮助 owner 选择，不等于功能完成/,
    /无法自动化时.*与用户确认/,
    /tracer bullet/,
    /执行流程 = 最小闭环 \+ 每个未排除风险所要求的最少保障/,
    /破坏兼容性或改变多消费者依赖的公开契约/,
    /改变权限、安全、隐私或其他信任边界/,
    /改变持久化数据、schema 或迁移路径/,
    /改变并发、顺序或一致性语义/,
    /不可恢复的代码外副作用/,
    /审查前冻结一个明确目标/,
    /blocking 清零/,
    /累计最多 3 个有终态报告的轮次/,
    /跨会话、多人交接或用户要求留痕/,
    /retired.*不应用/,
    /kflow cursor create k-feat feat-/,
    /kflow cursor show.*--skill k-feat/,
    /kflow cursor validate.*--skill k-feat/,
  ]);
});

test('k-issue separates diagnosis authorization and proves the same symptom red to green', () => {
  requires(skill('k-issue'), [
    /诊断结论不扩大为修复授权/,
    /已证实根因.*可证伪假设.*证据不足/s,
    /没有失败信号时不猜根因、不改代码/,
    /修复后观察 green/,
    /同一修复路径失败两次.*重新审视根因假设/,
    /故障症状 `red → green`/,
    /\[DEBUG-\.\.\.\]/,
    /没有产品 diff 时直接结束，不启动 change review/,
    /retired.*不应用/,
    /kflow cursor create k-issue issue-/,
    /kflow cursor show.*--skill k-issue/,
    /kflow cursor validate.*--skill k-issue/,
  ]);
});

test('k-refactor establishes and preserves green-to-green equivalence', () => {
  requires(skill('k-refactor'), [
    /green → green/,
    /characterization test/,
    /每步运行最窄等价信号并保持 green/,
    /类型检查、\s*lint 和快照不能单独证明运行时等价/,
    /性能回退或性能敏感路径变化.*profile、基线或前后对比/,
    /重要接口可以做多个最小纸面或 throwaway 设计/,
    /没有就先补验证或与用户确认等价判据/,
    /近期变更热点限定一个有界范围/,
    /删除测试/,
    /局部性.*杠杆.*测试收益/,
    /Strong \| Worth exploring \| Speculative/,
    /不默认打开预览/,
    /retired.*不应用/,
    /kflow cursor create k-refactor refactor-/,
    /kflow cursor show.*--skill k-refactor/,
    /kflow cursor validate.*--skill k-refactor/,
  ]);
});

test('k-roadmap owns route discovery, execution strategy, review stages, and acceptance', () => {
  const text = skill('k-roadmap');
  requires(text, [
    /稳定上下文和活动状态不得混写/,
    /AFK/,
    /HITL/,
    /route clear/,
    /每个执行子项必须/,
    /item_progression: continuous \| per-item \| parallel/,
    /item_progression: continuous.*自动选择/s,
    /design review、change review、contract review 与 Roadmap final acceptance 是不同阶段/,
    /fresh reviewer/,
    /owner 最终接受/,
    /每个执行子项必须.*继承其可执行反馈闭环/s,
    /原型只用于解决会改变路线的具体决策，不是新的 Roadmap 子项类型/,
    /永久 Roadmap 文档不得删除/,
  ]);
  requires(text, [
    /\.kflow\/roadmaps\/\{slug\}\.md/,
    /\.kflow\/cursors\/roadmap-\{slug\}\.md/,
    /roadmap: \.\.\/roadmaps\/\{slug\}\.md/,
    /frontmatter 标 `roadmap: \{roadmap-slug\}`/,
    /kflow cursor create k-roadmap roadmap-/,
    /kflow cursor show.*--skill k-roadmap/,
    /kflow cursor validate.*--skill k-roadmap/,
    /kflow document (search|validate).*--skill k-roadmap/,
  ]);
});

test('k-review remains a read-only terminal leaf with actionable findings', () => {
  requires(skill('k-review'), [
    /叶子执行器.*禁止创建、委派或唤醒任何子 agent/s,
    /只读.*不修代码、不写业务文件/s,
    /blocking/,
    /important/,
    /nit/,
    /文件:行号/,
    /NeedsContext/,
    /`resolved` \/ `unresolved` \/ `new findings`/,
    /blocking 未解决不得给出“通过”结论/,
  ]);
});

test('k-knowledge enforces explicit write authorization and a governed lesson lifecycle', () => {
  requires(skill('k-knowledge'), [
    /就是本次精确内容的写入授权/,
    /机械 guard 优先/,
    /attention\.md.*≤25 条/,
    /observed/,
    /validated/,
    /retired/,
    /不能把创建该 lesson 的同一任务自证为 validated/,
    /命中同域 lesson 时查重/,
  ]);
});

test('k-onboard creates minimal state without mutating legacy knowledge', () => {
  requires(skill('k-onboard'), [
    /attention\.md/,
    /lessons\//,
    /cursors\//,
    /不覆盖已有内容/,
    /不复制 Skill 包内文件到项目/,
    /\.gitignore/,
    /cli-invocations\.jsonl.*不由 onboard 预建/,
  ]);
});
