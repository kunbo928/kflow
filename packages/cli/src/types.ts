export type WorkType = 'roadmap' | 'feat' | 'issue' | 'refactor' | 'research' | 'prototype';
export type WorkStatus = 'proposed' | 'active' | 'blocked' | 'accepted' | 'cancelled' | 'superseded';

export interface WorkMeta {
  type: WorkType;
  status: WorkStatus;
  baseline: { git_head: string | null; dirty_paths: string[] };
}

export type Severity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  severity: Severity;
  code: string;
  message: string;
  target?: string;
  fix?: string;
}

export const SCHEMA_VERSION = 1 as const;

export interface CommandResult {
  schemaVersion: typeof SCHEMA_VERSION;
  command: string;
  ok: boolean;
  diagnostics: Diagnostic[];
  [key: string]: unknown;
}

export function diag(severity: Severity, code: string, message: string, extra: { target?: string; fix?: string } = {}): Diagnostic {
  const entry: Diagnostic = { severity, code, message };
  if (extra.target !== undefined) entry.target = extra.target;
  if (extra.fix !== undefined) entry.fix = extra.fix;
  return entry;
}

export function envelope(command: string, diagnostics: Diagnostic[] = [], data: Record<string, unknown> = {}): CommandResult {
  return { schemaVersion: SCHEMA_VERSION, command, ok: !diagnostics.some((entry) => entry.severity === 'error'), diagnostics, ...data };
}
