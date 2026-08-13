export type CursorOwner = 'k-feat' | 'k-issue' | 'k-refactor' | 'k-roadmap';
export type CursorStatus = 'active' | 'blocked';

export interface CursorMeta {
  owner: CursorOwner;
  status: CursorStatus;
  baseline: { git_head: string | null; dirty_paths: string[] };
}

export interface CommandResult {
  command: string;
  ok: boolean;
  [key: string]: unknown;
}
