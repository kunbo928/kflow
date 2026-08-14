export type WorkType = 'roadmap' | 'feat' | 'issue' | 'refactor' | 'research' | 'prototype';
export type WorkStatus = 'proposed' | 'active' | 'blocked' | 'accepted' | 'cancelled' | 'superseded';

export interface WorkMeta {
  type: WorkType;
  status: WorkStatus;
  baseline: { git_head: string | null; dirty_paths: string[] };
}

export interface CommandResult {
  command: string;
  ok: boolean;
  [key: string]: unknown;
}
