import chalk from 'chalk';
import type { AgentTool } from './agent-integrations.js';

export interface AgentChoice {
  id: string;
  name: string;
  detected: boolean;
  preSelected?: boolean;
}

interface MultiSelectConfig {
  message: string;
  choices: AgentChoice[];
  pageSize?: number;
  validate?: (selected: string[]) => boolean | string;
}

const displayNames: Record<string, string> = {
  'amazon-q': 'Amazon Q Developer', antigravity: 'Antigravity', auggie: 'Auggie (Augment CLI)', bob: 'Bob Shell',
  codex: 'Codex', claude: 'Claude Code', cline: 'Cline', codeartsagent: 'CodeArts', forgecode: 'ForgeCode',
  codebuddy: 'CodeBuddy Code', continue: 'Continue', costrict: 'CoStrict', crush: 'Crush', cursor: 'Cursor',
  factory: 'Factory Droid', gemini: 'Gemini CLI', 'github-copilot': 'GitHub Copilot', hermes: 'Hermes', iflow: 'iFlow',
  junie: 'Junie', kilocode: 'Kilo Code', kimi: 'Kimi Code', kiro: 'Kiro', lingma: 'Lingma', vibe: 'Mistral Vibe',
  'oh-my-pi': 'Oh My Pi', opencode: 'OpenCode', pi: 'Pi', qoder: 'Qoder', qwen: 'Qwen Code', roocode: 'Roo Code',
  trae: 'Trae', windsurf: 'Windsurf', zcode: 'ZCode', workbuddy: 'WorkBuddy',
};

export function agentChoices(tools: AgentTool[], detected: AgentTool[]): AgentChoice[] {
  const detectedIds = new Set(detected.map((tool) => tool.id));
  return tools.map((tool) => ({
    id: tool.id,
    name: displayNames[tool.id] ?? tool.id,
    detected: detectedIds.has(tool.id),
    preSelected: detectedIds.has(tool.id),
  }));
}

export function initiallySelectedIds(choices: AgentChoice[]): string[] {
  return choices.filter((choice) => choice.preSelected ?? choice.detected).map((choice) => choice.id);
}

export function filterChoices(choices: AgentChoice[], searchText: string): AgentChoice[] {
  const term = searchText.trim().toLowerCase();
  if (!term) return choices;
  return choices.filter((choice) => choice.name.toLowerCase().includes(term) || choice.id.toLowerCase().includes(term));
}

async function createSearchableMultiSelect() {
  const { createPrompt, useState, useKeypress, useMemo, usePrefix, isEnterKey, isBackspaceKey, isUpKey, isDownKey } = await import('@inquirer/core');
  return createPrompt<string[], MultiSelectConfig>((config, done) => {
    const { message, choices, pageSize = 15, validate } = config;
    const [searchText, setSearchText] = useState('');
    const [selectedIds, setSelectedIds] = useState(() => initiallySelectedIds(choices));
    const [cursor, setCursor] = useState(0);
    const [status, setStatus] = useState<'idle' | 'done'>('idle');
    const [error, setError] = useState<string | null>(null);
    const prefix = usePrefix({ status });
    const filtered = useMemo(() => filterChoices(choices, searchText), [choices, searchText]);
    const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
    const choiceMap = useMemo(() => new Map(choices.map((choice) => [choice.id, choice])), [choices]);

    useKeypress((key) => {
      if (status === 'done') return;
      if (isEnterKey(key)) {
        const validation = validate?.(selectedIds) ?? true;
        if (validation !== true) { setError(typeof validation === 'string' ? validation : 'Invalid'); return; }
        setStatus('done'); done(selectedIds); return;
      }
      if (key.name === 'space') {
        const choice = filtered[cursor];
        if (!choice) return;
        setError(null);
        setSelectedIds(selected.has(choice.id) ? selectedIds.filter((id) => id !== choice.id) : [...selectedIds, choice.id]);
        return;
      }
      if (isBackspaceKey(key)) { setError(null); setSearchText(searchText.slice(0, -1)); setCursor(0); return; }
      if (isUpKey(key)) { setCursor(Math.max(0, cursor - 1)); return; }
      if (isDownKey(key)) { setCursor(Math.min(filtered.length - 1, cursor + 1)); return; }
      if (key.name && key.name.length === 1 && !key.ctrl) { setError(null); setSearchText(searchText + key.name); setCursor(0); }
    });

    if (status === 'done') return `${prefix} ${chalk.bold(message)} ${chalk.cyan(selectedIds.map((id) => choiceMap.get(id)?.name ?? id).join(', '))}`;
    const lines = [`${prefix} ${chalk.bold(message)}`];
    lines.push(`  Selected: ${selectedIds.length ? selectedIds.map((id) => chalk.bgCyan.black(` ${choiceMap.get(id)?.name ?? id} `)).join(' ') : chalk.dim('(none selected)')}`);
    lines.push(`  Search: ${chalk.yellow('[')}${searchText || chalk.dim('type to filter')}${chalk.yellow(']')}`);
    lines.push(`  ${chalk.cyan('↑↓')} navigate • ${chalk.cyan('Space')} toggle • ${chalk.cyan('Backspace')} remove • ${chalk.cyan('Enter')} confirm`);
    const start = Math.max(0, Math.min(cursor - Math.floor(pageSize / 2), filtered.length - pageSize));
    for (const [index, choice] of filtered.slice(start, start + pageSize).entries()) {
      const active = start + index === cursor;
      lines.push(`  ${active ? chalk.cyan('›') : ' '} ${selected.has(choice.id) ? chalk.green('◉') : chalk.dim('○')} ${active ? chalk.cyan(choice.name) : choice.name}${selected.has(choice.id) ? chalk.dim(' (selected)') : choice.detected ? chalk.dim(' (detected)') : ''}`);
    }
    if (!filtered.length) lines.push(chalk.yellow('  No matches'));
    if (error) lines.push(chalk.red(`  ${error}`));
    return lines.join('\n');
  });
}

export function isInteractiveCancel(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error ? String((error as { name?: unknown }).name) : '';
  const message = error instanceof Error ? error.message : String(error);
  return name === 'ExitPromptError' || /force closed the prompt/i.test(message);
}

export async function selectAgentsInteractively(choices: AgentChoice[]): Promise<string[]> {
  const prompt = await createSearchableMultiSelect();
  return prompt({ message: `Select Agent tools to set up (${choices.length} available)`, choices, pageSize: 15, validate: (ids) => ids.length > 0 || 'Select at least one Agent tool' });
}
