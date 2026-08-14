import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..', 'skills');
const read = (name) => fs.readFileSync(path.join(root, name, 'SKILL.md'), 'utf8');

test('Feature 从 Spec Clear 进入 red green、审查和上下文同步', () => {
  const text = read('k-feat');
  for (const part of ['Spec Clear', '`red`', '`green`', '双轴审查', '上下文同步']) assert.ok(text.includes(part));
});

test('Issue 诊断与获得授权的修复保持分离', () => {
  assert.match(read('k-issue'), /诊断请求不等于修复授权/);
});

test('Roadmap 子 Feature 使用父级 Work 且不生成重复独立 Feature', () => {
  assert.match(read('k-roadmap'), /不再创建平行的独立 `feat-\*` Work/);
  assert.match(read('k-feat'), /不创建独立 Feature Work/);
});

test('完成后的 Work 状态从不自动删除', () => {
  for (const name of ['k-feat', 'k-issue', 'k-refactor', 'k-roadmap', 'k-research', 'k-prototype']) assert.match(read(name), /由用户决定/);
});

test('实施主人点名 grilling 与 implement', () => {
  for (const name of ['k-feat', 'k-issue', 'k-refactor', 'k-roadmap']) {
    assert.match(read(name), /k-grilling/);
    assert.match(read(name), /k-implement/);
  }
});
