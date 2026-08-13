import fs from 'node:fs';
import path from 'node:path';
import { skillNames } from './skill-manifest.js';

export { skillNames } from './skill-manifest.js';

export interface AgentTool {
  id: string;
  skillsDir: string;
  detectionPaths: string[];
}

export const agentTools: AgentTool[] = [
  { id: 'amazon-q', skillsDir: '.amazonq/skills', detectionPaths: ['.amazonq'] },
  { id: 'antigravity', skillsDir: '.agent/skills', detectionPaths: ['.agent'] },
  { id: 'auggie', skillsDir: '.augment/skills', detectionPaths: ['.augment'] },
  { id: 'bob', skillsDir: '.bob/skills', detectionPaths: ['.bob'] },
  { id: 'codex', skillsDir: '.codex/skills', detectionPaths: ['.codex', 'AGENTS.md'] },
  { id: 'claude', skillsDir: '.claude/skills', detectionPaths: ['.claude', 'CLAUDE.md'] },
  { id: 'cline', skillsDir: '.cline/skills', detectionPaths: ['.cline'] },
  { id: 'codeartsagent', skillsDir: '.codeartsdoer/skills', detectionPaths: ['.codeartsdoer'] },
  { id: 'forgecode', skillsDir: '.forge/skills', detectionPaths: ['.forge'] },
  { id: 'codebuddy', skillsDir: '.codebuddy/skills', detectionPaths: ['.codebuddy'] },
  { id: 'continue', skillsDir: '.continue/skills', detectionPaths: ['.continue'] },
  { id: 'costrict', skillsDir: '.cospec/skills', detectionPaths: ['.cospec'] },
  { id: 'crush', skillsDir: '.crush/skills', detectionPaths: ['.crush'] },
  { id: 'cursor', skillsDir: '.cursor/skills', detectionPaths: ['.cursor'] },
  { id: 'factory', skillsDir: '.factory/skills', detectionPaths: ['.factory'] },
  { id: 'gemini', skillsDir: '.gemini/skills', detectionPaths: ['.gemini'] },
  { id: 'github-copilot', skillsDir: '.github/skills', detectionPaths: ['.github/copilot-instructions.md', '.github/instructions', '.github/workflows/copilot-setup-steps.yml', '.github/prompts', '.github/agents', '.github/skills', '.github/.mcp.json'] },
  { id: 'hermes', skillsDir: '.hermes/skills', detectionPaths: ['.hermes', 'HERMES.md', '.hermes.md'] },
  { id: 'iflow', skillsDir: '.iflow/skills', detectionPaths: ['.iflow'] },
  { id: 'junie', skillsDir: '.junie/skills', detectionPaths: ['.junie'] },
  { id: 'kilocode', skillsDir: '.kilocode/skills', detectionPaths: ['.kilocode'] },
  { id: 'kimi', skillsDir: '.kimi-code/skills', detectionPaths: ['.kimi-code', '.kimi'] },
  { id: 'kiro', skillsDir: '.kiro/skills', detectionPaths: ['.kiro'] },
  { id: 'lingma', skillsDir: '.lingma/skills', detectionPaths: ['.lingma'] },
  { id: 'vibe', skillsDir: '.vibe/skills', detectionPaths: ['.vibe'] },
  { id: 'oh-my-pi', skillsDir: '.omp/skills', detectionPaths: ['.omp'] },
  { id: 'opencode', skillsDir: '.opencode/skills', detectionPaths: ['.opencode'] },
  { id: 'pi', skillsDir: '.pi/skills', detectionPaths: ['.pi'] },
  { id: 'qoder', skillsDir: '.qoder/skills', detectionPaths: ['.qoder'] },
  { id: 'qwen', skillsDir: '.qwen/skills', detectionPaths: ['.qwen'] },
  { id: 'roocode', skillsDir: '.roo/skills', detectionPaths: ['.roo'] },
  { id: 'trae', skillsDir: '.trae/skills', detectionPaths: ['.trae'] },
  { id: 'windsurf', skillsDir: '.windsurf/skills', detectionPaths: ['.windsurf'] },
  { id: 'zcode', skillsDir: '.zcode/skills', detectionPaths: ['.zcode'] },
  { id: 'workbuddy', skillsDir: '.workbuddy/skills', detectionPaths: ['.workbuddy'] },
];

export function selectTools(root: string, value?: string): AgentTool[] {
  if (!value) return agentTools.filter((tool) => tool.detectionPaths.some((candidate) => fs.existsSync(path.join(root, candidate))));
  const ids = value.split(',').map((id) => id.trim()).filter(Boolean);
  if (ids.length === 1 && ids[0] === 'none') return [];
  if (ids.length === 1 && ids[0] === 'all') return [...agentTools];
  if (ids.includes('all') || ids.includes('none')) throw new Error('all/none cannot be combined with other tool IDs');
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate tool IDs are not allowed');
  return ids.map((id) => {
    const tool = agentTools.find((candidate) => candidate.id === id);
    if (!tool) throw new Error(`Unknown Agent tool: ${id}. Use: ${agentTools.map((item) => item.id).join(', ')}`);
    return tool;
  });
}

function removeExisting(target: string, force: boolean): void {
  const info = fs.lstatSync(target, { throwIfNoEntry: false });
  if (!info) return;
  if (!force) throw new Error(`Skill integration already exists: ${target}. Re-run with --force to replace it.`);
  fs.rmSync(target, { recursive: true, force: true });
}

export function installSkills(packageRoot: string, projectRoot: string, tools: AgentTool[], options: { copy?: boolean; force?: boolean } = {}): string[] {
  const changed: string[] = [];
  const canonicalRoot = path.join(projectRoot, '.agents/skills');
  fs.mkdirSync(canonicalRoot, { recursive: true });
  for (const name of skillNames) {
    const source = path.join(packageRoot, 'skills', name);
    const target = path.join(canonicalRoot, name);
    if (!fs.existsSync(source)) throw new Error(`Packaged Skill is missing: ${name}`);
    fs.cpSync(source, target, { recursive: true, force: true });
    changed.push(path.relative(projectRoot, target));
  }
  for (const tool of tools) {
    const toolRoot = path.join(projectRoot, tool.skillsDir);
    fs.mkdirSync(toolRoot, { recursive: true });
    for (const name of skillNames) {
      const target = path.join(toolRoot, name);
      const canonical = path.join(canonicalRoot, name);
      if (path.resolve(target) === path.resolve(canonical)) continue;
      const existing = fs.lstatSync(target, { throwIfNoEntry: false });
      if (existing?.isSymbolicLink() && path.resolve(toolRoot, fs.readlinkSync(target)) === path.resolve(canonical)) continue;
      if (options.copy && existing?.isDirectory()) {
        fs.cpSync(canonical, target, { recursive: true, force: true });
        changed.push(path.relative(projectRoot, target));
        continue;
      }
      removeExisting(target, options.force ?? false);
      if (options.copy) fs.cpSync(canonical, target, { recursive: true, force: true });
      else fs.symlinkSync(path.relative(toolRoot, canonical), target, 'dir');
      changed.push(path.relative(projectRoot, target));
    }
  }
  return changed;
}
