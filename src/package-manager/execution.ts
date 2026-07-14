import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

export type PackageManager = "pnpm" | "yarn" | "bun" | "npm";

export interface PackageManagerFilesystem {
  exists(path: string): boolean;
}

export interface PackageManagerProcess {
  run(command: string, cwd: string, step: "install" | "synchronize" | "remove"): number;
}

export interface PackageManagerStep {
  command: string;
}

export interface PackageUpgradePlan {
  packageManager: PackageManager;
  target: string;
  install: PackageManagerStep;
  synchronize: PackageManagerStep;
}

export interface PackageRemovalPlan {
  packageManager: PackageManager;
  remove: PackageManagerStep;
}

export type PackageUpgradeResult =
  | { status: "completed"; completedSteps: ["install", "synchronize"] }
  | { status: "install-failed"; exitCode: number; completedSteps: [] }
  | { status: "synchronize-failed"; exitCode: number; completedSteps: ["install"]; retryCommand: string };

export type ProjectAssetRemovalOutcome =
  | { status: "completed" }
  | { status: "failed"; message: string };

export type FullUninstallResult<AssetRemoval extends ProjectAssetRemovalOutcome> =
  | {
      status: "completed";
      completedSteps: ["package-removal", "asset-removal"];
      assetRemoval: Extract<AssetRemoval, { status: "completed" }>;
    }
  | {
      status: "package-removal-failed";
      exitCode: number;
      completedSteps: [];
      retry: { step: "package-removal" };
    }
  | {
      status: "asset-removal-failed";
      completedSteps: ["package-removal"];
      assetRemoval: Extract<AssetRemoval, { status: "failed" }>;
      retry: { step: "asset-removal"; packageRemovalRequired: false };
    };

export interface PackageManagerExecution {
  planUpgrade(input: { cwd: string; target: string }): PackageUpgradePlan;
  planRemoval(input: { cwd: string }): PackageRemovalPlan;
  executeUpgrade(input: {
    cwd: string;
    plan: PackageUpgradePlan;
    onStepStart?: (step: "install" | "synchronize", command: string) => void;
  }): PackageUpgradeResult;
  executeFullUninstall<AssetRemoval extends ProjectAssetRemovalOutcome>(input: {
    cwd: string;
    plan: PackageRemovalPlan;
    removeAssets: () => AssetRemoval;
    onStepStart?: (command: string) => void;
  }): FullUninstallResult<AssetRemoval>;
}

const commands: Record<PackageManager, {
  install(target: string): string;
  synchronize: string;
  remove: string;
}> = {
  pnpm: { install: (target) => `pnpm add -D kflow@${target}`, synchronize: "pnpm exec kflow sync", remove: "pnpm remove kflow" },
  yarn: { install: (target) => `yarn add -D kflow@${target}`, synchronize: "yarn kflow sync", remove: "yarn remove kflow" },
  bun: { install: (target) => `bun add -d kflow@${target}`, synchronize: "bunx kflow sync", remove: "bun remove kflow" },
  npm: { install: (target) => `npm install --save-dev kflow@${target}`, synchronize: "npx kflow sync", remove: "npm uninstall kflow" },
};

export function createPackageManagerExecution(adapters: {
  filesystem: PackageManagerFilesystem;
  process: PackageManagerProcess;
}): PackageManagerExecution {
  return {
    planUpgrade: ({ cwd, target }) => {
      const packageManager = detectPackageManager(cwd, adapters.filesystem);
      const command = commands[packageManager];
      return {
        packageManager,
        target,
        install: {
          command: command.install(target),
        },
        synchronize: {
          command: command.synchronize,
        },
      };
    },
    planRemoval: ({ cwd }) => {
      const packageManager = detectPackageManager(cwd, adapters.filesystem);
      return {
        packageManager,
        remove: { command: commands[packageManager].remove },
      };
    },
    executeUpgrade: ({ cwd, plan, onStepStart }) => {
      onStepStart?.("install", plan.install.command);
      const installExit = adapters.process.run(
        plan.install.command,
        cwd,
        "install",
      );
      if (installExit !== 0) {
        return { status: "install-failed", exitCode: installExit, completedSteps: [] };
      }

      onStepStart?.("synchronize", plan.synchronize.command);
      const synchronizeExit = adapters.process.run(
        plan.synchronize.command,
        cwd,
        "synchronize",
      );
      if (synchronizeExit !== 0) {
        return {
          status: "synchronize-failed",
          exitCode: synchronizeExit,
          completedSteps: ["install"],
          retryCommand: plan.synchronize.command,
        };
      }
      return { status: "completed", completedSteps: ["install", "synchronize"] };
    },
    executeFullUninstall: ({ cwd, plan, removeAssets, onStepStart }) => {
      onStepStart?.(plan.remove.command);
      const removalExit = adapters.process.run(plan.remove.command, cwd, "remove");
      if (removalExit !== 0) {
        return {
          status: "package-removal-failed",
          exitCode: removalExit,
          completedSteps: [],
          retry: { step: "package-removal" },
        };
      }

      const assetRemoval = removeAssets();
      if (assetRemoval.status === "failed") {
        return {
          status: "asset-removal-failed",
          completedSteps: ["package-removal"],
          assetRemoval: assetRemoval as Extract<typeof assetRemoval, { status: "failed" }>,
          retry: { step: "asset-removal", packageRemovalRequired: false },
        };
      }
      return {
        status: "completed",
        completedSteps: ["package-removal", "asset-removal"],
        assetRemoval: assetRemoval as Extract<typeof assetRemoval, { status: "completed" }>,
      };
    },
  };
}

function detectPackageManager(cwd: string, filesystem: PackageManagerFilesystem): PackageManager {
  if (filesystem.exists(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (filesystem.exists(join(cwd, "yarn.lock"))) return "yarn";
  if (filesystem.exists(join(cwd, "bun.lockb"))) return "bun";
  if (filesystem.exists(join(cwd, "bun.lock"))) return "bun";
  if (filesystem.exists(join(cwd, "package-lock.json"))) return "npm";
  return "npm";
}

const defaultExecution = createPackageManagerExecution({
  filesystem: { exists: existsSync },
  process: {
    run: (command, cwd, step) => {
      const environmentOverride = step === "install"
        ? "KFLOW_UPGRADE_INSTALL_CMD"
        : step === "synchronize"
          ? "KFLOW_UPGRADE_SYNC_CMD"
          : "KFLOW_UNINSTALL_REMOVE_CMD";
      const result = spawnSync(process.env[environmentOverride] ?? command, [], {
        cwd,
        shell: true,
        stdio: "inherit",
      });
      return result.status ?? 1;
    },
  },
});

export function planPackageUpgrade(input: { cwd: string; target: string }): PackageUpgradePlan {
  return defaultExecution.planUpgrade(input);
}

export function planPackageRemoval(input: { cwd: string }): PackageRemovalPlan {
  return defaultExecution.planRemoval(input);
}

export function executePackageUpgrade(input: {
  cwd: string;
  plan: PackageUpgradePlan;
  onStepStart?: (step: "install" | "synchronize", command: string) => void;
}): PackageUpgradeResult {
  return defaultExecution.executeUpgrade(input);
}

export function executeFullUninstall<AssetRemoval extends ProjectAssetRemovalOutcome>(input: {
  cwd: string;
  plan: PackageRemovalPlan;
  removeAssets: () => AssetRemoval;
  onStepStart?: (command: string) => void;
}): FullUninstallResult<AssetRemoval> {
  return defaultExecution.executeFullUninstall(input);
}
