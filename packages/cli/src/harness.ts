import fs from 'node:fs';
import path from 'node:path';
import { parseYaml } from './yaml.js';
import type { CursorMeta } from './types.js';
import { cursorOwnerSet } from './skill-manifest.js';

const requiredSections = ['目标', '范围与非目标', '当前状态', '下一步', '验证信号', '关键决策与证据', '阻塞'];

export function sectionValue(body: string, heading: string): string | null {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = body.match(new RegExp(`^## ${escaped}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'));
  return match?.[1]?.trim() || null;
}

export function readCursor(file: string): { meta: CursorMeta; body: string } {
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error('missing YAML frontmatter');
  return { meta: parseYaml(match[1]) as unknown as CursorMeta, body: text.slice(match[0].length) };
}

export function validateCursor(file: string): string[] {
  let meta: CursorMeta, body: string;
  try { ({ meta, body } = readCursor(file)); } catch (error) { return [error instanceof Error ? error.message : String(error)]; }
  const errors: string[] = [];
  if (!cursorOwnerSet.has(meta.owner)) errors.push('invalid owner');
  if (!['active', 'blocked'].includes(meta.status)) errors.push('invalid status');
  if (!(typeof meta.baseline?.git_head === 'string' || meta.baseline?.git_head === null)) errors.push('baseline.git_head must be a string or null');
  if (!Array.isArray(meta.baseline?.dirty_paths) || meta.baseline.dirty_paths.some((item) => typeof item !== 'string')) errors.push('baseline.dirty_paths must be a string list');
  for (const heading of requiredSections) {
    const value = sectionValue(body, heading);
    if (!new RegExp(`^## ${heading}\\s*$`, 'm').test(body)) errors.push(`missing section: ${heading}`);
    else if (heading !== '阻塞' && !value) errors.push(`empty section: ${heading}`);
  }
  if (meta.status === 'blocked' && !sectionValue(body, '阻塞')) errors.push('blocked cursor requires a non-empty 阻塞 section');
  return errors;
}

export function findCursorFiles(root: string): string[] {
  const dir = path.join(root, 'cursors');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== '.gitkeep')
    .map((entry) => path.join(dir, entry.name));
}
