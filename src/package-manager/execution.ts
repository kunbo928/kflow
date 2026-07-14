import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

export type PackageManager = "pnpm" | "yarn" | "bun" | "npm";

export interface PackageManagerFilesystem {
  exists(path: string): boolean;
}

export interface PackageManagerProcess {
  run(command: string, cwd: string, step: "install" | "synchronize"): number;
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

export type PackageUpgradeResult =
  | { status: "completed"; completedSteps: ["install", "synchronize"] }
  | { status: "install-failed"; exitCode: number; completedSteps: [] }
  | { status: "synchronize-failed"; exitCode: number; completedSteps: ["install"]; retryCommand: string };

export interface PackageManagerExecution {
  planUpgrade(input: { cwd: string; target: string }): PackageUpgradePlan;
  executeUpgrade(input: {
    cwd: string;
    plan: PackageUpgradePlan;
    onStepStart?: (step: "install" | "synchronize", command: string) => void;
  }): PackageUpgradeResult;
}

const commands: Record<PackageManager, {
  install(target: string): string;
  synchronize: string;
}> = {
  pnpm: { install: (target) => `pnpm add -D kflow@${target}`, synchronize: "pnpm exec kflow sync" },
  yarn: { install: (target) => `yarn add -D kflow@${target}`, synchronize: "yarn kflow sync" },
  bun: { install: (target) => `bun add -d kflow@${target}`, synchronize: "bunx kflow sync" },
  npm: { install: (target) => `npm install --save-dev kflow@${target}`, synchronize: "npx kflow sync" },
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
        : "KFLOW_UPGRADE_SYNC_CMD";
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

export function executePackageUpgrade(input: {
  cwd: string;
  plan: PackageUpgradePlan;
  onStepStart?: (step: "install" | "synchronize", command: string) => void;
}): PackageUpgradeResult {
  return defaultExecution.executeUpgrade(input);
}
