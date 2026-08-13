import process from 'node:process';
import path from 'node:path';
import { createCursor, doctor, initProject, showCursor, status, validateOneCursor } from './commands.js';
import type { CommandResult, CursorOwner } from './types.js';
import { searchDocuments, validateDocuments } from './documents.js';

function option(args: string[], name: string): string | undefined { const index = args.indexOf(name); if (index < 0) return undefined; const value = args[index + 1]; if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`); return value; }
function has(args: string[], name: string): boolean { return args.includes(name); }
function options(args: string[], name: string): string[] { const values: string[] = []; for (let index = 0; index < args.length; index += 1) if (args[index] === name) { const value = args[index + 1]; if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`); values.push(value); } return values; }

function usage(): never { throw new Error(`Usage:
  kflow init [path] [--tools <ids>|all|none] [--copy] [--force] [--json]
  kflow doctor [--fix] [--json]
  kflow status [--json]
  kflow document search --dir PATH [--filter EXPR]... [--query TEXT] [--sort-by FIELD] [--order asc|desc] [--full] [--json]
  kflow document validate (--file PATH|--dir PATH) [--require FIELD]... [--yaml-only] [--json]
  kflow cursor create <k-feat|k-issue|k-refactor|k-roadmap> <slug> [--summary TEXT] [--json]
  kflow cursor show <slug|path> [--json]
  kflow cursor validate <path> [--json]`); }

function print(result: CommandResult, json: boolean): void {
  if (json) console.log(JSON.stringify(result, null, 2));
  else if (result.ok) { console.log(`PASS ${result.command}`); if (Array.isArray(result.changed)) for (const file of result.changed) console.log(`  changed ${file}`); if (result.path) console.log(`  ${result.path}`); if (result.counts) console.log(JSON.stringify(result.counts, null, 2)); }
  else { console.log(`FAIL ${result.command}`); for (const entry of (result.errors as string[] | undefined) ?? []) console.log(`  - ${entry}`); for (const entry of (result.issues as Array<{ code: string; path: string }> | undefined) ?? []) console.log(`  - ${entry.code}: ${entry.path}`); }
  if (!result.ok) process.exitCode = 1;
}

export async function main(args: string[]): Promise<void> {
  const json = has(args, '--json'); const positional = args.filter((value, index) => !value.startsWith('--') && (index === 0 || !args[index - 1]?.startsWith('--'))); const [group, action] = positional; const cwd = process.cwd(); let result: CommandResult;
  if (group === 'init') { const target = positional[1] ? path.resolve(cwd, positional[1]) : cwd; result = initProject(target, { tools: option(args, '--tools'), copy: has(args, '--copy'), force: has(args, '--force') }); }
  else if (group === 'doctor') result = doctor(cwd, { fix: has(args, '--fix') });
  else if (group === 'status') result = status(cwd);
  else if (group === 'document' && action === 'search') { const dir = option(args, '--dir'); if (!dir) usage(); const order = option(args, '--order'); if (order && !['asc', 'desc'].includes(order)) throw new Error('Invalid --order: expected asc or desc'); result = searchDocuments(cwd, { dir, filters: options(args, '--filter'), query: option(args, '--query'), sortBy: option(args, '--sort-by'), order, full: has(args, '--full') }); }
  else if (group === 'document' && action === 'validate') { const file = option(args, '--file'), dir = option(args, '--dir'); if (Boolean(file) === Boolean(dir)) throw new Error('Exactly one of --file or --dir is required'); result = validateDocuments(cwd, { file, dir, required: options(args, '--require'), yamlOnly: has(args, '--yaml-only') }); }
  else if (group === 'cursor' && action === 'create') { const owner = positional[2] as CursorOwner | undefined, slug = positional[3]; if (!owner || !slug) usage(); result = createCursor(cwd, owner, slug, { summary: option(args, '--summary') }); }
  else if (group === 'cursor' && action === 'show') { const slug = positional[2]; if (!slug) usage(); result = showCursor(cwd, slug); }
  else if (group === 'cursor' && action === 'validate') { const file = positional[2]; if (!file) usage(); result = validateOneCursor(cwd, file); }
  else usage();
  print(result, json);
}
