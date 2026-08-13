import process from 'node:process';
import path from 'node:path';
import { createWork, doctor, initProject, showWork, status, validateMap, validateOneWork } from './commands.js';
import type { CommandResult, WorkType } from './types.js';
import { searchDocuments, validateDocuments } from './documents.js';
import { recordInvocation } from './invocations.js';
import { skillNames } from './skill-manifest.js';
import { agentTools, selectTools } from './agent-integrations.js';
import { agentChoices, filterChoices, initiallySelectedIds, selectAgentsInteractively } from './agent-selection.js';

export { filterChoices, initiallySelectedIds } from './agent-selection.js';

function option(args: string[], name: string): string | undefined { const index = args.indexOf(name); if (index < 0) return undefined; const value = args[index + 1]; if (!value || value.startsWith('--')) throw new Error(`${name} 需要一个值`); return value; }
function has(args: string[], name: string): boolean { return args.includes(name); }
function options(args: string[], name: string): string[] { const values: string[] = []; for (let index = 0; index < args.length; index += 1) if (args[index] === name) { const value = args[index + 1]; if (!value || value.startsWith('--')) throw new Error(`${name} 需要一个值`); values.push(value); } return values; }

function usage(): never { throw new Error(`Usage:
  kflow init [path] [--tools <ids>|all|none] [--yes|-y] [--copy] [--force] [--json]
  kflow doctor [--fix] [--json]
  kflow status [--json]
  kflow map validate [--json]
  kflow work create <roadmap|feat|issue|refactor|research|prototype|architecture> <slug> [--summary TEXT] [--json]
  kflow work show <type-slug|path> [--json]
  kflow work validate <type-slug|path> [--json]
  kflow document search --dir PATH [--filter EXPR]... [--query TEXT] [--sort-by FIELD] [--order asc|desc] [--full] [--json]
  kflow document validate (--file PATH|--dir PATH) [--require FIELD]... [--yaml-only] [--json]

Skill calls add --skill <installed k-* skill>.`); }

function print(result: CommandResult, json: boolean): void {
  if (json) console.log(JSON.stringify(result, null, 2));
  else if (result.ok) { console.log(`PASS ${result.command}`); if (Array.isArray(result.changed)) for (const file of result.changed) console.log(`  changed ${file}`); if (result.path) console.log(`  ${result.path}`); if (result.counts) console.log(JSON.stringify(result.counts, null, 2)); }
  else { console.log(`FAIL ${result.command}`); for (const entry of (result.errors as string[] | undefined) ?? []) console.log(`  - ${entry}`); for (const entry of (result.issues as Array<{ code: string; path: string }> | undefined) ?? []) console.log(`  - ${entry.code}: ${entry.path}`); }
  if (!result.ok) process.exitCode = 1;
}

export async function main(args: string[]): Promise<void> {
  const json = has(args, '--json'); const skill = option(args, '--skill');
  if (skill && !(skillNames as readonly string[]).includes(skill)) throw new Error(`Invalid --skill: ${skill}`);
  const positional = args.filter((value, index) => !value.startsWith('--') && (index === 0 || !args[index - 1]?.startsWith('--'))); const [group, action] = positional; const cwd = process.cwd(); let result: CommandResult;
  if (group === 'init') {
    const target = positional[1] ? path.resolve(cwd, positional[1]) : cwd;
    const explicit = option(args, '--tools');
    const detected = selectTools(target);
    let selected: string;
    if (explicit !== undefined) selected = explicit;
    else if (has(args, '--yes') || has(args, '-y')) selected = detected.map((tool) => tool.id).join(',') || 'none';
    else if (process.stdin.isTTY && process.stdout.isTTY) selected = (await selectAgentsInteractively(agentChoices(agentTools, detected))).join(',');
    else if (detected.length > 0) selected = detected.map((tool) => tool.id).join(',');
    else throw new Error('No Agent tools were detected. Pass --tools all, --tools none, --yes to install to detected Agents, or a comma-separated tool list.');
    result = initProject(target, { tools: selected || 'none', copy: has(args, '--copy'), force: has(args, '--force') });
  }
  else if (group === 'doctor') result = doctor(cwd, { fix: has(args, '--fix') });
  else if (group === 'status') result = status(cwd);
  else if (group === 'map' && action === 'validate') result = validateMap(cwd);
  else if (group === 'work' && action === 'create') { const type = positional[2] as WorkType | undefined, slug = positional[3]; if (!type || !slug) usage(); result = createWork(cwd, type, slug, { summary: option(args, '--summary') }); }
  else if (group === 'work' && action === 'show') { const value = positional[2]; if (!value) usage(); result = showWork(cwd, value); }
  else if (group === 'work' && action === 'validate') { const value = positional[2]; if (!value) usage(); result = validateOneWork(cwd, value); }
  else if (group === 'document' && action === 'search') { const dir = option(args, '--dir'); if (!dir) usage(); const order = option(args, '--order'); if (order && !['asc', 'desc'].includes(order)) throw new Error('Invalid --order: expected asc or desc'); result = searchDocuments(cwd, { dir, filters: options(args, '--filter'), query: option(args, '--query'), sortBy: option(args, '--sort-by'), order, full: has(args, '--full') }); }
  else if (group === 'document' && action === 'validate') { const file = option(args, '--file'), dir = option(args, '--dir'); if (Boolean(file) === Boolean(dir)) throw new Error('Exactly one of --file or --dir is required'); result = validateDocuments(cwd, { file, dir, required: options(args, '--require'), yamlOnly: has(args, '--yaml-only') }); }
  else usage();
  if (skill) recordInvocation(cwd, skill, result);
  print(result, json);
}
