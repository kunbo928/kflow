import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tempProject } from "../cli-helpers/temp";
import { run } from "../cli-helpers/run";

describe("kflow init (platform-scoped)", () => {
  let cwd: string;

  beforeEach(() => {
    cwd = tempProject();
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  function kflow(args: string[] = []): { stdout: string; exitCode: number } {
    return run(["init", ...args], cwd);
  }

  it("unsupported platform exits non-zero and lists supported names", () => {
    const { stdout, exitCode } = kflow(["--platform=foobar"]);
    expect(exitCode).not.toBe(0);
    expect(stdout).toContain("codex");
    expect(stdout).toContain("cursor");
    expect(stdout).toContain("claude");
    expect(stdout).toContain("opencode");
  });

  // ── codex ──────────────────────────────────────────────

  it("codex: writes AGENTS.md, exit 0, lists installed platforms", () => {
    const { stdout, exitCode } = kflow(["--platform=codex"]);
    expect(exitCode).toBe(0);

    // AGENTS.md written to project root
    const agentsPath = join(cwd, "AGENTS.md");
    expect(existsSync(agentsPath)).toBe(true);
    const content = readFileSync(agentsPath, "utf-8");
    expect(content).toContain("kflow");
    expect(content).toContain("/k-flow");
    expect(content).toContain("codex");
    expect(content).toContain("Installed Platforms");

    // stdout confirms install
    expect(stdout).toContain("codex");

    const skillsDir = join(cwd, ".agents/skills");
    expect(existsSync(join(skillsDir, "k-flow/SKILL.md"))).toBe(true);
    expect(existsSync(join(skillsDir, "k-onboard/SKILL.md"))).toBe(true);
  });

  // ── cursor ─────────────────────────────────────────────

  it("cursor: writes AGENTS.md, exit 0, mentions cursor", () => {
    const { stdout, exitCode } = kflow(["--platform=cursor"]);
    expect(exitCode).toBe(0);

    const content = readFileSync(join(cwd, "AGENTS.md"), "utf-8");
    expect(content).toContain("/k-flow");
    expect(content).toContain("cursor");

    expect(stdout).toContain("cursor");
  });

  // ── claude ─────────────────────────────────────────────

  it("claude: writes CLAUDE.md, exit 0", () => {
    const { stdout, exitCode } = kflow(["--platform=claude"]);
    expect(exitCode).toBe(0);

    const content = readFileSync(join(cwd, "CLAUDE.md"), "utf-8");
    expect(content).toContain("/k-flow");

    expect(stdout).toContain("claude");
  });

  // ── opencode ───────────────────────────────────────────

  it("opencode: writes AGENTS.md, exit 0", () => {
    const { stdout, exitCode } = kflow(["--platform=opencode"]);
    expect(exitCode).toBe(0);

    const content = readFileSync(join(cwd, "AGENTS.md"), "utf-8");
    expect(content).toContain("/k-flow");
    expect(content).toContain("opencode");

    expect(stdout).toContain("opencode");
  });

  // ── idempotency ────────────────────────────────────────

  it("idempotent: running init twice skips already-installed platform", () => {
    const { exitCode: first } = kflow(["--platform=codex"]);
    expect(first).toBe(0);

    // Second run with same platform: exits 0, says already installed
    const { stdout: secondOut, exitCode: second } = kflow(["--platform=codex"]);
    expect(second).toBe(0);
    expect(secondOut).toMatch(/already installed/i);

    // But adding a new platform works
    const { exitCode: third } = kflow(["--platform=cursor"]);
    expect(third).toBe(0);

    const agents = readFileSync(join(cwd, "AGENTS.md"), "utf-8");
    expect(agents).toContain("codex");
    expect(agents).toContain("cursor");
  });

  // ── multi-platform ────────────────────────────────────

  it("supports comma-separated multi-platform", () => {
    const { exitCode } = kflow(["--platform=codex,cursor"]);
    expect(exitCode).toBe(0);

    const agents = readFileSync(join(cwd, "AGENTS.md"), "utf-8");
    expect(agents).toContain("codex");
    expect(agents).toContain("cursor");
  });
});
