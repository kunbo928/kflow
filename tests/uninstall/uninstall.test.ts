import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { rmSync, existsSync, writeFileSync, readFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { tempProject } from "../cli-helpers/temp";
import { run } from "../cli-helpers/run";

describe("kflow uninstall", () => {
  let cwd: string;

  beforeEach(() => {
    cwd = tempProject();
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  function uninstall(
    args: string[] = [],
    env?: Record<string, string>,
  ): { stdout: string; exitCode: number } {
    return run(["uninstall", ...args], cwd, env);
  }

  // =====================================================================
  // Dry-run (slices 01)
  // =====================================================================

  it("is registered and not an unknown command", () => {
    const { stdout, exitCode } = uninstall();
    expect(exitCode).toBe(0);
    expect(stdout).not.toMatch(/error: unknown command/i);
    expect(stdout).toContain("kflow uninstall");
  });

  it("full dry-run lists .kflow and warns about project knowledge", () => {
    run(["init"], cwd);
    const { stdout, exitCode } = uninstall();
    expect(exitCode).toBe(0);
    expect(stdout).toContain(".kflow");
    expect(stdout).toMatch(/project knowledge|user-authored/i);
    expect(existsSync(join(cwd, ".kflow"))).toBe(true);
  });

  it("full dry-run lists .agents/skills when present", () => {
    run(["init"], cwd);
    run(["install", "codex"], cwd);
    const { stdout, exitCode } = uninstall();
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/.agents/);
    expect(existsSync(join(cwd, ".agents"))).toBe(true);
  });

  it("full dry-run lists AGENTS.md after codex install", () => {
    run(["init"], cwd);
    run(["install", "codex"], cwd);
    const { stdout, exitCode } = uninstall();
    expect(exitCode).toBe(0);
    expect(stdout).toContain("AGENTS.md");
    expect(existsSync(join(cwd, "AGENTS.md"))).toBe(true);
  });

  it("full dry-run lists CLAUDE.md after claude install", () => {
    run(["init"], cwd);
    run(["install", "claude"], cwd);
    const { stdout, exitCode } = uninstall();
    expect(exitCode).toBe(0);
    expect(stdout).toContain("CLAUDE.md");
    expect(existsSync(join(cwd, "CLAUDE.md"))).toBe(true);
  });

  it("full dry-run shows npm uninstall command by default", () => {
    const { stdout, exitCode } = uninstall();
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Package manager");
    expect(stdout).toContain("npm");
    expect(stdout).toContain("npm uninstall kflow");
  });

  it("detects pnpm via pnpm-lock.yaml", () => {
    writeFileSync(join(cwd, "pnpm-lock.yaml"), "");
    const { stdout, exitCode } = uninstall();
    expect(exitCode).toBe(0);
    expect(stdout).toContain("pnpm");
    expect(stdout).toContain("pnpm remove kflow");
    expect(stdout).not.toContain("npm uninstall kflow");
  });

  it("detects yarn via yarn.lock", () => {
    writeFileSync(join(cwd, "yarn.lock"), "");
    const { stdout, exitCode } = uninstall();
    expect(exitCode).toBe(0);
    expect(stdout).toContain("yarn");
    expect(stdout).toContain("yarn remove kflow");
  });

  it("detects bun via bun.lockb", () => {
    writeFileSync(join(cwd, "bun.lockb"), "");
    const { stdout, exitCode } = uninstall();
    expect(exitCode).toBe(0);
    expect(stdout).toContain("bun");
    expect(stdout).toContain("bun remove kflow");
  });

  it("detects bun via bun.lock", () => {
    writeFileSync(join(cwd, "bun.lock"), "");
    const { stdout, exitCode } = uninstall();
    expect(exitCode).toBe(0);
    expect(stdout).toContain("bun");
    expect(stdout).toContain("bun remove kflow");
  });

  it("detects npm via package-lock.json", () => {
    writeFileSync(join(cwd, "package-lock.json"), "");
    const { stdout, exitCode } = uninstall();
    expect(exitCode).toBe(0);
    expect(stdout).toContain("npm");
    expect(stdout).toContain("npm uninstall kflow");
  });

  it("pnpm-lock.yaml takes precedence over package-lock.json", () => {
    writeFileSync(join(cwd, "pnpm-lock.yaml"), "");
    writeFileSync(join(cwd, "package-lock.json"), "");
    const { stdout, exitCode } = uninstall();
    expect(exitCode).toBe(0);
    expect(stdout).toContain("pnpm");
    expect(stdout).toContain("pnpm remove kflow");
  });

  it("dry-run leaves all files untouched", () => {
    writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "test" }));
    run(["init"], cwd);
    const pkgAfterInit = readFileSync(join(cwd, "package.json"), "utf-8");
    const kflowExists = existsSync(join(cwd, ".kflow"));
    const agentsExists = existsSync(join(cwd, ".agents"));
    const { exitCode } = uninstall();
    expect(exitCode).toBe(0);
    expect(readFileSync(join(cwd, "package.json"), "utf-8")).toBe(pkgAfterInit);
    expect(existsSync(join(cwd, ".kflow"))).toBe(kflowExists);
    expect(existsSync(join(cwd, ".agents"))).toBe(agentsExists);
    expect(existsSync(join(cwd, "pnpm-lock.yaml"))).toBe(false);
    expect(existsSync(join(cwd, "package-lock.json"))).toBe(false);
  });

  it("kflow uninstall codex lists codex integration files only", () => {
    run(["init"], cwd);
    run(["install", "codex"], cwd);
    const { stdout, exitCode } = uninstall(["codex"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("AGENTS.md");
    expect(stdout).not.toMatch(/^Would remove\s+: \.kflow$/m);
  });

  it("kflow uninstall claude lists claude integration files only", () => {
    run(["init"], cwd);
    run(["install", "claude"], cwd);
    const { stdout, exitCode } = uninstall(["claude"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("CLAUDE.md");
    expect(stdout).not.toMatch(/^Would remove\s+: \.kflow$/m);
  });

  it("kflow uninstall claude states .kflow and CLI dependency preserved", () => {
    run(["init"], cwd);
    run(["install", "claude"], cwd);
    const { stdout, exitCode } = uninstall(["claude"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Will preserve");
    expect(stdout).toContain(".kflow");
    expect(stdout).toContain("kflow CLI package dependency");
  });

  it("kflow uninstall cursor states preservation notes", () => {
    run(["init"], cwd);
    run(["install", "cursor"], cwd);
    const { stdout, exitCode } = uninstall(["cursor"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Will preserve");
    expect(stdout).toContain(".kflow");
    expect(stdout).toContain("kflow CLI package dependency");
  });

  it("unsupported platform exits non-zero with supported list", () => {
    const { stdout, exitCode } = uninstall(["foobar"]);
    expect(exitCode).not.toBe(0);
    expect(stdout).toContain("codex");
    expect(stdout).toContain("cursor");
    expect(stdout).toContain("claude");
    expect(stdout).toContain("opencode");
  });

  // =====================================================================
  // Platform --apply (slices 02)
  // =====================================================================

  it("kflow uninstall claude --apply removes CLAUDE.md", () => {
    run(["init"], cwd);
    run(["install", "claude"], cwd);
    const claudePath = join(cwd, "CLAUDE.md");
    expect(existsSync(claudePath)).toBe(true);
    const { exitCode } = uninstall(["claude", "--apply"]);
    expect(exitCode).toBe(0);
    expect(existsSync(claudePath)).toBe(false);
    expect(existsSync(join(cwd, ".kflow"))).toBe(true);
  });

  it("kflow uninstall codex --apply removes AGENTS.md and .agents/skills", () => {
    run(["init"], cwd);
    run(["install", "codex"], cwd);
    const agentsPath = join(cwd, "AGENTS.md");
    const skillsPath = join(cwd, ".agents", "skills");
    expect(existsSync(agentsPath)).toBe(true);
    expect(existsSync(skillsPath)).toBe(true);
    const { exitCode } = uninstall(["codex", "--apply"]);
    expect(exitCode).toBe(0);
    expect(existsSync(agentsPath)).toBe(false);
    expect(existsSync(skillsPath)).toBe(false);
    expect(existsSync(join(cwd, ".kflow"))).toBe(true);
  });

  it("kflow uninstall codex --apply preserves .kflow content", () => {
    run(["init"], cwd);
    run(["install", "codex"], cwd);
    const kflowRefFile = join(cwd, ".kflow", "reference", "shared-paths.md");
    expect(existsSync(kflowRefFile)).toBe(true);
    const { exitCode } = uninstall(["codex", "--apply"]);
    expect(exitCode).toBe(0);
    expect(existsSync(join(cwd, ".kflow"))).toBe(true);
    expect(existsSync(kflowRefFile)).toBe(true);
  });

  it("kflow uninstall claude --apply does not mutate package.json", () => {
    writeFileSync(
      join(cwd, "package.json"),
      JSON.stringify({ name: "test", devDependencies: { kflow: "*" } }),
    );
    run(["init"], cwd);
    run(["install", "claude"], cwd);
    const before = readFileSync(join(cwd, "package.json"), "utf-8");
    const { exitCode } = uninstall(["claude", "--apply"]);
    expect(exitCode).toBe(0);
    const after = readFileSync(join(cwd, "package.json"), "utf-8");
    expect(after).toBe(before);
    const pkg = JSON.parse(after);
    expect(pkg.devDependencies?.kflow).toBeDefined();
  });

  it("kflow uninstall claude --apply preserves non-kflow CLAUDE.md", () => {
    run(["init"], cwd);
    run(["install", "claude"], cwd);
    writeFileSync(join(cwd, "CLAUDE.md"), "my custom instructions");
    const { stdout, exitCode } = uninstall(["claude", "--apply"]);
    expect(exitCode).toBe(0);
    const content = readFileSync(join(cwd, "CLAUDE.md"), "utf-8");
    expect(content).toBe("my custom instructions");
    expect(stdout).toMatch(/Preserved|not kflow-generated/i);
    expect(stdout).toContain("CLAUDE.md");
  });

  it("kflow uninstall cursor --apply removes AGENTS.md", () => {
    run(["init"], cwd);
    run(["install", "cursor"], cwd);
    const agentsPath = join(cwd, "AGENTS.md");
    expect(existsSync(agentsPath)).toBe(true);
    const { exitCode } = uninstall(["cursor", "--apply"]);
    expect(exitCode).toBe(0);
    expect(existsSync(agentsPath)).toBe(false);
    expect(existsSync(join(cwd, ".kflow"))).toBe(true);
  });

  it("kflow uninstall opencode --apply removes AGENTS.md", () => {
    run(["init"], cwd);
    run(["install", "opencode"], cwd);
    const agentsPath = join(cwd, "AGENTS.md");
    expect(existsSync(agentsPath)).toBe(true);
    const { exitCode } = uninstall(["opencode", "--apply"]);
    expect(exitCode).toBe(0);
    expect(existsSync(agentsPath)).toBe(false);
    expect(existsSync(join(cwd, ".kflow"))).toBe(true);
  });

  it("kflow uninstall codex --apply is idempotent", () => {
    run(["init"], cwd);
    run(["install", "codex"], cwd);
    const first = uninstall(["codex", "--apply"]);
    expect(first.exitCode).toBe(0);
    expect(existsSync(join(cwd, "AGENTS.md"))).toBe(false);
    const second = uninstall(["codex", "--apply"]);
    expect(second.exitCode).toBe(0);
    expect(second.stdout).toMatch(/Already absent|absent/i);
  });

  // =====================================================================
  // Full --apply (slices 03)
  // =====================================================================

  it("kflow uninstall --apply invokes package removal via stub", () => {
    writeFileSync(join(cwd, "package-lock.json"), "");
    writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "test" }));
    const stub = join(cwd, "stub.mjs");
    const logPath = join(cwd, "uninstall.log");
    writeFileSync(stub, `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, process.env.STUB_MARKER + "\\n");
process.exit(0);`);
    const env = { KFLOW_UNINSTALL_REMOVE_CMD: `STUB_MARKER=remove node ${stub}` };
    const { stdout, exitCode } = uninstall(["--apply"], env);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("npm uninstall kflow");
    const log = readFileSync(logPath, "utf-8").trim().split("\n");
    expect(log).toEqual(["remove"]);
  });

  it("kflow uninstall --apply removes .kflow and .agents after package step", () => {
    run(["init"], cwd);
    run(["install", "codex"], cwd);
    const stub = join(cwd, "stub.mjs");
    const logPath = join(cwd, "uninstall.log");
    writeFileSync(stub, `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, process.env.STUB_MARKER + "\\n");
process.exit(0);`);
    const env = { KFLOW_UNINSTALL_REMOVE_CMD: `STUB_MARKER=remove node ${stub}` };
    const { exitCode } = uninstall(["--apply"], env);
    expect(exitCode).toBe(0);
    const log = readFileSync(logPath, "utf-8").trim().split("\n");
    expect(log).toEqual(["remove"]);
    expect(existsSync(join(cwd, ".kflow"))).toBe(false);
    expect(existsSync(join(cwd, ".agents"))).toBe(false);
    expect(existsSync(join(cwd, "AGENTS.md"))).toBe(false);
  });

  it("kflow uninstall --apply reports .kflow removal as project knowledge", () => {
    run(["init"], cwd);
    const stub = join(cwd, "stub.mjs");
    writeFileSync(stub, `process.exit(0);`);
    const env = { KFLOW_UNINSTALL_REMOVE_CMD: `node ${stub}` };
    const { stdout, exitCode } = uninstall(["--apply"], env);
    expect(exitCode).toBe(0);
    expect(stdout).toContain(".kflow");
    expect(stdout).toMatch(/project knowledge/i);
  });

  it("kflow uninstall --apply preserves non-kflow CLAUDE.md", () => {
    run(["init"], cwd);
    run(["install", "claude"], cwd);
    writeFileSync(join(cwd, "CLAUDE.md"), "my custom instructions");
    const stub = join(cwd, "stub.mjs");
    writeFileSync(stub, `process.exit(0);`);
    const env = { KFLOW_UNINSTALL_REMOVE_CMD: `node ${stub}` };
    const { stdout, exitCode } = uninstall(["--apply"], env);
    expect(exitCode).toBe(0);
    const content = readFileSync(join(cwd, "CLAUDE.md"), "utf-8");
    expect(content).toBe("my custom instructions");
    expect(stdout).toMatch(/Preserved|not kflow-generated/i);
    expect(stdout).toContain("CLAUDE.md");
  });

  it("kflow uninstall --apply skips file deletion on package failure", () => {
    run(["init"], cwd);
    run(["install", "codex"], cwd);
    const stub = join(cwd, "stub.mjs");
    const logPath = join(cwd, "uninstall.log");
    writeFileSync(stub, `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, process.env.STUB_MARKER + "\\n");
process.exit(1);`);
    const env = { KFLOW_UNINSTALL_REMOVE_CMD: `STUB_MARKER=remove-fail node ${stub}` };
    const { stdout, exitCode } = uninstall(["--apply"], env);
    expect(exitCode).not.toBe(0);
    const log = readFileSync(logPath, "utf-8").trim().split("\n");
    expect(log).toEqual(["remove-fail"]);
    expect(existsSync(join(cwd, ".kflow"))).toBe(true);
    expect(existsSync(join(cwd, ".agents"))).toBe(true);
    expect(existsSync(join(cwd, "AGENTS.md"))).toBe(true);
    expect(stdout).toMatch(/failed|skipped/i);
  });

  it("kflow uninstall --apply uses pnpm remove with pnpm-lock.yaml", () => {
    writeFileSync(join(cwd, "pnpm-lock.yaml"), "");
    writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "test" }));
    const stub = join(cwd, "stub.mjs");
    const logPath = join(cwd, "uninstall.log");
    writeFileSync(stub, `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, process.env.STUB_MARKER + "\\n");
process.exit(0);`);
    const env = { KFLOW_UNINSTALL_REMOVE_CMD: `STUB_MARKER=pnpm-remove node ${stub}` };
    const { stdout, exitCode } = uninstall(["--apply"], env);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("pnpm");
    expect(stdout).toContain("pnpm remove kflow");
    const log = readFileSync(logPath, "utf-8").trim().split("\n");
    expect(log).toEqual(["pnpm-remove"]);
  });

  it("kflow uninstall --apply does not crash on second run", () => {
    run(["init"], cwd);
    const stub = join(cwd, "stub.mjs");
    writeFileSync(stub, `process.exit(0);`);
    const env = { KFLOW_UNINSTALL_REMOVE_CMD: `node ${stub}` };
    const first = uninstall(["--apply"], env);
    expect(first.exitCode).toBe(0);
    expect(existsSync(join(cwd, ".kflow"))).toBe(false);
    const second = uninstall(["--apply"], env);
    expect(second.exitCode).toBe(0);
  });

  it("kflow uninstall without --apply still dry-runs", () => {
    run(["init"], cwd);
    const { stdout, exitCode } = uninstall();
    expect(exitCode).toBe(0);
    expect(stdout).toContain("dry-run");
    expect(existsSync(join(cwd, ".kflow"))).toBe(true);
  });

  // =====================================================================
  // Failure states (slice 04)
  // =====================================================================

  // -- C1: file-deletion failure exits non-zero, partial-uninstall msg ----
  it("kflow uninstall --apply exits non-zero on file-deletion failure, reports partial uninstall", () => {
    run(["init"], cwd);
    run(["install", "codex"], cwd);
    chmodSync(join(cwd, ".kflow"), 0o000);
    try {
      const stub = join(cwd, "stub.mjs");
      writeFileSync(stub, `process.exit(0);`);
      const env = { KFLOW_UNINSTALL_REMOVE_CMD: `node ${stub}` };
      const { stdout, exitCode } = uninstall(["--apply"], env);
      expect(exitCode).not.toBe(0);
      expect(stdout).toMatch(/partial|failed/i);
    } finally {
      chmodSync(join(cwd, ".kflow"), 0o755);
    }
  });

  // -- C2: next-step hint in stdout on file-deletion failure ------------
  it("kflow uninstall --apply gives a next step on file-deletion failure", () => {
    run(["init"], cwd);
    chmodSync(join(cwd, ".kflow"), 0o000);
    try {
      const stub = join(cwd, "stub.mjs");
      writeFileSync(stub, `process.exit(0);`);
      const env = { KFLOW_UNINSTALL_REMOVE_CMD: `node ${stub}` };
      const { stdout } = uninstall(["--apply"], env);
      expect(stdout).toMatch(/manually|retry|re-run|next step/i);
    } finally {
      chmodSync(join(cwd, ".kflow"), 0o755);
    }
  });

  // -- C3: no rollback — package removal invoked exactly once -----------
  it("kflow uninstall --apply does not re-invoke package removal on file-deletion failure", () => {
    run(["init"], cwd);
    run(["install", "codex"], cwd);
    const stub = join(cwd, "stub.mjs");
    const logPath = join(cwd, "uninstall.log");
    writeFileSync(stub, `import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(logPath)}, process.env.STUB_MARKER + "\\n");
process.exit(0);`);
    chmodSync(join(cwd, ".kflow"), 0o000);
    try {
      const env = { KFLOW_UNINSTALL_REMOVE_CMD: `STUB_MARKER=remove-ok node ${stub}` };
      uninstall(["--apply"], env);
      const log = readFileSync(logPath, "utf-8").trim().split("\n");
      // Package removal ran exactly once — no rollback re-install
      expect(log).toEqual(["remove-ok"]);
    } finally {
      chmodSync(join(cwd, ".kflow"), 0o755);
    }
  });

  // -- C4: package removed, files remain (partial state) -----------------
  it("kflow uninstall --apply leaves files when deletion fails after package success", () => {
    run(["init"], cwd);
    run(["install", "codex"], cwd);
    chmodSync(join(cwd, ".kflow"), 0o000);
    try {
      const stub = join(cwd, "stub.mjs");
      writeFileSync(stub, `process.exit(0);`);
      const env = { KFLOW_UNINSTALL_REMOVE_CMD: `node ${stub}` };
      const { exitCode } = uninstall(["--apply"], env);
      expect(exitCode).not.toBe(0);
      // .kflow still exists (deletion failed)
      expect(existsSync(join(cwd, ".kflow"))).toBe(true);
    } finally {
      chmodSync(join(cwd, ".kflow"), 0o755);
    }
  });

  // -- C6: package removal failure includes next step hint --------------
  it("kflow uninstall --apply gives a next step on package removal failure", () => {
    run(["init"], cwd);
    const stub = join(cwd, "stub.mjs");
    writeFileSync(stub, `process.exit(1);`);
    const env = { KFLOW_UNINSTALL_REMOVE_CMD: `node ${stub}` };
    const { stdout, exitCode } = uninstall(["--apply"], env);
    expect(exitCode).not.toBe(0);
    expect(stdout).toMatch(/retry|re-run|next step|resolve/i);
  });
});
