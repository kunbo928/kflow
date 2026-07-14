import { describe, expect, it } from "vitest";
import { createPackageManagerExecution } from "../../src/package-manager/execution";

describe("Package Manager execution", () => {
  it("plans npm installation and upgraded-CLI synchronization as the fallback", () => {
    const execution = createPackageManagerExecution({
      filesystem: { exists: () => false },
      process: { run: () => 0 },
    });

    expect(execution.planUpgrade({ cwd: "/project", target: "latest" })).toEqual({
      packageManager: "npm",
      target: "latest",
      install: {
        command: "npm install --save-dev kflow@latest",
      },
      synchronize: {
        command: "npx kflow sync",
      },
    });
  });

  it("plans npm package removal through the same fallback selection", () => {
    const execution = createPackageManagerExecution({
      filesystem: { exists: () => false },
      process: { run: () => 0 },
    });

    expect(execution.planRemoval({ cwd: "/project" })).toEqual({
      packageManager: "npm",
      remove: { command: "npm uninstall kflow" },
    });
  });

  it.each([
    ["pnpm-lock.yaml", "pnpm", "pnpm remove kflow"],
    ["yarn.lock", "yarn", "yarn remove kflow"],
    ["bun.lockb", "bun", "bun remove kflow"],
    ["bun.lock", "bun", "bun remove kflow"],
    ["package-lock.json", "npm", "npm uninstall kflow"],
  ])("plans removal for %s", (lockfile, packageManager, command) => {
    const execution = createPackageManagerExecution({
      filesystem: { exists: (path) => path === `/project/${lockfile}` },
      process: { run: () => 0 },
    });

    expect(execution.planRemoval({ cwd: "/project" })).toEqual({
      packageManager,
      remove: { command },
    });
  });

  it("removes the package before invoking asset removal exactly once", () => {
    const processCalls: string[] = [];
    let assetCalls = 0;
    const execution = createPackageManagerExecution({
      filesystem: { exists: () => false },
      process: {
        run: (command) => {
          processCalls.push(command);
          return 0;
        },
      },
    });
    const plan = execution.planRemoval({ cwd: "/project" });

    expect(execution.executeFullUninstall({
      cwd: "/project",
      plan,
      removeAssets: () => {
        assetCalls += 1;
        return { status: "completed" as const };
      },
    })).toEqual({
      status: "completed",
      completedSteps: ["package-removal", "asset-removal"],
      assetRemoval: { status: "completed" },
    });
    expect(processCalls).toEqual(["npm uninstall kflow"]);
    expect(assetCalls).toBe(1);
  });

  it("skips asset removal when package removal fails", () => {
    let assetCalls = 0;
    const execution = createPackageManagerExecution({
      filesystem: { exists: () => false },
      process: { run: () => 7 },
    });
    const plan = execution.planRemoval({ cwd: "/project" });

    expect(execution.executeFullUninstall({
      cwd: "/project",
      plan,
      removeAssets: () => {
        assetCalls += 1;
        return { status: "completed" as const };
      },
    })).toEqual({
      status: "package-removal-failed",
      exitCode: 7,
      completedSteps: [],
      retry: { step: "package-removal" },
    });
    expect(assetCalls).toBe(0);
  });

  it("reports partial uninstall without repeating package removal after asset failure", () => {
    const processCalls: string[] = [];
    let assetCalls = 0;
    const execution = createPackageManagerExecution({
      filesystem: { exists: () => false },
      process: {
        run: (command) => {
          processCalls.push(command);
          return 0;
        },
      },
    });
    const plan = execution.planRemoval({ cwd: "/project" });

    expect(execution.executeFullUninstall({
      cwd: "/project",
      plan,
      removeAssets: () => {
        assetCalls += 1;
        return { status: "failed" as const, message: "disk full" };
      },
    })).toEqual({
      status: "asset-removal-failed",
      completedSteps: ["package-removal"],
      assetRemoval: { status: "failed", message: "disk full" },
      retry: { step: "asset-removal", packageRemovalRequired: false },
    });
    expect(processCalls).toEqual(["npm uninstall kflow"]);
    expect(assetCalls).toBe(1);
  });

  it.each([
    {
      name: "pnpm precedence",
      files: ["/project/pnpm-lock.yaml", "/project/yarn.lock", "/project/package-lock.json"],
      packageManager: "pnpm",
      install: "pnpm add -D kflow@next",
      synchronize: "pnpm exec kflow sync",
    },
    {
      name: "yarn precedence",
      files: ["/project/yarn.lock", "/project/bun.lockb", "/project/package-lock.json"],
      packageManager: "yarn",
      install: "yarn add -D kflow@next",
      synchronize: "yarn kflow sync",
    },
    {
      name: "bun.lockb",
      files: ["/project/bun.lockb", "/project/package-lock.json"],
      packageManager: "bun",
      install: "bun add -d kflow@next",
      synchronize: "bunx kflow sync",
    },
    {
      name: "bun.lock",
      files: ["/project/bun.lock"],
      packageManager: "bun",
      install: "bun add -d kflow@next",
      synchronize: "bunx kflow sync",
    },
    {
      name: "npm lockfile",
      files: ["/project/package-lock.json"],
      packageManager: "npm",
      install: "npm install --save-dev kflow@next",
      synchronize: "npx kflow sync",
    },
  ])("plans $name through one precedence and command table", ({
    files, packageManager, install, synchronize,
  }) => {
    const execution = createPackageManagerExecution({
      filesystem: { exists: (path) => files.includes(path) },
      process: { run: () => 0 },
    });

    expect(execution.planUpgrade({ cwd: "/project", target: "next" })).toMatchObject({
      packageManager,
      install: { command: install },
      synchronize: { command: synchronize },
    });
  });

  it("executes package installation before upgraded-CLI synchronization", () => {
    const calls: Array<{ command: string; cwd: string; step: string }> = [];
    const execution = createPackageManagerExecution({
      filesystem: { exists: () => false },
      process: {
        run: (command, cwd, step) => {
          calls.push({ command, cwd, step });
          return 0;
        },
      },
    });
    const plan = execution.planUpgrade({ cwd: "/project", target: "2.1.0" });

    expect(execution.executeUpgrade({ cwd: "/project", plan })).toEqual({
      status: "completed",
      completedSteps: ["install", "synchronize"],
    });
    expect(calls).toEqual([
      {
        command: "npm install --save-dev kflow@2.1.0",
        cwd: "/project",
        step: "install",
      },
      {
        command: "npx kflow sync",
        cwd: "/project",
        step: "synchronize",
      },
    ]);
  });

  it("stops before synchronization when package installation fails", () => {
    const calls: string[] = [];
    const execution = createPackageManagerExecution({
      filesystem: { exists: () => false },
      process: {
        run: (command) => {
          calls.push(command);
          return 7;
        },
      },
    });
    const plan = execution.planUpgrade({ cwd: "/project", target: "latest" });

    expect(execution.executeUpgrade({ cwd: "/project", plan })).toEqual({
      status: "install-failed",
      exitCode: 7,
      completedSteps: [],
    });
    expect(calls).toEqual(["npm install --save-dev kflow@latest"]);
  });

  it("reports partial success and retry command when synchronization fails", () => {
    const exits = [0, 9];
    const calls: string[] = [];
    const execution = createPackageManagerExecution({
      filesystem: { exists: (path) => path.endsWith("pnpm-lock.yaml") },
      process: {
        run: (command) => {
          calls.push(command);
          return exits.shift() ?? 1;
        },
      },
    });
    const plan = execution.planUpgrade({ cwd: "/project", target: "latest" });

    expect(execution.executeUpgrade({ cwd: "/project", plan })).toEqual({
      status: "synchronize-failed",
      exitCode: 9,
      completedSteps: ["install"],
      retryCommand: "pnpm exec kflow sync",
    });
    expect(calls).toEqual([
      "pnpm add -D kflow@latest",
      "pnpm exec kflow sync",
    ]);
  });
});
