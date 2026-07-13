import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const PLATFORM_REGISTRY = {
  claude: {
    integrationTemplate: "platforms/claude",
    entryFile: "CLAUDE.md",
    runtimeSkillDirectory: ".claude/skills",
  },
  codex: {
    integrationTemplate: "platforms/codex",
    entryFile: "AGENTS.md",
    runtimeSkillDirectory: ".agents/skills",
  },
  cursor: {
    integrationTemplate: "platforms/cursor",
    entryFile: "AGENTS.md",
    runtimeSkillDirectory: ".agents/skills",
  },
  opencode: {
    integrationTemplate: "platforms/opencode",
    entryFile: "AGENTS.md",
    runtimeSkillDirectory: ".agents/skills",
  },
} as const;

export type Platform = keyof typeof PLATFORM_REGISTRY;

export interface ProjectFilesystem {
  exists(path: string): boolean;
  readText(path: string): string;
  ensureDirectory(path: string): void;
  writeText(path: string, text: string): void;
  copyDirectory(source: string, destination: string): void;
}

export interface ProjectOnboardingLifecycle {
  inspect(cwd: string): ProjectOnboardingInspection;
  initialize(input: InitializeProjectOnboardingInput): ProjectOnboardingInitialization;
}

export interface InitializeProjectOnboardingInput {
  cwd: string;
  pkgRoot: string;
  platforms: Platform[];
  version: string;
  installedAt: string;
}

export interface CompletedProjectOnboardingInitialization {
  status: "completed";
  installedPlatforms: Platform[];
  runtimeSkillDirectories: string[];
  actions: ProjectOnboardingInitializationAction[];
  preservedAssets: string[];
  warnings: Array<"legacy-state-promoted">;
}

export interface BlockedProjectOnboardingInitialization {
  status: "blocked";
  reason: "unsafe-installation-state";
  installationState: "malformed" | "invalid";
}

export interface FailedProjectOnboardingInitialization {
  status: "failed";
  reason: "filesystem-error";
  message: string;
  partialChanges: boolean;
  completedActions: ProjectOnboardingInitializationAction[];
  preservedAssets: string[];
  warnings: Array<"legacy-state-promoted">;
}

export type ProjectOnboardingInitialization =
  | CompletedProjectOnboardingInitialization
  | BlockedProjectOnboardingInitialization
  | FailedProjectOnboardingInitialization;

export type ProjectOnboardingInitializationAction =
  | { kind: "runtime-skills-installed"; directory: string }
  | { kind: "platform-integration-installed"; platform: Platform };

const AGGREGATION_DIRECTORIES = [
  "requirements", "roadmap", "features", "issues", "refactors", "brainstorms", "compound",
];

const ARCHITECTURE_TEMPLATE = `# 架构总入口

> 状态：骨架（待填充）
> 创建日期：${new Date().toISOString().slice(0, 10)}

## 1. 项目简介

## 2. 核心概念 / 术语表

## 3. 子系统 / 模块索引

## 4. 关键架构决定

## 5. 已知约束 / 硬边界
`;

const ATTENTION_TEMPLATE = `# Attention

本文件是 kflow 执行类技能启动前读取的短提醒清单。路由类技能只检查它是否存在；真正动手改代码 / 写文档前再读全文。

原则：一条一行，最多 50 条有效项目。详细背景请沉淀到 compound / architecture / requirement / feature / issue 文档，这里只保留短提醒和链接。

## 项目碎片知识

<!-- k-note managed: 用 k-note 维护，新条目按下面分节追加 -->

### 编译与构建

### 运行与本地起服务

### 测试

### 命令与脚本陷阱

### 路径与目录约定

### 环境变量与凭证

### 其他
`;

const nodeFilesystem: ProjectFilesystem = {
  exists: existsSync,
  readText: (path) => readFileSync(path, "utf-8"),
  ensureDirectory: (path) => mkdirSync(path, { recursive: true }),
  writeText: (path, text) => writeFileSync(path, text),
  copyDirectory: (source, destination) => cpSync(source, destination, { recursive: true }),
};

export interface AuthoritativeInstallationState {
  kind: "authoritative";
  platforms: Platform[];
  version: string;
}

export interface MalformedInstallationState {
  kind: "malformed";
  reason: "invalid-json";
}

export interface InvalidInstallationState {
  kind: "invalid";
  reason: "invalid-shape";
}

export interface InferredInstallationState {
  kind: "inferred";
  platforms: Platform[];
}

export interface AbsentInstallationState {
  kind: "absent";
}

export type InstallationState =
  | AuthoritativeInstallationState
  | MalformedInstallationState
  | InvalidInstallationState
  | InferredInstallationState
  | AbsentInstallationState;

export interface ProjectOnboardingInspection {
  installationState: InstallationState;
  health: ProjectOnboardingHealth;
}

export interface ProjectOnboardingHealth {
  structure: "healthy" | "missing";
  installedPlatforms: "healthy" | "missing";
  projectCliDependency: "healthy" | "missing";
  installationEvidence: "consistent" | "missing" | "unexpected" | "not-applicable";
}

export function createProjectOnboardingLifecycle(
  filesystem: ProjectFilesystem,
): ProjectOnboardingLifecycle {
  return {
    inspect: (cwd) => inspect(cwd, filesystem),
    initialize: (input) => initialize(input, filesystem),
  };
}

const defaultLifecycle = createProjectOnboardingLifecycle(nodeFilesystem);

export function inspectProjectOnboarding(cwd: string): ProjectOnboardingInspection {
  return defaultLifecycle.inspect(cwd);
}

export function initializeProjectOnboarding(
  input: InitializeProjectOnboardingInput,
): ProjectOnboardingInitialization {
  return defaultLifecycle.initialize(input);
}

function initialize(
  input: InitializeProjectOnboardingInput,
  filesystem: ProjectFilesystem,
): ProjectOnboardingInitialization {
  const { cwd, pkgRoot, platforms, version, installedAt } = input;
  const state = inspect(cwd, filesystem).installationState;
  if (state.kind === "malformed" || state.kind === "invalid") {
    return {
      status: "blocked",
      reason: "unsafe-installation-state",
      installationState: state.kind,
    };
  }

  const previous = state.kind === "authoritative"
    ? readPersistedEntries(cwd, filesystem)
    : state.kind === "inferred"
      ? state.platforms.map((name) => ({ name, installedAt }))
      : [];
  const actions: ProjectOnboardingInitializationAction[] = [];
  const preservedAssets: string[] = [];
  const warnings: Array<"legacy-state-promoted"> = state.kind === "inferred"
    ? ["legacy-state-promoted"]
    : [];
  let mutationStarted = false;

  try {
  mutationStarted = true;
  const kflowDir = join(cwd, ".kflow");
  filesystem.ensureDirectory(kflowDir);
  for (const directory of AGGREGATION_DIRECTORIES) {
    filesystem.ensureDirectory(join(kflowDir, directory));
  }
  filesystem.ensureDirectory(join(kflowDir, "architecture"));
  writeIfAbsent(
    join(kflowDir, "architecture", "ARCHITECTURE.md"),
    ARCHITECTURE_TEMPLATE,
    filesystem,
    preservedAssets,
  );
  writeIfAbsent(join(kflowDir, "attention.md"), ATTENTION_TEMPLATE, filesystem, preservedAssets);
  filesystem.copyDirectory(join(pkgRoot, "templates"), join(kflowDir, "reference"));
  filesystem.copyDirectory(join(pkgRoot, "tools"), join(kflowDir, "tools"));

  const runtimeSkillDirectories = [
    ...new Set(platforms.map((platform) => PLATFORM_REGISTRY[platform].runtimeSkillDirectory)),
  ];
  for (const directory of runtimeSkillDirectories) {
    filesystem.copyDirectory(join(pkgRoot, "skills"), join(cwd, directory));
    actions.push({ kind: "runtime-skills-installed", directory });
  }
  for (const platform of platforms) {
    filesystem.copyDirectory(join(pkgRoot, PLATFORM_REGISTRY[platform].integrationTemplate), cwd);
    actions.push({ kind: "platform-integration-installed", platform });
  }

  const existingNames = new Set(previous.map((entry) => entry.name));
  const entries = [
    ...previous,
    ...platforms.filter((name) => !existingNames.has(name)).map((name) => ({ name, installedAt })),
  ];
  filesystem.writeText(join(kflowDir, "meta.json"), JSON.stringify({ platforms: entries, version }, null, 2) + "\n");
  filesystem.writeText(join(cwd, "AGENTS.md"), generateAgentsEntry(entries.map((entry) => entry.name)));

  return {
    status: "completed",
    installedPlatforms: entries.map((entry) => entry.name),
    runtimeSkillDirectories,
    actions,
    preservedAssets,
    warnings,
  };
  } catch (error) {
    return {
      status: "failed",
      reason: "filesystem-error",
      message: error instanceof Error ? error.message : String(error),
      partialChanges: mutationStarted,
      completedActions: actions,
      preservedAssets,
      warnings,
    };
  }
}

function writeIfAbsent(
  path: string,
  content: string,
  filesystem: ProjectFilesystem,
  preservedAssets: string[],
): void {
  if (filesystem.exists(path)) {
    preservedAssets.push(path);
  } else {
    filesystem.writeText(path, content);
  }
}

function readPersistedEntries(
  cwd: string,
  filesystem: ProjectFilesystem,
): Array<{ name: Platform; installedAt: string }> {
  try {
    const data = JSON.parse(filesystem.readText(join(cwd, ".kflow", "meta.json"))) as {
      platforms?: Array<{ name: Platform; installedAt: string }>;
    };
    return isPersistedInstallationState(data) ? data.platforms : [];
  } catch {
    return [];
  }
}

function generateAgentsEntry(platforms: Platform[]): string {
  const list = platforms.length > 0
    ? platforms.map((platform) => `- **${platform}**`).join("\n")
    : "_(none — run `kflow init` again to add platforms)_";
  return `# AGENTS

kflow — AI coding workflow skill pack for serious engineering. Generated by kflow CLI.

## Installed Platforms

${list}

## Quick Start

Use \`/k-flow\` as the Skill Workflow entrypoint. The agent will route you to the right sub-skill.

\`\`\`
/k-flow    # Start here
\`\`\`

Runtime skills are installed in \`.agents/skills/\`.
`;
}

function inspect(cwd: string, filesystem: ProjectFilesystem): ProjectOnboardingInspection {
  const metaPath = join(cwd, ".kflow", "meta.json");
  if (!filesystem.exists(metaPath)) {
    return inspection(cwd, inferLegacyInstallationState(cwd, filesystem), filesystem);
  }
  let text: string;
  try {
    text = filesystem.readText(metaPath);
  } catch {
    return inspection(cwd, { kind: "malformed", reason: "invalid-json" }, filesystem);
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return inspection(cwd, { kind: "malformed", reason: "invalid-json" }, filesystem);
  }
  if (!isPersistedInstallationState(data)) {
    return inspection(cwd, { kind: "invalid", reason: "invalid-shape" }, filesystem);
  }

  return inspection(cwd, {
    kind: "authoritative",
    platforms: data.platforms.map((entry) => entry.name),
    version: data.version,
  }, filesystem);
}

function inspection(
  cwd: string,
  installationState: InstallationState,
  filesystem: ProjectFilesystem,
): ProjectOnboardingInspection {
  const structure = filesystem.exists(join(cwd, ".kflow"))
    && filesystem.exists(join(cwd, ".kflow", "reference"))
    && filesystem.exists(join(cwd, ".kflow", "tools"));
  const installedPlatforms = (installationState.kind === "authoritative"
    || installationState.kind === "inferred")
    && installationState.platforms.length > 0;

  let projectCliDependency = false;
  try {
    const pkg = JSON.parse(filesystem.readText(join(cwd, "package.json"))) as {
      devDependencies?: Record<string, unknown>;
    };
    projectCliDependency = Boolean(pkg.devDependencies?.kflow);
  } catch {
    projectCliDependency = false;
  }

  const installationEvidence = compareInstallationEvidence(cwd, installationState, filesystem);

  return {
    installationState,
    health: {
      structure: structure ? "healthy" : "missing",
      installedPlatforms: installedPlatforms ? "healthy" : "missing",
      projectCliDependency: projectCliDependency ? "healthy" : "missing",
      installationEvidence,
    },
  };
}

function inferLegacyInstallationState(
  cwd: string,
  filesystem: ProjectFilesystem,
): InferredInstallationState | AbsentInstallationState {
  const platforms: Platform[] = [];
  const marker = "Generated by kflow";
  const hasKflowEntry = (file: string): boolean => {
    const path = join(cwd, file);
    if (!filesystem.exists(path)) return false;
    try {
      return filesystem.readText(path).includes(marker);
    } catch {
      return false;
    }
  };

  if (hasKflowEntry("CLAUDE.md")) platforms.push("claude");
  if (hasKflowEntry("AGENTS.md")) platforms.push("codex", "cursor", "opencode");
  return platforms.length > 0 ? { kind: "inferred", platforms } : { kind: "absent" };
}

function compareInstallationEvidence(
  cwd: string,
  state: InstallationState,
  filesystem: ProjectFilesystem,
): ProjectOnboardingHealth["installationEvidence"] {
  if (state.kind !== "authoritative") return "not-applicable";
  const marker = "Generated by kflow";
  const isKflowEntry = (file: string): boolean => {
    const path = join(cwd, file);
    if (!filesystem.exists(path)) return false;
    try {
      return filesystem.readText(path).includes(marker);
    } catch {
      return false;
    }
  };
  const expectedFiles = new Set(state.platforms.map((platform) => PLATFORM_REGISTRY[platform].entryFile));
  const knownFiles = new Set(Object.values(PLATFORM_REGISTRY).map((platform) => platform.entryFile));
  const presentFiles = [...knownFiles].filter(isKflowEntry);
  if ([...expectedFiles].some((file) => !presentFiles.includes(file))) return "missing";
  if (presentFiles.some((file) => !expectedFiles.has(file))) return "unexpected";
  return "consistent";
}

function isPersistedInstallationState(
  value: unknown,
): value is { platforms: Array<{ name: Platform; installedAt: string }>; version: string } {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.version !== "string" || candidate.version.length === 0 || !Array.isArray(candidate.platforms)) {
    return false;
  }
  const names = new Set<string>();
  return candidate.platforms.every((entry) => {
    if (typeof entry !== "object" || entry === null) return false;
    const platform = entry as Record<string, unknown>;
    const valid = typeof platform.name === "string"
      && platform.name in PLATFORM_REGISTRY
      && typeof platform.installedAt === "string"
      && platform.installedAt.length > 0;
    if (!valid || names.has(platform.name as string)) return false;
    names.add(platform.name as string);
    return true;
  });
}
