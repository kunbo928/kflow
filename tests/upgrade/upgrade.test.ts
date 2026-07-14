import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tempProject } from "../cli-helpers/temp";
import { run } from "../cli-helpers/run";

describe("kflow upgrade", () => {
  let cwd: string;

  beforeEach(() => {
    cwd = tempProject();
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  function upgrade(
    args: string[] = [],
    env?: Record<string, string>,
  ): { stdout: string; exitCode: number } {
    return run(["upgrade", ...args], cwd, env);
  }

  it("renders the npm fallback plan and accepts an explicit target", () => {
    const { stdout, exitCode } = upgrade(["2.1.0"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Package manager : npm");
    expect(stdout).toContain("Target          : 2.1.0");
    expect(stdout).toContain("Install command : npm install --save-dev kflow@2.1.0");
    expect(stdout).toContain("Sync command    : npx kflow sync");
  });

  it("does not mutate project files in dry-run mode", () => {
    const packagePath = join(cwd, "package.json");
    writeFileSync(packagePath, JSON.stringify({ name: "test", version: "1.0.0" }));
    const before = readFileSync(packagePath, "utf-8");

    const { exitCode } = upgrade();

    expect(exitCode).toBe(0);
    expect(readFileSync(packagePath, "utf-8")).toBe(before);
    expect(existsSync(join(cwd, ".kflow"))).toBe(false);
  });

  it("renders and executes package installation before upgraded-CLI synchronization", () => {
    const logPath = join(cwd, "upgrade.log");
    const stub = join(cwd, "stub.mjs");
    writeFileSync(stub, `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, process.env.STUB_MARKER + "\\n");
process.exit(0);`);

    const { stdout, exitCode } = upgrade(["--apply"], {
      KFLOW_UPGRADE_INSTALL_CMD: `STUB_MARKER=install node ${stub}`,
      KFLOW_UPGRADE_SYNC_CMD: `STUB_MARKER=sync node ${stub}`,
    });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Installing package : npm install --save-dev kflow@latest");
    expect(stdout).toContain("Running upgraded-CLI sync : npx kflow sync");
    expect(readFileSync(logPath, "utf-8").trim().split("\n")).toEqual(["install", "sync"]);
  });

  it("reports install failure and does not start synchronization", () => {
    const logPath = join(cwd, "upgrade.log");
    const installStub = join(cwd, "install.mjs");
    const syncStub = join(cwd, "sync.mjs");
    writeFileSync(installStub, `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, "install-fail\\n");
process.exit(7);`);
    writeFileSync(syncStub, `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, "sync-should-not-run\\n");
process.exit(0);`);

    const { stdout, exitCode } = upgrade(["--apply"], {
      KFLOW_UPGRADE_INSTALL_CMD: `node ${installStub}`,
      KFLOW_UPGRADE_SYNC_CMD: `node ${syncStub}`,
    });

    expect(exitCode).toBe(7);
    expect(stdout).toContain("Package upgrade failed. Sync was not run.");
    expect(stdout).not.toContain("Running upgraded-CLI sync");
    expect(readFileSync(logPath, "utf-8").trim()).toBe("install-fail");
  });

  it("reports partial success with the upgraded-CLI retry command", () => {
    const logPath = join(cwd, "upgrade.log");
    const installStub = join(cwd, "install.mjs");
    const syncStub = join(cwd, "sync.mjs");
    writeFileSync(installStub, `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, "install-ok\\n");
process.exit(0);`);
    writeFileSync(syncStub, `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, "sync-fail\\n");
process.exit(9);`);

    const { stdout, exitCode } = upgrade(["--apply"], {
      KFLOW_UPGRADE_INSTALL_CMD: `node ${installStub}`,
      KFLOW_UPGRADE_SYNC_CMD: `node ${syncStub}`,
    });

    expect(exitCode).toBe(9);
    expect(stdout).toContain("Package upgraded, but asset sync failed.");
    expect(stdout).toContain("Retry asset sync: npx kflow sync");
    expect(readFileSync(logPath, "utf-8").trim().split("\n")).toEqual(["install-ok", "sync-fail"]);
  });
});
