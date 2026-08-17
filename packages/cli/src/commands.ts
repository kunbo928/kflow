import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomicWrite, gitBaseline } from './filesystem.js';
import { findWorkDirs, readMarkdown, roadmapProjection, sectionValue, validateWork } from './harness.js';
import { stringifyYaml } from './yaml.js';
import type { CommandResult, WorkMeta, WorkType } from './types.js';
import { installSkills, selectTools, skillNames } from './agent-integrations.js';
import { workTypeSet } from './skill-manifest.js';
import { diag, envelope } from './types.js';
import type { Diagnostic } from './types.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = ['works'];
const legacyRoots = ['cursors', 'work', 'requirements', 'architecture', 'roadmap', 'features', 'issues', 'refactors', 'compound', 'reference', 'lessons'];
const errorDiags = (code: string, messages: string[], target?: string, fix?: string): Diagnostic[] => messages.map((message) => diag('error', code, message, { target, fix }));
const FIX_INVALID_WORK = '补齐对应章节或 frontmatter 后重跑 kflow work validate';
const specHeadings: Record<WorkType, string[]> = {
  feat: ['目标行为', '范围与非目标', '验收场景', '测试契约', '关键决策', '交付结果'],
  issue: ['故障症状', '期望行为', '复现条件', '根因', '回归契约', '交付结果'],
  refactor: ['等价边界', '结构目标', '范围与非目标', '行为基线', '关键决策', '交付结果'],
  roadmap: ['目的地', '范围与非目标', '整体验收', '关键决策', '尚未明确', 'Feature 索引', '交付结果'],
  research: ['研究问题', '范围与证据标准', '结论', '来源', '适用边界', '交付结果'],
  prototype: ['决策问题', '待验证假设', '最低产物', '观察与结论', '生产差距', '交付结果'],
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
  const mapRoot = path.join(base, 'project-map'); fs.mkdirSync(mapRoot, { recursive: true });
  const map = path.join(mapRoot, 'index.md');
  if (!fs.existsSync(map)) { atomicWrite(map, '# Project Map\n\n## 项目边界\n\n待 `k-onboard` 根据仓库事实补全。\n\n## 上下文路由\n\n- 开发入口：待核实\n- 架构与模块：待核实\n- 规范：`AGENTS.md`\n'); changed.push('.kflow/project-map/index.md'); }
  ensureAgentsContract(cwd, changed);
  const tools = selectTools(cwd, options.tools); changed.push(...installSkills(packageRoot, cwd, tools, { copy: options.copy, force: options.force }));
  const diagnosis = doctor(cwd);
  if (!diagnosis.ok) return envelope('init', diagnosis.diagnostics, { changed });
  return envelope('init', diagnosis.diagnostics, { changed, projectRoot: cwd, tools: tools.map((tool) => tool.id), skillsRoot: '.agents/skills' });
}

export function doctor(cwd: string, options: { fix?: boolean } = {}): CommandResult {
  if (options.fix) initProject(cwd);
  const diagnostics: Diagnostic[] = []; const base = path.join(cwd, '.kflow');
  if (!fs.existsSync(base)) diagnostics.push(diag('error', 'missing_root', '缺少 .kflow 根目录', { target: '.kflow', fix: 'kflow init' }));
  for (const dir of roots) if (!fs.existsSync(path.join(base, dir))) diagnostics.push(diag('error', 'missing_directory', `缺少目录：.kflow/${dir}`, { target: `.kflow/${dir}`, fix: 'kflow init' }));
  for (const file of ['project-map/index.md']) if (!fs.existsSync(path.join(base, file))) diagnostics.push(diag('error', 'missing_asset', `缺少资产：.kflow/${file}`, { target: `.kflow/${file}`, fix: 'kflow init' }));
  for (const name of skillNames) for (const asset of listFiles(path.join(packageRoot, 'skills', name))) if (!fs.existsSync(path.join(cwd, '.agents/skills', name, asset))) { const target = projectRelative(cwd, path.join(cwd, '.agents/skills', name, asset)); diagnostics.push(diag('error', asset === 'SKILL.md' ? 'missing_skill' : 'missing_skill_asset', `缺少 Skill 资产：${target}`, { target, fix: 'kflow init --force' })); }
  for (const dir of findWorkDirs(base)) { const errors = validateWork(dir); const target = path.relative(cwd, dir); for (const message of errors) diagnostics.push(diag('error', 'invalid_work', message, { target, fix: FIX_INVALID_WORK })); }
  for (const dir of legacyRoots.filter((entry) => fs.existsSync(path.join(base, entry)))) diagnostics.push(diag('warning', 'legacy_asset', `遗留资产（只报告不迁移）：.kflow/${dir}/`, { target: `.kflow/${dir}/` }));
  for (const file of (['attention.md'] as const).filter((entry) => fs.existsSync(path.join(base, entry)))) diagnostics.push(diag('warning', 'legacy_asset', `遗留资产（只报告不迁移）：.kflow/${file}`, { target: `.kflow/${file}` }));
  return envelope('doctor', diagnostics, {});
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
  return envelope('work create', [], { changed: [projectRelative(cwd, path.join(dir, 'spec.md')), projectRelative(cwd, path.join(dir, 'work.md'))], path: projectRelative(cwd, dir) });
}

function resolveWork(cwd: string, value: string): string { const candidate = value.includes('/') ? value : path.join('.kflow', 'works', value); return path.resolve(cwd, candidate); }
export function showWork(cwd: string, value: string): CommandResult {
  const dir = resolveWork(cwd, value); if (!fs.existsSync(dir)) return envelope('work show', [diag('error', 'work_not_found', `找不到 Work：${path.relative(cwd, dir)}`, { target: path.relative(cwd, dir) })]);
  const errors = validateWork(dir); if (errors.length) return envelope('work show', errorDiags('invalid_work', errors, path.relative(cwd, dir), FIX_INVALID_WORK), { path: projectRelative(cwd, dir) });
  const work = path.join(dir, 'work.md'); const source = fs.existsSync(work) ? work : path.join(dir, 'spec.md');
  const { meta, body } = readMarkdown(source);
  const data: Record<string, unknown> = { path: projectRelative(cwd, dir), type: meta.type, status: meta.status, current: sectionValue(body, '当前状态'), nextStep: sectionValue(body, '下一步'), blockedBy: sectionValue(body, '阻塞'), baseline: meta.baseline ?? null, graduated: !fs.existsSync(work) };
  if (meta.type === 'roadmap') Object.assign(data, roadmapProjection(dir));
  return envelope('work show', [], data);
}
export function validateOneWork(cwd: string, value: string): CommandResult { const dir = resolveWork(cwd, value); const errors = validateWork(dir); return envelope('work validate', errorDiags('invalid_work', errors, path.relative(cwd, dir), FIX_INVALID_WORK), { path: projectRelative(cwd, dir) }); }
export function validateMap(cwd: string): CommandResult {
  const file = path.join(cwd, '.kflow/project-map/index.md');
  const errors: string[] = [];
  if (!fs.existsSync(file)) errors.push('missing Project Map index');
  else {
    const text = fs.readFileSync(file, 'utf8');
    for (const heading of ['项目边界', '上下文路由']) if (!new RegExp(`^## ${heading}\\s*$`, 'm').test(text)) errors.push(`missing section: ${heading}`);
    const route = sectionValue(text, '上下文路由') ?? '';
    const pointers = [...route.matchAll(/`([^`]+)`/g), ...route.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]);
    for (const pointer of pointers) {
      if (!pointer || /^[a-z]+:/i.test(pointer) || pointer.startsWith('#') || pointer.startsWith('mailto:') || /[*?]/.test(pointer)) continue;
      if (!/[./]/.test(pointer) && !/\.[a-z0-9]+$/i.test(pointer)) continue;
      if (!fs.existsSync(path.join(cwd, pointer))) errors.push(`missing pointer: ${pointer}`);
    }
  }
  return envelope('map validate', errorDiags('invalid_map', errors, '.kflow/project-map/index.md', '补齐项目边界、上下文路由，并确保路由指针路径存在'), { path: '.kflow/project-map/index.md' });
}
export function status(cwd: string): CommandResult {
  const base = path.join(cwd, '.kflow');
  const records = findWorkDirs(base).map((dir) => { const errors = validateWork(dir); let meta: Record<string, unknown> = {}; if (!errors.length) { const work = path.join(dir, 'work.md'); meta = readMarkdown(fs.existsSync(work) ? work : path.join(dir, 'spec.md')).meta; } return { path: projectRelative(cwd, dir), type: meta.type, status: meta.status, graduated: !fs.existsSync(path.join(dir, 'work.md')), diagnostics: errorDiags('invalid_work', errors, path.relative(cwd, dir), FIX_INVALID_WORK) }; });
  const counts = { proposed: records.filter((x) => x.status === 'proposed').length, active: records.filter((x) => x.status === 'active').length, blocked: records.filter((x) => x.status === 'blocked').length, accepted: records.filter((x) => x.status === 'accepted').length, invalid: records.filter((x) => x.diagnostics.length).length };
  const diagnostics = records.flatMap((record) => record.diagnostics);
  return envelope('status', diagnostics, { counts, records });
}
function listFiles(root: string, relative = ''): string[] { if (!fs.existsSync(root)) return []; return fs.readdirSync(path.join(root, relative), { withFileTypes: true }).flatMap((entry) => { const next = path.join(relative, entry.name); return entry.isDirectory() ? listFiles(root, next) : [next]; }); }
function projectRelative(cwd: string, target: string): string { return path.relative(cwd, target).split(path.sep).join('/'); }
