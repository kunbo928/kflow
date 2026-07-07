import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
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

  // -- dry-run tests -------------------------------------------------------

  it("defaults target to latest with npm fallback", () => {
    const { stdout, exitCode } = upgrade();

    expect(exitCode).toBe(0);
    expect(stdout).toContain("latest");
    expect(stdout).toContain("npm install --save-dev kflow@latest");
    expect(stdout).toContain("npx kflow sync");
    expect(stdout).toContain("npm");
  });

  it("accepts explicit version target", () => {
    const { stdout, exitCode } = upgrade(["2.1.0"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("2.1.0");
    expect(stdout).toContain("npm install --save-dev kflow@2.1.0");
  });

  it("accepts dist-tag as target", () => {
    const { stdout, exitCode } = upgrade(["next"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("next");
    expect(stdout).toContain("npm install --save-dev kflow@next");
  });

  it("does not mutate files in dry-run mode", () => {
    // Create a real package.json so we can detect mutation
    const pkgPath = join(cwd, "package.json");
    writeFileSync(pkgPath, JSON.stringify({ name: "test", version: "1.0.0" }));
    const before = readFileSync(pkgPath, "utf-8");

    const { exitCode } = upgrade();

    expect(exitCode).toBe(0);
    // package.json unchanged
    expect(readFileSync(pkgPath, "utf-8")).toBe(before);
    // No .kflow/ created
    expect(existsSync(join(cwd, ".kflow"))).toBe(false);
  });

  it("detects pnpm via pnpm-lock.yaml", () => {
    writeFileSync(join(cwd, "pnpm-lock.yaml"), "");
    const { stdout, exitCode } = upgrade();

    expect(exitCode).toBe(0);
    expect(stdout).toContain("pnpm");
    expect(stdout).toContain("pnpm add -D kflow@latest");
    expect(stdout).toContain("pnpm exec kflow sync");
  });

  it("detects yarn via yarn.lock", () => {
    writeFileSync(join(cwd, "yarn.lock"), "");
    const { stdout, exitCode } = upgrade();

    expect(exitCode).toBe(0);
    expect(stdout).toContain("yarn");
    expect(stdout).toContain("yarn add -D kflow@latest");
    expect(stdout).toContain("yarn kflow sync");
  });

  it("detects bun via bun.lockb", () => {
    writeFileSync(join(cwd, "bun.lockb"), "");
    const { stdout, exitCode } = upgrade();

    expect(exitCode).toBe(0);
    expect(stdout).toContain("bun");
    expect(stdout).toContain("bun add -d kflow@latest");
    expect(stdout).toContain("bunx kflow sync");
  });

  it("detects bun via bun.lock", () => {
    writeFileSync(join(cwd, "bun.lock"), "");
    const { stdout, exitCode } = upgrade();

    expect(exitCode).toBe(0);
    expect(stdout).toContain("bun");
    expect(stdout).toContain("bun add -d kflow@latest");
    expect(stdout).toContain("bunx kflow sync");
  });

  it("detects npm via package-lock.json", () => {
    writeFileSync(join(cwd, "package-lock.json"), "");
    const { stdout, exitCode } = upgrade();

    expect(exitCode).toBe(0);
    expect(stdout).toContain("npm");
    expect(stdout).toContain("npm install --save-dev kflow@latest");
    expect(stdout).toContain("npx kflow sync");
  });

  it("pnpm-lock.yaml takes precedence over package-lock.json", () => {
    writeFileSync(join(cwd, "pnpm-lock.yaml"), "");
    writeFileSync(join(cwd, "package-lock.json"), "");
    const { stdout, exitCode } = upgrade();

    expect(exitCode).toBe(0);
    expect(stdout).toContain("pnpm");
    expect(stdout).toContain("pnpm add -D kflow@latest");
  });

  // -- apply tests ----------------------------------------------------------

  it("--apply runs install then sync in order with step labels", () => {
    // stub that logs a marker to a file then exits 0
    const stub = join(cwd, "stub.mjs");
    const logPath = join(cwd, "upgrade.log");
    writeFileSync(
      stub,
      `import { appendFileSync } from "node:fs";
const marker = process.env.STUB_MARKER ?? "unknown";
appendFileSync(${JSON.stringify(logPath)}, marker + "\\n");
process.exit(0);
`,
    );

    writeFileSync(join(cwd, "package-lock.json"), "");
    writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "test" }));

    const env = {
      KFLOW_UPGRADE_INSTALL_CMD: `STUB_MARKER=install node ${stub}`,
      KFLOW_UPGRADE_SYNC_CMD: `STUB_MARKER=sync node ${stub}`,
    };
    const { stdout, exitCode } = upgrade(["--apply"], env);

    expect(exitCode).toBe(0);

    // step labels and planned commands in stdout
    expect(stdout).toContain("Installing package");
    expect(stdout).toContain("npm install --save-dev kflow@latest");
    expect(stdout).toContain("Running upgraded-CLI sync");
    expect(stdout).toContain("npx kflow sync");

    // log file: install first, sync second
    const log = readFileSync(logPath, "utf-8").trim().split("\n");
    expect(log).toEqual(["install", "sync"]);
  });

  it("--apply passes explicit target to install command", () => {
    const stub = join(cwd, "stub.mjs");
    const logPath = join(cwd, "upgrade.log");
    writeFileSync(stub, `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, process.env.STUB_MARKER + "\\n");
process.exit(0);`);

    writeFileSync(join(cwd, "package-lock.json"), "");
    writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "test" }));

    const env = {
      KFLOW_UPGRADE_INSTALL_CMD: `STUB_MARKER=install-2.1.0 node ${stub}`,
      KFLOW_UPGRADE_SYNC_CMD: `STUB_MARKER=sync node ${stub}`,
    };
    const { stdout, exitCode } = upgrade(["2.1.0", "--apply"], env);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("npm install --save-dev kflow@2.1.0");
    expect(readFileSync(logPath, "utf-8").trim().split("\n")).toEqual(["install-2.1.0", "sync"]);
  });

  it("--apply with pnpm runs pnpm commands", () => {
    const stub = join(cwd, "stub.mjs");
    const logPath = join(cwd, "upgrade.log");
    writeFileSync(stub, `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, process.env.STUB_MARKER + "\\n");
process.exit(0);`);

    writeFileSync(join(cwd, "pnpm-lock.yaml"), "");
    writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "test" }));

    const env = {
      KFLOW_UPGRADE_INSTALL_CMD: `STUB_MARKER=pnpm-install node ${stub}`,
      KFLOW_UPGRADE_SYNC_CMD: `STUB_MARKER=pnpm-sync node ${stub}`,
    };
    const { stdout, exitCode } = upgrade(["--apply"], env);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("pnpm add -D kflow@latest");
    expect(stdout).toContain("pnpm exec kflow sync");
    expect(readFileSync(logPath, "utf-8").trim().split("\n")).toEqual(["pnpm-install", "pnpm-sync"]);
  });

  it("--apply stops after install failure, exits non-zero", () => {
    const logPath = join(cwd, "upgrade.log");
    // install stub exits 1
    writeFileSync(
      join(cwd, "install-stub.mjs"),
      `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, "install-fail\\n");
process.exit(1);`,
    );
    // sync stub exits 0 (but should never run)
    writeFileSync(
      join(cwd, "sync-stub.mjs"),
      `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, "sync-should-not-run\\n");
process.exit(0);`,
    );

    writeFileSync(join(cwd, "package-lock.json"), "");
    writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "test" }));

    const env = {
      KFLOW_UPGRADE_INSTALL_CMD: `node ${join(cwd, "install-stub.mjs")}`,
      KFLOW_UPGRADE_SYNC_CMD: `node ${join(cwd, "sync-stub.mjs")}`,
    };
    const { exitCode } = upgrade(["--apply"], env);

    expect(exitCode).not.toBe(0);
    const log = readFileSync(logPath, "utf-8").trim().split("\n");
    expect(log).toEqual(["install-fail"]);
  });

  it("--apply sync failure after install success exits non-zero", () => {
    const logPath = join(cwd, "upgrade.log");
    writeFileSync(
      join(cwd, "install-stub.mjs"),
      `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, "install-ok\\n");
process.exit(0);`,
    );
    writeFileSync(
      join(cwd, "sync-stub.mjs"),
      `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, "sync-fail\\n");
process.exit(1);`,
    );

    writeFileSync(join(cwd, "package-lock.json"), "");
    writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "test" }));

    const env = {
      KFLOW_UPGRADE_INSTALL_CMD: `node ${join(cwd, "install-stub.mjs")}`,
      KFLOW_UPGRADE_SYNC_CMD: `node ${join(cwd, "sync-stub.mjs")}`,
    };
    const { exitCode } = upgrade(["--apply"], env);

    expect(exitCode).not.toBe(0);
    const log = readFileSync(logPath, "utf-8").trim().split("\n");
    expect(log).toEqual(["install-ok", "sync-fail"]);
  });

  it("--apply sync failure prints message and rerun command", () => {
    const logPath = join(cwd, "upgrade.log");
    writeFileSync(
      join(cwd, "install-stub.mjs"),
      `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, "install-ok\\n");
process.exit(0);`,
    );
    writeFileSync(
      join(cwd, "sync-stub.mjs"),
      `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, "sync-fail\\n");
process.exit(1);`,
    );

    writeFileSync(join(cwd, "package-lock.json"), "");
    writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "test" }));

    const env = {
      KFLOW_UPGRADE_INSTALL_CMD: `node ${join(cwd, "install-stub.mjs")}`,
      KFLOW_UPGRADE_SYNC_CMD: `node ${join(cwd, "sync-stub.mjs")}`,
    };
    const { stdout, exitCode } = upgrade(["--apply"], env);

    expect(exitCode).not.toBe(0);
    expect(stdout).toContain("Package upgraded, but asset sync failed.");
    expect(stdout).toContain("Retry asset sync: npx kflow sync");
  });

  it("--apply sync failure rerun command matches pnpm", () => {
    const logPath = join(cwd, "upgrade.log");
    writeFileSync(
      join(cwd, "install-stub.mjs"),
      `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, "install-ok\\n");
process.exit(0);`,
    );
    writeFileSync(
      join(cwd, "sync-stub.mjs"),
      `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, "sync-fail\\n");
process.exit(1);`,
    );

    writeFileSync(join(cwd, "pnpm-lock.yaml"), "");
    writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "test" }));

    const env = {
      KFLOW_UPGRADE_INSTALL_CMD: `node ${join(cwd, "install-stub.mjs")}`,
      KFLOW_UPGRADE_SYNC_CMD: `node ${join(cwd, "sync-stub.mjs")}`,
    };
    const { stdout, exitCode } = upgrade(["--apply"], env);

    expect(exitCode).not.toBe(0);
    expect(stdout).toContain("Package upgraded, but asset sync failed.");
    expect(stdout).toContain("Retry asset sync: pnpm exec kflow sync");
  });

  it("--apply install failure prints message, sync not run, no rerun hint", () => {
    const logPath = join(cwd, "upgrade.log");
    writeFileSync(
      join(cwd, "install-stub.mjs"),
      `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, "install-fail\\n");
process.exit(1);`,
    );
    // sync stub should never run
    writeFileSync(
      join(cwd, "sync-stub.mjs"),
      `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, "sync-should-not-run\\n");
process.exit(0);`,
    );

    writeFileSync(join(cwd, "package-lock.json"), "");
    writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "test" }));

    const env = {
      KFLOW_UPGRADE_INSTALL_CMD: `node ${join(cwd, "install-stub.mjs")}`,
      KFLOW_UPGRADE_SYNC_CMD: `node ${join(cwd, "sync-stub.mjs")}`,
    };
    const { stdout, exitCode } = upgrade(["--apply"], env);

    expect(exitCode).not.toBe(0);
    expect(stdout).toContain("Package upgrade failed. Sync was not run.");
    // no rerun hint for sync (was never reached)
    expect(stdout).not.toContain("Retry asset sync");
    // sync stub log absent
    const log = readFileSync(logPath, "utf-8").trim().split("\n");
    expect(log).toEqual(["install-fail"]);
  });

  it("--apply sync failure does not re-invoke install (no rollback)", () => {
    const logPath = join(cwd, "upgrade.log");
    writeFileSync(
      join(cwd, "install-stub.mjs"),
      `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, "install-ok\\n");
process.exit(0);`,
    );
    writeFileSync(
      join(cwd, "sync-stub.mjs"),
      `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, "sync-fail\\n");
process.exit(1);`,
    );

    writeFileSync(join(cwd, "package-lock.json"), "");
    writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "test" }));

    const env = {
      KFLOW_UPGRADE_INSTALL_CMD: `node ${join(cwd, "install-stub.mjs")}`,
      KFLOW_UPGRADE_SYNC_CMD: `node ${join(cwd, "sync-stub.mjs")}`,
    };
    upgrade(["--apply"], env);

    // exactly one install invocation, then sync-fail — no second install
    const log = readFileSync(logPath, "utf-8").trim().split("\n");
    expect(log).toEqual(["install-ok", "sync-fail"]);
  });

  it("--apply does not call in-process sync (no .kflow/ created)", () => {
    // Stubs exit 0 but create nothing — if in-process sync ran, .kflow/ would exist
    writeFileSync(join(cwd, "stub.mjs"), `process.exit(0);`);

    writeFileSync(join(cwd, "package-lock.json"), "");
    writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "test" }));

    const env = {
      KFLOW_UPGRADE_INSTALL_CMD: `node ${join(cwd, "stub.mjs")}`,
      KFLOW_UPGRADE_SYNC_CMD: `node ${join(cwd, "stub.mjs")}`,
    };
    const { exitCode } = upgrade(["--apply"], env);

    expect(exitCode).toBe(0);
    expect(existsSync(join(cwd, ".kflow"))).toBe(false);
  });
});
