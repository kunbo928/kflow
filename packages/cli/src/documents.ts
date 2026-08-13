import fs from 'node:fs';
import path from 'node:path';
import { parseYaml } from './yaml.js';
import type { CommandResult } from './types.js';

interface DocumentRecord {
  file: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

function markdownFiles(target: string): string[] {
  if (!fs.existsSync(target)) return [];
  if (fs.statSync(target).isFile()) return [target];
  const files: string[] = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const child = path.join(target, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(child));
    else if (entry.name.endsWith('.md') || entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) files.push(child);
  }
  return files;
}

function readDocument(file: string, yamlOnly = false): DocumentRecord {
  const text = fs.readFileSync(file, 'utf8');
  if (yamlOnly) return { file, frontmatter: parseYaml(text), body: '' };
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error('missing YAML frontmatter');
  return { file, frontmatter: parseYaml(match[1]!), body: text.slice(match[0].length) };
}

function values(value: unknown): string[] {
  return (Array.isArray(value) ? value : [value]).map((item) => String(item ?? '').toLowerCase());
}

function matchesFilter(record: DocumentRecord, expression: string): boolean {
  const operator = expression.includes('~=') ? '~=' : '=';
  const [key, candidatesText] = expression.split(operator, 2);
  if (!key || candidatesText === undefined) throw new Error(`Invalid filter: ${expression}`);
  const actual = values(record.frontmatter[key]);
  const candidates = candidatesText.split('|').map((candidate) => candidate.toLowerCase());
  return candidates.some((candidate) => actual.some((item) => operator === '=' ? item === candidate : item.includes(candidate)));
}

export function searchDocuments(cwd: string, options: { dir: string; filters?: string[]; query?: string; sortBy?: string; order?: string; full?: boolean }): CommandResult {
  const root = path.resolve(cwd, options.dir);
  if (!fs.existsSync(root)) return { command: 'document search', ok: false, errors: [`Path does not exist: ${options.dir}`] };
  let records: DocumentRecord[] = [];
  const errors: Array<{ file: string; error: string }> = [];
  for (const file of markdownFiles(root)) {
    try {
      const record = readDocument(file);
      if ((options.filters ?? []).every((filter) => matchesFilter(record, filter)) && (!options.query || `${JSON.stringify(record.frontmatter)}\n${record.body}`.toLowerCase().includes(options.query.toLowerCase()))) records.push(record);
    } catch (error) {
      errors.push({ file: path.relative(cwd, file), error: error instanceof Error ? error.message : String(error) });
    }
  }
  if (options.sortBy) {
    const field = options.sortBy;
    const direction = options.order === 'asc' ? 1 : -1;
    records = records.sort((left, right) => {
      const a = left.frontmatter[field], b = right.frontmatter[field];
      if (a == null) return b == null ? 0 : 1;
      if (b == null) return -1;
      return String(a).localeCompare(String(b)) * direction;
    });
  }
  return {
    command: 'document search', ok: true,
    count: records.length,
    results: records.map((record) => ({ file: path.relative(cwd, record.file), frontmatter: record.frontmatter, ...(options.full ? { body: record.body } : {}) })),
    warnings: errors,
  };
}

export function validateDocuments(cwd: string, options: { file?: string; dir?: string; required?: string[]; yamlOnly?: boolean }): CommandResult {
  const target = path.resolve(cwd, options.file ?? options.dir!);
  if (!fs.existsSync(target)) return { command: 'document validate', ok: false, errors: [`Path does not exist: ${options.file ?? options.dir}`] };
  const errors: Array<{ file: string; errors: string[] }> = [];
  for (const file of markdownFiles(target)) {
    const fileErrors: string[] = [];
    try {
      const record = readDocument(file, options.yamlOnly);
      for (const key of options.required ?? []) if (!(key in record.frontmatter)) fileErrors.push(`missing field: ${key}`);
    } catch (error) { fileErrors.push(error instanceof Error ? error.message : String(error)); }
    if (fileErrors.length) errors.push({ file: path.relative(cwd, file), errors: fileErrors });
  }
  return { command: 'document validate', ok: errors.length === 0, checked: markdownFiles(target).length, invalid: errors };
}
