import fs from 'node:fs';
import path from 'node:path';
import { parseYaml } from './yaml.js';
import type { WorkMeta, WorkType } from './types.js';
import { workTypeSet } from './skill-manifest.js';

const workSections = ['当前状态', '下一步', '验证证据', '审查', '上下文同步', '阻塞'];
const specSections: Record<WorkType, string[]> = {
  feat: ['目标行为', '范围与非目标', '验收场景', '测试契约', '关键决策', '交付结果'],
  issue: ['故障症状', '期望行为', '复现条件', '根因', '回归契约', '交付结果'],
  refactor: ['等价边界', '结构目标', '范围与非目标', '行为基线', '关键决策', '交付结果'],
  roadmap: ['目的地', '范围与非目标', '整体验收', '关键决策', '尚未明确', 'Feature 索引', '交付结果'],
  research: ['研究问题', '范围与证据标准', '结论', '来源', '适用边界', '交付结果'],
  prototype: ['决策问题', '待验证假设', '最低产物', '观察与结论', '生产差距', '交付结果'],
  architecture: ['设计问题', '现状证据', '候选方案与取舍', '最终选择', '迁移边界', '交付结果'],
};
const terminalStatuses = ['accepted', 'cancelled', 'superseded'];
const statuses = ['proposed', 'active', 'blocked', 'accepted', 'cancelled', 'superseded'];
const resultFields = ['实现', '验证', '审查', '上下文同步'];

export function sectionValue(body: string, heading: string): string | null {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = body.match(new RegExp(`^## ${escaped}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'));
  return match?.[1]?.trim() || null;
}

export function readMarkdown(file: string): { meta: Record<string, unknown>; body: string } {
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error('缺少 YAML frontmatter');
  return { meta: parseYaml(match[1]) as Record<string, unknown>, body: text.slice(match[0].length) };
}

function requireSections(body: string, headings: string[], errors: string[], prefix = ''): void {
  for (const heading of headings) if (!new RegExp(`^## ${heading}\\s*$`, 'm').test(body)) errors.push(`${prefix}缺少章节：${heading}`);
}

function subsectionValue(body: string, heading: string): string | null {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = body.match(new RegExp(`^### ${escaped}\\s*$([\\s\\S]*?)(?=^### |^## |(?![\\s\\S]))`, 'm'));
  return match?.[1]?.trim() || null;
}

function validateAcceptedSpec(body: string, errors: string[], owner = 'accepted Work 的 spec.md'): void {
  for (const field of resultFields) if (!subsectionValue(body, field)) errors.push(`${owner}“交付结果/${field}”不能为空`);
}

function validateRoadmapFeats(dir: string, parentStatus: unknown, errors: string[]): void {
  const feats = path.join(dir, 'feats');
  if (!fs.existsSync(feats)) { errors.push('Roadmap 缺少 feats/'); return; }
  const files = fs.readdirSync(feats, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith('.md'));
  const ids = new Set<string>(); const records: Array<{ file: string; id: string; depends: string[]; status: unknown }> = [];
  for (const entry of files) {
    if (!/^\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(entry.name)) errors.push(`Feat 文件名无效：${entry.name}`);
    try {
      const { meta, body } = readMarkdown(path.join(feats, entry.name));
      const id = typeof meta.id === 'string' ? meta.id : '';
      if (!/^FEAT-\d{2}$/.test(id)) errors.push(`${entry.name} 的 id 必须是 FEAT-NN`);
      if (ids.has(id)) errors.push(`重复 Feat id：${id}`); else if (id) ids.add(id);
      if (!['proposed', 'active', 'blocked', 'accepted', 'cancelled', 'superseded'].includes(String(meta.status))) errors.push(`${entry.name} 的 status 无效`);
      if (!Array.isArray(meta.depends_on) || meta.depends_on.some((item) => typeof item !== 'string')) errors.push(`${entry.name} 的 depends_on 必须是列表`);
      requireSections(body, ['目标行为', '范围与非目标', '验收场景', '测试契约', '关键决策', '交付结果'], errors, `${entry.name} `);
      if (['active', 'accepted'].includes(String(meta.status))) for (const heading of ['目标行为', '范围与非目标', '验收场景', '测试契约']) if (!sectionValue(body, heading)) errors.push(`${entry.name} 的“${heading}”章节不能为空`);
      if (meta.status === 'accepted') validateAcceptedSpec(body, errors, entry.name);
      records.push({ file: entry.name, id, depends: Array.isArray(meta.depends_on) ? meta.depends_on as string[] : [], status: meta.status });
    } catch (error) { errors.push(`${entry.name}：${error instanceof Error ? error.message : String(error)}`); }
  }
  for (const record of records) for (const dependency of record.depends) if (!ids.has(dependency)) errors.push(`${record.file} 引用了不存在的依赖：${dependency}`);
  const visiting = new Set<string>(); const visited = new Set<string>(); const byId = new Map(records.map((record) => [record.id, record]));
  const visit = (id: string): boolean => { if (visiting.has(id)) return true; if (visited.has(id)) return false; visiting.add(id); const cycle = (byId.get(id)?.depends ?? []).some(visit); visiting.delete(id); visited.add(id); return cycle; };
  if (records.some((record) => visit(record.id))) errors.push('Feat 依赖存在环');
  if (parentStatus === 'accepted' && records.length === 0) errors.push('accepted Roadmap 至少需要一个 Feature');
  if (parentStatus === 'accepted') for (const record of records) if (record.status !== 'accepted') errors.push(`accepted Roadmap 的 Feature 必须全部 accepted：${record.file}`);
  const specBody = readMarkdown(path.join(dir, 'spec.md')).body; const index = sectionValue(specBody, 'Feature 索引') ?? '';
  const indexed = new Set(index.match(/FEAT-\d{2}/g) ?? []);
  for (const id of ids) if (!indexed.has(id)) errors.push(`Feature 索引缺少：${id}`);
  for (const id of indexed) if (!ids.has(id)) errors.push(`Feature 索引包含不存在的 Feature：${id}`);
}

export function validateWork(dir: string): string[] {
  const spec = path.join(dir, 'spec.md'); const work = path.join(dir, 'work.md'); const errors: string[] = [];
  if (!fs.existsSync(spec)) errors.push('缺少文件：spec.md');
  if (!fs.existsSync(work) && fs.existsSync(spec)) {
    try {
      const { meta, body } = readMarkdown(spec);
      if (!terminalStatuses.includes(String(meta.status))) errors.push('非终态 Work 缺少文件：work.md');
      const type = meta.type as WorkType;
      if (!workTypeSet.has(type)) return ['无效的 Work 类型'];
      if (!statuses.includes(String(meta.status))) errors.push('无效的 status');
      if (!new RegExp(`^${type}-[a-z0-9]+(?:-[a-z0-9]+)*$`).test(path.basename(dir))) errors.push('Work 目录名必须与 type 一致并使用 kebab-case');
      requireSections(body, specSections[type], errors, 'spec.md ');
      if (meta.status === 'accepted') validateAcceptedSpec(body, errors);
      if (type === 'roadmap') { if (!sectionValue(body, 'Feature 索引')) errors.push('Roadmap 的“Feature 索引”不能为空'); validateRoadmapFeats(dir, meta.status, errors); }
      return errors;
    } catch (error) { return [error instanceof Error ? error.message : String(error)]; }
  }
  if (errors.length) return errors;
  let specMeta: Record<string, unknown>, specBody: string, workMeta: WorkMeta, workBody: string;
  try { ({ meta: specMeta, body: specBody } = readMarkdown(spec)); ({ meta: workMeta, body: workBody } = readMarkdown(work) as unknown as { meta: WorkMeta; body: string }); }
  catch (error) { return [error instanceof Error ? error.message : String(error)]; }
  if (!workTypeSet.has(workMeta.type)) return ['无效的 Work 类型'];
  if (!new RegExp(`^${workMeta.type}-[a-z0-9]+(?:-[a-z0-9]+)*$`).test(path.basename(dir))) errors.push('Work 目录名必须与 type 一致并使用 kebab-case');
  if (specMeta.type !== workMeta.type) errors.push('spec.md 与 work.md 的 type 必须一致');
  if (!statuses.includes(workMeta.status)) errors.push('无效的 status');
  if (specMeta.status !== workMeta.status) errors.push('spec.md 与 work.md 的 status 必须一致');
  if (!(typeof workMeta.baseline?.git_head === 'string' || workMeta.baseline?.git_head === null)) errors.push('baseline.git_head 必须是字符串或 null');
  if (!Array.isArray(workMeta.baseline?.dirty_paths)) errors.push('baseline.dirty_paths 必须是列表');
  requireSections(specBody, specSections[workMeta.type], errors, 'spec.md ');
  requireSections(workBody, workSections, errors, 'work.md ');
  if (workMeta.status === 'blocked' && !sectionValue(workBody, '阻塞')) errors.push('blocked Work 的“阻塞”章节不能为空');
  if (workMeta.status === 'accepted') validateAcceptedSpec(specBody, errors);
  if (workMeta.type === 'roadmap') { if (!sectionValue(specBody, 'Feature 索引')) errors.push('Roadmap 的“Feature 索引”不能为空'); validateRoadmapFeats(dir, workMeta.status, errors); }
  return errors;
}

export function findWorkDirs(root: string): string[] {
  const dir = path.join(root, 'works');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => path.join(dir, entry.name));
}
