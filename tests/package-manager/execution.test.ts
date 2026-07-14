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
