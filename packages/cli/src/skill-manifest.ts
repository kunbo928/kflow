import type { CursorOwner } from './types.js';

export const skillManifest = [
  { name: 'k-flow', cursorOwner: false },
  { name: 'k-onboard', cursorOwner: false },
  { name: 'k-feat', cursorOwner: true },
  { name: 'k-issue', cursorOwner: true },
  { name: 'k-refactor', cursorOwner: true },
  { name: 'k-roadmap', cursorOwner: true },
  { name: 'k-review', cursorOwner: false },
  { name: 'k-knowledge', cursorOwner: false },
] as const;

export const skillNames = skillManifest.map((skill) => skill.name);
export const cursorOwners = skillManifest.filter((skill) => skill.cursorOwner).map((skill) => skill.name) as CursorOwner[];
export const cursorOwnerSet = new Set<CursorOwner>(cursorOwners);
