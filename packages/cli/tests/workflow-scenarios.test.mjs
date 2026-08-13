import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..', 'skills');
const read = (name) => fs.readFileSync(path.join(root, name, 'SKILL.md'), 'utf8');

function ordered(text, parts) {
  let cursor = -1;
  for (const part of parts) {
    const next = text.indexOf(part, cursor + 1);
    assert.ok(next > cursor, `expected ordered scenario step: ${part}`);
    cursor = next;
  }
}

test('ordinary feature follows target red to green without persistent workflow state', () => {
  const text = read('k-feat');
  ordered(text, ['建立一个会因目标行为尚未', '实现按 tracer bullet', 'red 与 green 必须使用同一命令']);
  assert.match(text, /普通任务不生成 kflow 产物/);
});

test('feature prototype answers one decision and cannot bypass delivery evidence', () => {
  const text = read('k-feat');
  ordered(text, ['决策问题、待验证假设、最低实现、观察项、', '原型通过只证明假设或帮助 owner 选择', '把它当作未验证输入重新纳入 Feature']);
});

test('high-risk feature cannot complete when a mandatory reviewer is unavailable', () => {
  const text = read('k-feat');
  assert.match(text, /改变权限、安全、隐私或其他信任边界.*独立 review/);
});

test('issue diagnosis never silently becomes an authorized fix', () => {
  const text = read('k-issue');
  assert.match(text, /只诊断不改产品代码/);
  assert.match(text, /诊断结论不扩大为修复授权/);
  assert.match(text, /没有失败信号时不猜根因、不改代码/);
  assert.match(text, /没有产品 diff 时直接结束，不启动 change review/);
});

test('refactor stops or blocks instead of weakening equivalence safeguards', () => {
  const text = read('k-refactor');
  ordered(text, ['修改前在真实接缝运行现有权威测试', '每步运行最窄等价信号并保持 green', '覆盖受影响调用点和模块的回归']);
});

test('roadmap cannot cross design or final acceptance gates without independent review', () => {
  const text = read('k-roadmap');
  ordered(text, ['route clear 不是新的 owner gate', '全部子项完成后', 'final acceptance', 'owner 接受后']);
});

test('roadmap items inherit owning evidence loops and prototypes remain decisions', () => {
  const text = read('k-roadmap');
  assert.match(text, /k-feat.*red → green.*k-issue.*red → green.*k-refactor.*green → green/s);
  assert.match(text, /prototype 节点开始前必须写清决策\s*问题、假设、最低 artifact、观察项、退出条件与处置方式/);
  assert.match(text, /原型通过\s*不等于子项完成/);
});

test('review terminal states forbid false pass conclusions', () => {
  const text = read('k-review');
  assert.match(text, /NeedsContext/);
  assert.match(text, /blocking 未解决不得给出“通过”结论/);
});
