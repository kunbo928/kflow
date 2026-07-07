import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tempProject } from "../cli-helpers/temp";
import { run } from "../cli-helpers/run";

describe("kflow install", () => {
  let cwd: string;

  beforeEach(() => {
    cwd = tempProject();
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  function install(args: string[] = []): { stdout: string; exitCode: number } {
    return run(["install", ...args], cwd);
  }

  it("unsupported platform exits non-zero and lists supported names", () => {
    const { stdout, exitCode } = install(["foobar"]);
    expect(exitCode).not.toBe(0);
    expect(stdout).toContain("codex");
    expect(stdout).toContain("cursor");
    expect(stdout).toContain("claude");
    expect(stdout).toContain("opencode");
  });

  it("no platform argument prints usage and exits non-zero", () => {
    const { stdout, exitCode } = install([]);
    expect(exitCode).not.toBe(0);
    // Should at minimum mention supported platforms or install usage
    expect(stdout).toMatch(/install|cursor|claude|codex|opencode/);
  });

  // ── codex ──────────────────────────────────────────────

  it("codex: writes AGENTS.md, exit 0, distinguishes setup from next steps", () => {
    run(["init"], cwd);
    rmSync(join(cwd, ".agents"), { recursive: true, force: true });
    const { stdout, exitCode } = install(["codex"]);
    expect(exitCode).toBe(0);

    // AGENTS.md written to project root
    const agentsPath = join(cwd, "AGENTS.md");
    expect(existsSync(agentsPath)).toBe(true);
    const content = readFileSync(agentsPath, "utf-8");
    expect(content).toContain("kflow");
    expect(content).toContain("/k-flow");
    expect(content).toContain("Codex");

    // stdout separates completed setup from next steps
    expect(stdout).toContain("Completed:");
    expect(stdout).toContain("Next steps:");

    const skillsDir = join(cwd, ".agents/skills");
    expect(existsSync(join(skillsDir, "k-flow/SKILL.md"))).toBe(true);
    expect(existsSync(join(skillsDir, "k-onboard/SKILL.md"))).toBe(true);
  });

  // ── cursor ─────────────────────────────────────────────

  it("cursor: writes AGENTS.md, exit 0, prints Cursor next steps", () => {
    run(["init"], cwd);
    const { stdout, exitCode } = install(["cursor"]);
    expect(exitCode).toBe(0);

    const content = readFileSync(join(cwd, "AGENTS.md"), "utf-8");
    expect(content).toContain("/k-flow");
    expect(content).toContain("Cursor");

    expect(stdout).toContain("Completed:");
    expect(stdout).toContain("Next steps:");
    expect(stdout).toContain("Cursor");
  });

  // ── claude ─────────────────────────────────────────────

  it("claude: writes CLAUDE.md, exit 0, prints Claude next steps", () => {
    run(["init"], cwd);
    const { stdout, exitCode } = install(["claude"]);
    expect(exitCode).toBe(0);

    const content = readFileSync(join(cwd, "CLAUDE.md"), "utf-8");
    expect(content).toContain("/k-flow");
    expect(content).toContain("Claude Code");

    expect(stdout).toContain("Completed:");
    expect(stdout).toContain("Next steps:");
    expect(stdout).toContain("Claude");
  });

  // ── opencode ───────────────────────────────────────────

  it("opencode: writes AGENTS.md, exit 0, prints OpenCode next steps", () => {
    run(["init"], cwd);
    const { stdout, exitCode } = install(["opencode"]);
    expect(exitCode).toBe(0);

    const content = readFileSync(join(cwd, "AGENTS.md"), "utf-8");
    expect(content).toContain("/k-flow");
    expect(content).toContain("OpenCode");

    expect(stdout).toContain("Completed:");
    expect(stdout).toContain("Next steps:");
  });

  // ── idempotency ────────────────────────────────────────

  it("idempotent: running install twice succeeds both times, file content is fresh", () => {
    run(["init"], cwd);

    const { exitCode: first } = install(["codex"]);
    expect(first).toBe(0);

    // Mutate the entry file to simulate user edit
    writeFileSync(join(cwd, "AGENTS.md"), "edited by user");

    const { exitCode: second } = install(["codex"]);
    expect(second).toBe(0);

    // Should be overwritten back to kflow content
    const content = readFileSync(join(cwd, "AGENTS.md"), "utf-8");
    expect(content).toContain("/k-flow");
    expect(content).not.toBe("edited by user");
  });

  // ── missing .kflow/ ────────────────────────────────────

  it("missing .kflow/: warns and exits non-zero", () => {
    const { stdout, exitCode } = install(["codex"]);
    expect(exitCode).not.toBe(0);
    expect(stdout).toContain("kflow init");
  });
});
