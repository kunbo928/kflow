import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export function atomicWrite(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, content, 'utf8');
  fs.renameSync(temporary, file);
}

export function copyManaged(source: string, target: string): void {
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(source, target, { recursive: true, force: true });
}

export function gitBaseline(cwd: string): { gitHead: string | null; dirtyPaths: string[] } {
  try {
    const git = (...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return {
      gitHead: git('rev-parse', 'HEAD') || null,
      dirtyPaths: git('status', '--porcelain').split(/\r?\n/).filter(Boolean).map((line) => line.slice(3)),
    };
  } catch { return { gitHead: null, dirtyPaths: [] }; }
}

export function isoNow(): string { return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'); }
export function dateNow(): string { return isoNow().slice(0, 10); }
export function tempDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kflow-')); }
