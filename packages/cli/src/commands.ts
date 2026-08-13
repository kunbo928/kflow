import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomicWrite, gitBaseline } from './filesystem.js';
import { findWorkDirs, readMarkdown, sectionValue, validateWork } from './harness.js';
import { stringifyYaml } from './yaml.js';
import type { CommandResult, WorkMeta, WorkType } from './types.js';
import { installSkills, selectTools, skillNames } from './agent-integrations.js';
import { workTypeSet } from './skill-manifest.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = ['works', 'lessons'];
const legacyRoots = ['cursors', 'work', 'requirements', 'architecture', 'roadmap', 'features', 'issues', 'refactors', 'compound', 'reference'];
const result = (command: string, changed: string[] = [], warnings: string[] = [], data: Record<string, unknown> = {}): CommandResult => ({ command, ok: true, changed, warnings, ...data });
const specHeadings: Record<WorkType, string[]> = {
  feat: ['目标行为', '范围与非目标', '验收场景', '测试契约', '关键决策', '交付结果'],
  issue: ['故障症状', '期望行为', '复现条件', '根因', '回归契约', '交付结果'],
  refactor: ['等价边界', '结构目标', '范围与非目标', '行为基线', '关键决策', '交付结果'],
  roadmap: ['目的地', '范围与非目标', '整体验收', '关键决策', '尚未明确', 'Feature 索引', '交付结果'],
  research: ['研究问题', '范围与证据标准', '结论', '来源', '适用边界', '交付结果'],
  prototype: ['决策问题', '待验证假设', '最低产物', '观察与结论', '生产差距', '交付结果'],
  architecture: ['设计问题', '现状证据', '候选方案与取舍', '最终选择', '迁移边界', '交付结果'],
};

function ensureAgentsContract(cwd: string, changed: string[]): void {
  const file = path.join(cwd, 'AGENTS.md');
  if (fs.existsSync(file)) return;
  atomicWrite(file, '# AGENTS\n\n非平凡任务先读 `.kflow/project-map/index.md`，再按其中与当前范围相关的指针渐进加载。\n');
  changed.push('AGENTS.md');
}

export function initProject(cwd: string, options: { tools?: string; copy?: boolean; force?: boolean } = {}): CommandResult {
  const base = path.join(cwd, '.kflow'); const changed: string[] = [];
  fs.mkdirSync(base, { recursive: true });
  for (const dir of roots) { const target = path.join(base, dir); fs.mkdirSync(target, { recursive: true }); const keep = path.join(target, '.gitkeep'); if (!fs.existsSync(keep)) { fs.writeFileSync(keep, ''); changed.push(path.relative(cwd, keep)); } }
  const attention = path.join(base, 'attention.md');
  if (!fs.existsSync(attention)) { atomicWrite(attention, '# Attention\n\n只保留几乎每次任务都必须知道的稳定事实，最多 25 条。\n'); changed.push('.kflow/attention.md'); }
  const mapRoot = path.join(base, 'project-map'); fs.mkdirSync(mapRoot, { recursive: true });
  const map = path.join(mapRoot, 'index.md');
  if (!fs.existsSync(map)) { atomicWrite(map, '# Project Map\n\n## 项目边界\n\n待 `k-onboard` 根据仓库事实补全。\n\n## 上下文路由\n\n- 开发入口：待核实\n- 架构与模块：待核实\n- 规范：`AGENTS.md`\n'); changed.push('.kflow/project-map/index.md'); }
  ensureAgentsContract(cwd, changed);
  const tools = selectTools(cwd, options.tools); changed.push(...installSkills(packageRoot, cwd, tools, { copy: options.copy, force: options.force }));
  const diagnosis = doctor(cwd); if (!diagnosis.ok) return { command: 'init', ok: false, changed, diagnosis };
  return result('init', changed, diagnosis.legacy as string[], { projectRoot: cwd, tools: tools.map((tool) => tool.id), skillsRoot: '.agents/skills' });
}

export function doctor(cwd: string, options: { fix?: boolean } = {}): CommandResult {
  if (options.fix) initProject(cwd);
  const issues: Array<{ code: string; path: string }> = []; const base = path.join(cwd, '.kflow');
  if (!fs.existsSync(base)) issues.push({ code: 'missing-root', path: '.kflow' });
  for (const dir of roots) if (!fs.existsSync(path.join(base, dir))) issues.push({ code: 'missing-directory', path: `.kflow/${dir}` });
  for (const file of ['attention.md', 'project-map/index.md']) if (!fs.existsSync(path.join(base, file))) issues.push({ code: 'missing-asset', path: `.kflow/${file}` });
  for (const name of skillNames) for (const asset of listFiles(path.join(packageRoot, 'skills', name))) if (!fs.existsSync(path.join(cwd, '.agents/skills', name, asset))) issues.push({ code: asset === 'SKILL.md' ? 'missing-skill' : 'missing-skill-asset', path: projectRelative(cwd, path.join(cwd, '.agents/skills', name, asset)) });
  const invalid = findWorkDirs(base).map((dir) => ({ dir: path.relative(cwd, dir), errors: validateWork(dir) })).filter((entry) => entry.errors.length);
  const legacy = legacyRoots.filter((dir) => fs.existsSync(path.join(base, dir))).map((dir) => `.kflow/${dir}/`);
  return { command: 'doctor', ok: issues.length === 0 && invalid.length === 0, issues, invalid, legacy };
}

export function createWork(cwd: string, type: WorkType, slug: string, options: { summary?: string } = {}): CommandResult {
  if (!workTypeSet.has(type)) throw new Error(`Invalid Work type: ${type}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Slug must be lowercase kebab-case');
  const dir = path.join(cwd, '.kflow', 'works', `${type}-${slug}`); if (fs.existsSync(dir)) throw new Error(`Work already exists: ${path.relative(cwd, dir)}`);
  fs.mkdirSync(dir, { recursive: true }); if (type === 'roadmap') fs.mkdirSync(path.join(dir, 'feats'));
  const title = options.summary ?? slug.replaceAll('-', ' '); const git = gitBaseline(cwd);
  const base = { type, status: 'proposed' as const }; const workMeta: WorkMeta = { ...base, baseline: { git_head: git.gitHead, dirty_paths: git.dirtyPaths } };
  const sections = specHeadings[type].map((heading) => heading === '交付结果' ? '## 交付结果\n\n### 实现\n\n### 验证\n\n### 审查\n\n### 上下文同步\n' : `## ${heading}\n`).join('\n');
  atomicWrite(path.join(dir, 'spec.md'), `---\n${stringifyYaml(base)}\n---\n\n# ${title}\n\n${sections}`);
  atomicWrite(path.join(dir, 'work.md'), `---\n${stringifyYaml(workMeta)}\n---\n\n# ${title} · 执行记录\n\n## 当前状态\n\n## 下一步\n\n## 验证证据\n\n## 审查\n\n## 上下文同步\n\n## 阻塞\n`);
  return result('work create', [projectRelative(cwd, path.join(dir, 'spec.md')), projectRelative(cwd, path.join(dir, 'work.md'))], [], { path: projectRelative(cwd, dir) });
}

function resolveWork(cwd: string, value: string): string { const candidate = value.includes('/') ? value : path.join('.kflow', 'works', value); return path.resolve(cwd, candidate); }
export function showWork(cwd: string, value: string): CommandResult {
  const dir = resolveWork(cwd, value); if (!fs.existsSync(dir)) return { command: 'work show', ok: false, errors: [`找不到 Work：${path.relative(cwd, dir)}`] };
  const errors = validateWork(dir); if (errors.length) return { command: 'work show', ok: false, errors, path: projectRelative(cwd, dir) };
  const work = path.join(dir, 'work.md'); const source = fs.existsSync(work) ? work : path.join(dir, 'spec.md');
  const { meta, body } = readMarkdown(source);
  return { command: 'work show', ok: true, path: projectRelative(cwd, dir), type: meta.type, status: meta.status, current: sectionValue(body, '当前状态'), next: sectionValue(body, '下一步'), blockedBy: sectionValue(body, '阻塞'), baseline: meta.baseline ?? null, graduated: !fs.existsSync(work) };
}
export function validateOneWork(cwd: string, value: string): CommandResult { const dir = resolveWork(cwd, value); const errors = validateWork(dir); return { command: 'work validate', ok: errors.length === 0, path: projectRelative(cwd, dir), errors }; }
export function validateMap(cwd: string): CommandResult { const file = path.join(cwd, '.kflow/project-map/index.md'); const errors: string[] = []; if (!fs.existsSync(file)) errors.push('missing Project Map index'); else { const text = fs.readFileSync(file, 'utf8'); for (const heading of ['项目边界', '上下文路由']) if (!new RegExp(`^## ${heading}\\s*$`, 'm').test(text)) errors.push(`missing section: ${heading}`); } return { command: 'map validate', ok: errors.length === 0, path: '.kflow/project-map/index.md', errors }; }
export function status(cwd: string): CommandResult { const base = path.join(cwd, '.kflow'); const records = findWorkDirs(base).map((dir) => { const errors = validateWork(dir); let meta: Record<string, unknown> = {}; if (!errors.length) { const work = path.join(dir, 'work.md'); meta = readMarkdown(fs.existsSync(work) ? work : path.join(dir, 'spec.md')).meta; } return { path: projectRelative(cwd, dir), type: meta.type, status: meta.status, graduated: !fs.existsSync(path.join(dir, 'work.md')), errors }; }); const counts = { proposed: records.filter((x) => x.status === 'proposed').length, active: records.filter((x) => x.status === 'active').length, blocked: records.filter((x) => x.status === 'blocked').length, accepted: records.filter((x) => x.status === 'accepted').length, invalid: records.filter((x) => x.errors.length).length }; return { command: 'status', ok: counts.invalid === 0, counts, records }; }
function listFiles(root: string, relative = ''): string[] { if (!fs.existsSync(root)) return []; return fs.readdirSync(path.join(root, relative), { withFileTypes: true }).flatMap((entry) => { const next = path.join(relative, entry.name); return entry.isDirectory() ? listFiles(root, next) : [next]; }); }
function projectRelative(cwd: string, target: string): string { return path.relative(cwd, target).split(path.sep).join('/'); }
