import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
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
export const ALL_PLATFORMS = Object.keys(PLATFORM_REGISTRY) as Platform[];

export function isPlatform(name: string): name is Platform {
  return (ALL_PLATFORMS as readonly string[]).includes(name);
}

// Frozen migration baseline: every Packaged Skill Asset shipped before
// Installation State began recording ownedSkills. Do not derive this from the
// current package; removed names must remain here as ownership tombstones.
const PRE_OWNERSHIP_SKILLS = [
  "browser-bridge", "k-arch", "k-audit", "k-brainstorm", "k-decide", "k-explore",
  "k-feat", "k-feat-accept", "k-feat-design", "k-feat-ff", "k-feat-impl", "k-flow",
  "k-guide", "k-issue", "k-issue-analyze", "k-issue-fix", "k-issue-report", "k-learn",
  "k-libdoc", "k-note", "k-onboard", "k-refactor", "k-refactor-ff", "k-req", "k-roadmap",
  "k-trick",
] as const;

export interface ProjectFilesystem {
  exists(path: string): boolean;
  readText(path: string): string;
  ensureDirectory(path: string): void;
  writeText(path: string, text: string): void;
  copyDirectory(source: string, destination: string): void;
  listDirectories(path: string): string[];
  listEntries(path: string): string[];
  removePath(path: string): void;
}

export interface ProjectOnboardingLifecycle {
  inspect(cwd: string): ProjectOnboardingInspection;
  initialize(input: InitializeProjectOnboardingInput): ProjectOnboardingInitialization;
  synchronize(input: SynchronizeProjectOnboardingInput): ProjectOnboardingSynchronization;
  removePlatforms(input: RemoveProjectOnboardingPlatformsInput): ProjectOnboardingRemoval;
  removeAllAssets(input: RemoveProjectOnboardingAssetsInput): ProjectOnboardingAssetRemoval;
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

export interface SynchronizeProjectOnboardingInput {
  cwd: string;
  pkgRoot: string;
}

export type ProjectOnboardingSynchronization =
  | {
      status: "completed";
      runtimeSkillDirectories: string[];
      actions: ProjectOnboardingSynchronizationAction[];
      warnings: Array<"legacy-inferred-state" | "legacy-default-runtime">;
    }
  | {
      status: "blocked";
      reason: "unsafe-installation-state";
      installationState: "malformed" | "invalid";
    }
  | {
      status: "failed";
      reason: "filesystem-error";
      message: string;
      partialChanges: boolean;
      completedActions: ProjectOnboardingSynchronizationAction[];
      warnings: Array<"legacy-inferred-state" | "legacy-default-runtime">;
    };

export type ProjectOnboardingSynchronizationAction =
  | { kind: "skill-mirrored"; directory: string; skill: string }
  | { kind: "skill-removed"; directory: string; skill: string }
  | { kind: "owned-directory-mirrored"; directory: ".kflow/reference" | ".kflow/tools" };

export interface RemoveProjectOnboardingPlatformsInput {
  cwd: string;
  platforms: Platform[];
  apply?: boolean;
}

export type ProjectOnboardingRemovalAction =
  | { kind: "entry-file-removed"; file: string }
  | { kind: "entry-file-preserved"; file: string; reason: "shared" | "user-owned" }
  | { kind: "skill-removed"; directory: string; skill: string }
  | { kind: "runtime-directory-removed"; directory: string }
  | { kind: "runtime-directory-preserved"; directory: string; reason: "shared" }
  | { kind: "parent-directory-preserved"; directory: string; reason: "non-kflow-content" };

export type ProjectOnboardingRemoval =
  | {
      status: "completed";
      removedPlatforms: Platform[];
      remainingPlatforms: Platform[];
      actions: ProjectOnboardingRemovalAction[];
      warnings: Array<"legacy-state-not-persisted">;
    }
  | {
      status: "blocked";
      reason: "unsafe-installation-state";
      installationState: "malformed" | "invalid";
    }
  | {
      status: "failed";
      reason: "filesystem-error";
      message: string;
      partialChanges: boolean;
      completedActions: ProjectOnboardingRemovalAction[];
    };

export interface RemoveProjectOnboardingAssetsInput {
  cwd: string;
  apply?: boolean;
}

export type ProjectOnboardingAssetRemoval =
  | {
      status: "completed";
      actions: ProjectOnboardingRemovalAction[];
      projectKnowledgeRemoved: boolean;
      warnings: Array<"unsafe-state-used-baseline">;
    }
  | {
      status: "failed";
      reason: "filesystem-error";
      message: string;
      partialChanges: boolean;
      completedActions: ProjectOnboardingRemovalAction[];
    };

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
  listDirectories: (path) => readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name),
  listEntries: (path) => readdirSync(path),
  removePath: (path) => rmSync(path, { recursive: true, force: true }),
};

export interface AuthoritativeInstallationState {
  kind: "authoritative";
  platforms: Platform[];
  version: string;
  ownedSkills: string[];
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
    synchronize: (input) => synchronize(input, filesystem),
    removePlatforms: (input) => removePlatforms(input, filesystem),
    removeAllAssets: (input) => removeAllAssets(input, filesystem),
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

export function synchronizeProjectOnboarding(
  input: SynchronizeProjectOnboardingInput,
): ProjectOnboardingSynchronization {
  return defaultLifecycle.synchronize(input);
}

export function removeProjectOnboardingPlatforms(
  input: RemoveProjectOnboardingPlatformsInput,
): ProjectOnboardingRemoval {
  return defaultLifecycle.removePlatforms(input);
}

export function removeProjectOnboardingAssets(
  input: RemoveProjectOnboardingAssetsInput,
): ProjectOnboardingAssetRemoval {
  return defaultLifecycle.removeAllAssets(input);
}

function removeAllAssets(
  input: RemoveProjectOnboardingAssetsInput,
  filesystem: ProjectFilesystem,
): ProjectOnboardingAssetRemoval {
  const { cwd, apply = true } = input;
  const state = inspect(cwd, filesystem).installationState;
  const ownedSkills = state.kind === "authoritative" ? state.ownedSkills : [...PRE_OWNERSHIP_SKILLS];
  const warnings: Array<"unsafe-state-used-baseline"> = state.kind === "malformed" || state.kind === "invalid"
    ? ["unsafe-state-used-baseline"]
    : [];
  const actions: ProjectOnboardingRemovalAction[] = [];
  let mutationStarted = false;

  try {
    const runtimeDirectories = [...new Set(
      Object.values(PLATFORM_REGISTRY).map((platform) => platform.runtimeSkillDirectory),
    )];
    for (const directory of runtimeDirectories) {
      for (const skill of ownedSkills) {
        const skillPath = join(cwd, directory, skill);
        if (!filesystem.exists(skillPath)) continue;
        if (apply) {
          mutationStarted = true;
          filesystem.removePath(skillPath);
        }
        actions.push({ kind: "skill-removed", directory, skill });
      }
      pruneRuntimeDirectories(cwd, directory, filesystem, actions, apply, apply ? [] : ownedSkills);
    }

    const entryFiles = [...new Set(
      Object.values(PLATFORM_REGISTRY).map((platform) => platform.entryFile),
    )];
    for (const file of entryFiles) {
      const path = join(cwd, file);
      if (isKflowOwnedEntryFile(path, filesystem)) {
        if (apply) filesystem.removePath(path);
        actions.push({ kind: "entry-file-removed", file });
      } else if (filesystem.exists(path)) {
        actions.push({ kind: "entry-file-preserved", file, reason: "user-owned" });
      }
    }

    const projectKnowledgePath = join(cwd, ".kflow");
    const projectKnowledgeRemoved = filesystem.exists(projectKnowledgePath);
    if (apply && projectKnowledgeRemoved) {
      filesystem.removePath(projectKnowledgePath);
    }
    return { status: "completed", actions, projectKnowledgeRemoved, warnings };
  } catch (error) {
    return {
      status: "failed",
      reason: "filesystem-error",
      message: error instanceof Error ? error.message : String(error),
      partialChanges: mutationStarted,
      completedActions: actions,
    };
  }
}

function removePlatforms(
  input: RemoveProjectOnboardingPlatformsInput,
  filesystem: ProjectFilesystem,
): ProjectOnboardingRemoval {
  const { cwd, platforms, apply = true } = input;
  const state = inspect(cwd, filesystem).installationState;
  if (state.kind === "malformed" || state.kind === "invalid") {
    return {
      status: "blocked",
      reason: "unsafe-installation-state",
      installationState: state.kind,
    };
  }

  const installed = state.kind === "absent" ? [] : state.platforms;
  const removing = new Set(platforms.filter((platform) => installed.includes(platform)));
  const remaining = installed.filter((platform) => !removing.has(platform));
  const ownedSkills = state.kind === "authoritative" ? state.ownedSkills : [...PRE_OWNERSHIP_SKILLS];
  const actions: ProjectOnboardingRemovalAction[] = [];
  const processedEntryFiles = new Set<string>();
  const processedRuntimeDirectories = new Set<string>();
  let mutationStarted = false;

  try {
    for (const platform of removing) {
      const target = PLATFORM_REGISTRY[platform];
      const entryShared = remaining.some(
        (other) => PLATFORM_REGISTRY[other].entryFile === target.entryFile,
      );
      if (!processedEntryFiles.has(target.entryFile)) {
        if (entryShared) {
          actions.push({ kind: "entry-file-preserved", file: target.entryFile, reason: "shared" });
        } else {
          const entryPath = join(cwd, target.entryFile);
          if (isKflowOwnedEntryFile(entryPath, filesystem)) {
            if (apply) {
              mutationStarted = true;
              filesystem.removePath(entryPath);
            }
            actions.push({ kind: "entry-file-removed", file: target.entryFile });
          } else if (filesystem.exists(entryPath)) {
            actions.push({ kind: "entry-file-preserved", file: target.entryFile, reason: "user-owned" });
          }
        }
        processedEntryFiles.add(target.entryFile);
      }

      const runtimeShared = remaining.some(
        (other) => PLATFORM_REGISTRY[other].runtimeSkillDirectory === target.runtimeSkillDirectory,
      );
      if (processedRuntimeDirectories.has(target.runtimeSkillDirectory)) {
        continue;
      } else if (runtimeShared) {
        actions.push({
          kind: "runtime-directory-preserved",
          directory: target.runtimeSkillDirectory,
          reason: "shared",
        });
      } else {
        for (const skill of ownedSkills) {
          const skillPath = join(cwd, target.runtimeSkillDirectory, skill);
          if (!filesystem.exists(skillPath)) continue;
          if (apply) {
            mutationStarted = true;
            filesystem.removePath(skillPath);
          }
          actions.push({ kind: "skill-removed", directory: target.runtimeSkillDirectory, skill });
        }
        pruneRuntimeDirectories(
          cwd,
          target.runtimeSkillDirectory,
          filesystem,
          actions,
          apply,
          apply ? [] : ownedSkills,
        );
      }
      processedRuntimeDirectories.add(target.runtimeSkillDirectory);
    }

    if (apply && state.kind === "authoritative") {
      const entries = readPersistedEntries(cwd, filesystem)
        .filter((entry) => !removing.has(entry.name));
      filesystem.writeText(join(cwd, ".kflow", "meta.json"), JSON.stringify({
        platforms: entries,
        version: state.version,
        ownedSkills: state.ownedSkills,
      }, null, 2) + "\n");
    }

    return {
      status: "completed",
      removedPlatforms: [...removing],
      remainingPlatforms: remaining,
      actions,
      warnings: state.kind === "inferred" ? ["legacy-state-not-persisted"] : [],
    };
  } catch (error) {
    return {
      status: "failed",
      reason: "filesystem-error",
      message: error instanceof Error ? error.message : String(error),
      partialChanges: mutationStarted,
      completedActions: actions,
    };
  }
}

function isKflowOwnedEntryFile(path: string, filesystem: ProjectFilesystem): boolean {
  if (!filesystem.exists(path)) return false;
  try {
    return filesystem.readText(path).includes("Generated by kflow");
  } catch {
    return false;
  }
}

function pruneRuntimeDirectories(
  cwd: string,
  directory: string,
  filesystem: ProjectFilesystem,
  actions: ProjectOnboardingRemovalAction[],
  apply = true,
  plannedRemovedEntries: string[] = [],
): void {
  const runtimePath = join(cwd, directory);
  const runtimeWillBeEmpty = filesystem.exists(runtimePath)
    && filesystem.listEntries(runtimePath)
      .filter((entry) => !plannedRemovedEntries.includes(entry)).length === 0;
  if (runtimeWillBeEmpty) {
    if (apply) filesystem.removePath(runtimePath);
    actions.push({ kind: "runtime-directory-removed", directory });
  }

  const parentDirectory = directory.split("/")[0];
  const parentPath = join(cwd, parentDirectory);
  if (!filesystem.exists(parentPath)) return;
  const runtimeName = directory.split("/").at(-1);
  const parentEntries = filesystem.listEntries(parentPath)
    .filter((entry) => !(runtimeWillBeEmpty && entry === runtimeName));
  if (parentEntries.length === 0) {
    if (apply) filesystem.removePath(parentPath);
  } else {
    actions.push({ kind: "parent-directory-preserved", directory: parentDirectory, reason: "non-kflow-content" });
  }
}

function synchronize(
  input: SynchronizeProjectOnboardingInput,
  filesystem: ProjectFilesystem,
): ProjectOnboardingSynchronization {
  const { cwd, pkgRoot } = input;
  const state = inspect(cwd, filesystem).installationState;
  if (state.kind === "malformed" || state.kind === "invalid") {
    return {
      status: "blocked",
      reason: "unsafe-installation-state",
      installationState: state.kind,
    };
  }

  const warnings: Array<"legacy-inferred-state" | "legacy-default-runtime"> = [];
  let runtimeSkillDirectories: string[];
  if (state.kind === "absent") {
    runtimeSkillDirectories = [".agents/skills"];
    warnings.push("legacy-default-runtime");
  } else {
    runtimeSkillDirectories = [
      ...new Set(state.platforms.map((platform) => PLATFORM_REGISTRY[platform].runtimeSkillDirectory)),
    ];
    if (state.kind === "inferred") warnings.push("legacy-inferred-state");
  }

  const actions: ProjectOnboardingSynchronizationAction[] = [];
  let mutationStarted = false;
  try {
    const skills = filesystem.listDirectories(join(pkgRoot, "skills"));
    for (const directory of runtimeSkillDirectories) {
      for (const skill of state.kind === "authoritative" ? state.ownedSkills : []) {
        if (skills.includes(skill)) continue;
        mutationStarted = true;
        filesystem.removePath(join(cwd, directory, skill));
        actions.push({ kind: "skill-removed", directory, skill });
      }
      for (const skill of skills) {
        mutationStarted = true;
        filesystem.removePath(join(cwd, directory, skill));
        filesystem.copyDirectory(join(pkgRoot, "skills", skill), join(cwd, directory, skill));
        actions.push({ kind: "skill-mirrored", directory, skill });
      }
    }

    for (const [source, directory] of [
      ["templates", ".kflow/reference"],
      ["tools", ".kflow/tools"],
    ] as const) {
      mutationStarted = true;
      filesystem.removePath(join(cwd, directory));
      filesystem.copyDirectory(join(pkgRoot, source), join(cwd, directory));
      actions.push({ kind: "owned-directory-mirrored", directory });
    }

    if (state.kind === "authoritative") {
      filesystem.writeText(join(cwd, ".kflow", "meta.json"), JSON.stringify({
        platforms: readPersistedEntries(cwd, filesystem),
        version: state.version,
        ownedSkills: skills,
      }, null, 2) + "\n");
    }

    return { status: "completed", runtimeSkillDirectories, actions, warnings };
  } catch (error) {
    return {
      status: "failed",
      reason: "filesystem-error",
      message: error instanceof Error ? error.message : String(error),
      partialChanges: mutationStarted,
      completedActions: actions,
      warnings,
    };
  }
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
  const ownedSkills = filesystem.listDirectories(join(pkgRoot, "skills"));
  filesystem.writeText(
    join(kflowDir, "meta.json"),
    JSON.stringify({ platforms: entries, version, ownedSkills }, null, 2) + "\n",
  );
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
    ownedSkills: data.ownedSkills ?? [...PRE_OWNERSHIP_SKILLS],
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
): value is {
  platforms: Array<{ name: Platform; installedAt: string }>;
  version: string;
  ownedSkills?: string[];
} {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.version !== "string" || candidate.version.length === 0 || !Array.isArray(candidate.platforms)) {
    return false;
  }
  if (candidate.ownedSkills !== undefined) {
    if (!Array.isArray(candidate.ownedSkills)
      || candidate.ownedSkills.some((skill) => !isSafeSkillDirectoryName(skill))
      || new Set(candidate.ownedSkills).size !== candidate.ownedSkills.length) {
      return false;
    }
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

function isSafeSkillDirectoryName(value: unknown): value is string {
  return typeof value === "string"
    && value.length > 0
    && value !== "."
    && value !== ".."
    && !value.includes("/")
    && !value.includes("\\");
}
