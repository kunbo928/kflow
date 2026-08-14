import type { WorkType } from './types.js';

export const skillManifest = [
  { name: 'k-flow', workType: null },
  { name: 'k-onboard', workType: null },
  { name: 'k-roadmap', workType: 'roadmap' },
  { name: 'k-feat', workType: 'feat' },
  { name: 'k-issue', workType: 'issue' },
  { name: 'k-refactor', workType: 'refactor' },
  { name: 'k-research', workType: 'research' },
  { name: 'k-prototype', workType: 'prototype' },
  { name: 'k-reconcile', workType: null },
  { name: 'k-review', workType: null },
  { name: 'k-knowledge', workType: null },
  { name: 'k-implement', workType: null },
  { name: 'k-grilling', workType: null },
  { name: 'k-author', workType: null },
] as const;

export const skillNames = skillManifest.map((skill) => skill.name);
export const workTypes = skillManifest.filter((skill) => skill.workType).map((skill) => skill.workType) as WorkType[];
export const workTypeSet = new Set<WorkType>(workTypes);
