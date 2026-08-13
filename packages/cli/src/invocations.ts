import fs from 'node:fs';
import path from 'node:path';
import { isoNow } from './filesystem.js';
import type { CommandResult } from './types.js';

export function recordInvocation(cwd: string, skill: string, result: CommandResult): void {
  const base = path.join(cwd, '.kflow');
  if (!fs.existsSync(base)) return;
  const target = typeof result.path === 'string'
    ? result.path
    : typeof result.file === 'string'
      ? result.file
      : undefined;
  const entry = { at: isoNow(), skill, command: result.command, ok: result.ok, ...(target ? { target } : {}) };
  const file = path.join(base, 'cli-invocations.jsonl');
  const previous = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean) : [];
  const records = [...previous, JSON.stringify(entry)].slice(-200);
  fs.writeFileSync(file, `${records.join('\n')}\n`, { encoding: 'utf8', mode: 0o600 });
  fs.chmodSync(file, 0o600);
}
