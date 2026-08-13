import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomicWrite, gitBaseline } from './filesystem.js';
import { findCursorFiles, readCursor, sectionValue, validateCursor } from './harness.js';
import { stringifyYaml } from './yaml.js';
import type { CommandResult, CursorMeta, CursorOwner } from './types.js';
import { installSkills, selectTools, skillNames } from './agent-integrations.js';
import { cursorOwnerSet } from './skill-manifest.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = ['cursors', 'lessons'];
const legacyRoots = ['work', 'requirements', 'architecture', 'roadmap', 'features', 'issues', 'refactors', 'compound', 'reference'];

function result(command: string, changed: string[] = [], warnings: string[] = [], data: Record<string, unknown> = {}): CommandResult { return { command, ok: true, changed, warnings, ...data }; }

export function initProject(cwd: string, options: { projectName?: string; description?: string; tools?: string; copy?: boolean; force?: boolean } = {}): CommandResult {
  const base = path.join(cwd, '.kflow'); const changed: string[] = [];
  fs.mkdirSync(base, { recursive: true });
  for (const dir of roots) {
    const target = path.join(base, dir); fs.mkdirSync(target, { recursive: true });
    const keep = path.join(target, '.gitkeep');
    if (!fs.existsSync(keep)) { fs.writeFileSync(keep, ''); changed.push(path.relative(cwd, keep)); }
  }
  const attention = path.join(base, 'attention.md');
  if (!fs.existsSync(attention)) {
    atomicWrite(attention, '# Attention\n\n只保留几乎每次任务都必须知道的稳定事实，最多 25 条。\n');
    changed.push('.kflow/attention.md');
  }
  const tools = selectTools(cwd, options.tools);
  changed.push(...installSkills(packageRoot, cwd, tools, { copy: options.copy, force: options.force }));
  const diagnosis = doctor(cwd);
  if (!diagnosis.ok) return { command: 'init', ok: false, changed, diagnosis };
  return result('init', changed, diagnosis.legacy as string[], { projectRoot: cwd, tools: tools.map((tool) => tool.id), skillsRoot: '.agents/skills' });
}

export function doctor(cwd: string, options: { fix?: boolean } = {}): CommandResult {
  if (options.fix) initProject(cwd);
  const issues: Array<{ code: string; path: string }> = []; const base = path.join(cwd, '.kflow');
  if (!fs.existsSync(base)) issues.push({ code: 'missing-root', path: '.kflow' });
  for (const dir of roots) if (!fs.existsSync(path.join(base, dir))) issues.push({ code: 'missing-directory', path: `.kflow/${dir}` });
  if (!fs.existsSync(path.join(base, 'attention.md'))) issues.push({ code: 'missing-asset', path: '.kflow/attention.md' });
  for (const name of skillNames) {
    const source = path.join(packageRoot, 'skills', name);
    for (const asset of listFiles(source)) {
      const installed = path.join(cwd, '.agents/skills', name, asset);
      if (!fs.existsSync(installed)) issues.push({ code: asset === 'SKILL.md' ? 'missing-skill' : 'missing-skill-asset', path: projectRelative(cwd, installed) });
    }
  }
  const invalid = findCursorFiles(base).map((file) => ({ file: path.relative(cwd, file), errors: validateCursor(file) })).filter((entry) => entry.errors.length);
  const legacy = legacyRoots.filter((dir) => fs.existsSync(path.join(base, dir))).map((dir) => `.kflow/${dir}/`);
  return { command: 'doctor', ok: issues.length === 0 && invalid.length === 0, issues, invalid, legacy };
}

export function createCursor(cwd: string, owner: CursorOwner, slug: string, options: { summary?: string } = {}): CommandResult {
  if (!cursorOwnerSet.has(owner)) throw new Error(`Invalid owner: ${owner}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Slug must be lowercase kebab-case');
  const dir = path.join(cwd, '.kflow', 'cursors'); const file = path.join(dir, `${slug}.md`);
  if (fs.existsSync(file)) throw new Error(`Cursor already exists: ${path.relative(cwd, file)}`);
  fs.mkdirSync(dir, { recursive: true });
  const git = gitBaseline(cwd);
  const meta: CursorMeta = { owner, status: 'active', baseline: { git_head: git.gitHead, dirty_paths: git.dirtyPaths } };
  const title = options.summary ?? slug.replaceAll('-', ' ');
  const body = `# ${title}\n\n## 目标\n\n## 范围与非目标\n\n## 当前状态\n\n## 下一步\n\n## 验证信号\n\n## 关键决策与证据\n\n## 阻塞\n`;
  atomicWrite(file, `---\n${stringifyYaml(meta)}\n---\n\n${body}`);
  return result('cursor create', [path.relative(cwd, file)], [], { path: path.relative(cwd, file) });
}

function listFiles(root: string, relative = ''): string[] {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(path.join(root, relative), { withFileTypes: true }).flatMap((entry) => {
    const next = path.join(relative, entry.name);
    return entry.isDirectory() ? listFiles(root, next) : [next];
  });
}

export function showCursor(cwd: string, slugOrPath: string): CommandResult {
  const candidate = slugOrPath.endsWith('.md') ? slugOrPath : path.join('.kflow', 'cursors', `${slugOrPath}.md`);
  const target = path.resolve(cwd, candidate);
  if (!fs.existsSync(target)) return { command: 'cursor show', ok: false, errors: [`cursor not found: ${path.relative(cwd, target)}`] };
  const errors = validateCursor(target);
  if (errors.length) return { command: 'cursor show', ok: false, file: path.relative(cwd, target), errors };
  const { meta, body } = readCursor(target);
  return {
    command: 'cursor show', ok: true, file: path.relative(cwd, target), owner: meta.owner, status: meta.status,
    current: sectionValue(body, '当前状态'), next: sectionValue(body, '下一步'), signal: sectionValue(body, '验证信号'),
    blockedBy: sectionValue(body, '阻塞'), baseline: meta.baseline,
  };
}

export function validateOneCursor(cwd: string, file: string): CommandResult {
  const target = path.resolve(cwd, file); const errors = validateCursor(target);
  return { command: 'cursor validate', ok: errors.length === 0, file: path.relative(cwd, target), errors };
}

export function status(cwd: string): CommandResult {
  const base = path.join(cwd, '.kflow'); const records = findCursorFiles(base).map((file) => {
    const { meta } = readCursor(file); return { file: path.relative(cwd, file), owner: meta.owner, status: meta.status, errors: validateCursor(file) };
  });
  const counts = { active: records.filter((item) => item.status === 'active').length, blocked: records.filter((item) => item.status === 'blocked').length, invalid: records.filter((item) => item.errors.length).length };
  return { command: 'status', ok: counts.invalid === 0, counts, records };
}
function projectRelative(cwd: string, target: string): string {
  return path.relative(cwd, target).split(path.sep).join('/');
}
