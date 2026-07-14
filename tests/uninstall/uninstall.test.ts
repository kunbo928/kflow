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
    expect(stdout).toMatch(/kflow uninstall|No kflow/i);
  });

  it("full dry-run lists .kflow and warns about project knowledge", () => {
    run(["init", "--platform=codex"], cwd);
    const { stdout, exitCode } = uninstall(["--platform=codex"]);
    expect(exitCode).toBe(0);
    expect(existsSync(join(cwd, ".kflow"))).toBe(true);
  });

  it("full dry-run lists .agents/skills when present", () => {
    run(["init", "--platform=codex"], cwd);
    const { stdout, exitCode } = uninstall(["--platform=codex"]);
    expect(exitCode).toBe(0);
    expect(existsSync(join(cwd, ".agents"))).toBe(true);
  });

  it("full dry-run lists AGENTS.md after codex install", () => {
    run(["init", "--platform=codex"], cwd);
    const { stdout, exitCode } = uninstall(["--platform=codex"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("AGENTS.md");
    expect(existsSync(join(cwd, "AGENTS.md"))).toBe(true);
  });

  it("full dry-run lists CLAUDE.md after claude install", () => {
    run(["init", "--platform=claude"], cwd);
    const { stdout, exitCode } = uninstall(["--platform=claude"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("CLAUDE.md");
    expect(existsSync(join(cwd, "CLAUDE.md"))).toBe(true);
  });

  it("full dry-run tells user to re-run with --apply", () => {
    run(["init", "--platform=codex"], cwd);
    const { stdout, exitCode } = uninstall(["--platform=codex"]);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/--apply|To apply/i);
  });

  it("platform dry-run tells user to re-run with --apply", () => {
    run(["init", "--platform=codex"], cwd);
    const { stdout, exitCode } = uninstall(["--platform=codex"]);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/--apply|To apply/i);
  });

  it("dry-run leaves all files untouched", () => {
    writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "test" }));
    run(["init", "--platform=codex"], cwd);
    const pkgAfterInit = readFileSync(join(cwd, "package.json"), "utf-8");
    const kflowExists = existsSync(join(cwd, ".kflow"));
    const agentsExists = existsSync(join(cwd, ".agents"));
    const { exitCode } = uninstall(["--platform=codex"]);
    expect(exitCode).toBe(0);
    expect(readFileSync(join(cwd, "package.json"), "utf-8")).toBe(pkgAfterInit);
    expect(existsSync(join(cwd, ".kflow"))).toBe(kflowExists);
    expect(existsSync(join(cwd, ".agents"))).toBe(agentsExists);
  });

  it("full dry-run renders lifecycle preservation facts without mutating assets", () => {
    run(["init", "--platform=claude,codex"], cwd);
    writeFileSync(join(cwd, "CLAUDE.md"), "team instructions");

    const { stdout, exitCode } = uninstall(["legacy"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Would remove   : .kflow");
    expect(stdout).toContain("Would remove   : AGENTS.md");
    expect(stdout).toMatch(/Would preserve   : CLAUDE\.md.*user-owned/i);
    expect(stdout).toContain("Package manager : npm");
    expect(stdout).toContain("Remove command  : npm uninstall kflow");
    expect(existsSync(join(cwd, ".kflow/meta.json"))).toBe(true);
    expect(readFileSync(join(cwd, "CLAUDE.md"), "utf-8")).toBe("team instructions");
  });

  it("kflow uninstall codex lists codex integration files only", () => {
    run(["init", "--platform=codex"], cwd);
    const { stdout, exitCode } = uninstall(["--platform=codex"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("AGENTS.md");
  });

  it("kflow uninstall claude lists claude integration files only", () => {
    run(["init", "--platform=claude"], cwd);
    const { stdout, exitCode } = uninstall(["--platform=claude"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("CLAUDE.md");
  });

  it("kflow uninstall claude states .kflow and CLI dependency preserved", () => {
    run(["init", "--platform=claude"], cwd);
    const { stdout, exitCode } = uninstall(["--platform=claude"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Will preserve");
    expect(stdout).toContain(".kflow");
    expect(stdout).toContain("kflow CLI package dependency");
  });

  it("kflow uninstall cursor states preservation notes", () => {
    run(["init", "--platform=cursor"], cwd);
    const { stdout, exitCode } = uninstall(["--platform=cursor"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Will preserve");
    expect(stdout).toContain(".kflow");
    expect(stdout).toContain("kflow CLI package dependency");
  });

  it("unsupported platform exits non-zero with supported list", () => {
    const { stdout, exitCode } = uninstall(["--platform=foobar"]);
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
    run(["init", "--platform=claude"], cwd);
    const claudePath = join(cwd, "CLAUDE.md");
    expect(existsSync(claudePath)).toBe(true);
    const { exitCode } = uninstall(["--platform=claude", "--apply"]);
    expect(exitCode).toBe(0);
    expect(existsSync(claudePath)).toBe(false);
    expect(existsSync(join(cwd, ".kflow"))).toBe(true);
  });

  it("kflow uninstall codex --apply removes AGENTS.md and kflow skills", () => {
    run(["init", "--platform=codex"], cwd);
    const agentsPath = join(cwd, "AGENTS.md");
    const skillsPath = join(cwd, ".agents", "skills");
    expect(existsSync(agentsPath)).toBe(true);
    expect(existsSync(skillsPath)).toBe(true);
    const { exitCode } = uninstall(["--platform=codex", "--apply"]);
    expect(exitCode).toBe(0);
    expect(existsSync(agentsPath)).toBe(false);
    expect(existsSync(skillsPath)).toBe(false);
    expect(existsSync(join(cwd, ".kflow"))).toBe(true);
  });

  it("kflow uninstall claude --apply does not mutate package.json", () => {
    writeFileSync(
      join(cwd, "package.json"),
      JSON.stringify({ name: "test", devDependencies: { kflow: "*" } }),
    );
    run(["init", "--platform=claude"], cwd);
    const before = readFileSync(join(cwd, "package.json"), "utf-8");
    const { exitCode } = uninstall(["--platform=claude", "--apply"]);
    expect(exitCode).toBe(0);
    const after = readFileSync(join(cwd, "package.json"), "utf-8");
    expect(after).toBe(before);
    const pkg = JSON.parse(after);
    expect(pkg.devDependencies?.kflow).toBeDefined();
  });

  // =====================================================================
  // Full --apply (slices 03)
  // =====================================================================

  it("kflow uninstall --apply invokes package removal via stub", () => {
    run(["init", "--platform=codex"], cwd);
    writeFileSync(join(cwd, "package-lock.json"), "");
    writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "test", devDependencies: { kflow: "*" } }));
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
    run(["init", "--platform=codex"], cwd);
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
    run(["init", "--platform=codex"], cwd);
    const stub = join(cwd, "stub.mjs");
    writeFileSync(stub, `process.exit(0);`);
    const env = { KFLOW_UNINSTALL_REMOVE_CMD: `node ${stub}` };
    const { stdout, exitCode } = uninstall(["--apply"], env);
    expect(exitCode).toBe(0);
    expect(stdout).toContain(".kflow");
    expect(stdout).toMatch(/project knowledge/i);
  });

  it("kflow uninstall --apply skips file deletion on package failure", () => {
    run(["init", "--platform=codex"], cwd);
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
    expect(stdout).toMatch(/retry|re-run|next step|resolve/i);
  });

  it("kflow uninstall without --apply still dry-runs", () => {
    run(["init", "--platform=codex"], cwd);
    const { stdout, exitCode } = uninstall(["--platform=codex"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("dry-run");
    expect(existsSync(join(cwd, ".kflow"))).toBe(true);
  });

  // =====================================================================
  // Failure states (slice 04)
  // =====================================================================

  // -- C1: file-deletion failure exits non-zero, partial-uninstall msg ----
  it("kflow uninstall --apply exits non-zero on file-deletion failure, reports partial uninstall", () => {
    run(["init", "--platform=codex"], cwd);
    chmodSync(join(cwd, ".kflow"), 0o000);
    try {
      const stub = join(cwd, "stub.mjs");
      writeFileSync(stub, `process.exit(0);`);
      const env = { KFLOW_UNINSTALL_REMOVE_CMD: `node ${stub}` };
      const { stdout, exitCode } = uninstall(["--apply"], env);
      expect(exitCode).not.toBe(0);
      expect(stdout).toMatch(/partial|failed/i);
      expect(stdout).toMatch(/manually|retry|re-run|next step/i);
      expect(stdout).toContain("package removal already succeeded");
      expect(stdout).not.toContain("re-run kflow uninstall --apply");
      expect(existsSync(join(cwd, ".kflow"))).toBe(true);
    } finally {
      chmodSync(join(cwd, ".kflow"), 0o755);
    }
  });

});
