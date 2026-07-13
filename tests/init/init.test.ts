import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, statSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

const CLI = resolve(import.meta.dirname, "../../dist/cli.js");

describe("kflow init — .kflow/ structure", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "kflow-init-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function init(...args: string[]): { stdout: string; exitCode: number } {
    let stdout = "";
    let exitCode = 0;
    try {
      stdout = execFileSync("node", [CLI, "init", ...args], {
        cwd: tempDir,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e: any) {
      exitCode = e.status ?? 1;
      stdout = (e.stdout?.toString() ?? "") + (e.stderr?.toString() ?? "");
    }
    return { stdout, exitCode };
  }

  it("creates .kflow/ directory", () => {
    init("--platform=codex");
    const kflowDir = join(tempDir, ".kflow");
    expect(existsSync(kflowDir)).toBe(true);
    expect(statSync(kflowDir).isDirectory()).toBe(true);
  });

  it("creates aggregation subdirectories without .gitkeep", () => {
    init("--platform=codex");
    const dirs = [
      "requirements",
      "roadmap",
      "features",
      "issues",
      "refactors",
      "brainstorms",
      "compound",
    ];
    for (const d of dirs) {
      const dirPath = join(tempDir, ".kflow", d);
      expect(existsSync(dirPath), `missing dir: ${d}`).toBe(true);
      expect(statSync(dirPath).isDirectory(), `${d} is not a dir`).toBe(true);

      const gitkeep = join(dirPath, ".gitkeep");
      expect(existsSync(gitkeep), `.gitkeep should NOT exist in ${d}`).toBe(false);
    }
  });

  it("exits with code 0 on success", () => {
    const { exitCode } = init("--platform=codex");
    expect(exitCode).toBe(0);
  });

  it("creates .kflow/attention.md with minimal template", () => {
    init("--platform=codex");
    const attention = readFileSync(join(tempDir, ".kflow/attention.md"), "utf-8");
    expect(attention).toContain("# Attention");
    expect(attention).toContain("kflow");
  });

  it("creates .kflow/architecture/ARCHITECTURE.md with placeholder template", () => {
    init("--platform=codex");
    const archDir = join(tempDir, ".kflow/architecture");
    expect(statSync(archDir).isDirectory()).toBe(true);

    const arch = readFileSync(join(archDir, "ARCHITECTURE.md"), "utf-8");
    expect(arch).toContain("架构总入口");
    expect(arch).toContain("骨架");
  });

  it("copies templates/ into .kflow/reference/", () => {
    init("--platform=codex");
    const refDir = join(tempDir, ".kflow/reference");
    expect(statSync(refDir).isDirectory()).toBe(true);

    // Spot-check known shared reference files
    const files = readdirSync(refDir);
    expect(files).toContain("shared-paths.md");
    expect(files).toContain("system-overview.md");
    expect(files).toContain("tools.md");
    expect(files).toContain("shared-conventions.md");
  });

  it("copies tools/ into .kflow/tools/", () => {
    init("--platform=codex");
    const toolsDir = join(tempDir, ".kflow/tools");
    expect(statSync(toolsDir).isDirectory()).toBe(true);

    const files = readdirSync(toolsDir);
    expect(files).toContain("search-yaml.py");
    expect(files).toContain("validate-yaml.py");
  });

  it("copies skills/ into .agents/skills/", () => {
    init("--platform=codex");
    const skillsDir = join(tempDir, ".agents/skills");
    expect(statSync(skillsDir).isDirectory()).toBe(true);
    expect(existsSync(join(skillsDir, "k-flow/SKILL.md"))).toBe(true);
    expect(existsSync(join(skillsDir, "k-onboard/SKILL.md"))).toBe(true);
  });

  it("generates AGENTS.md listing installed platforms", () => {
    init("--platform=codex");
    const agents = readFileSync(join(tempDir, "AGENTS.md"), "utf-8");
    expect(agents).toContain("kflow");
    expect(agents).toContain("k-flow");
    expect(agents).toContain("Installed Platforms");
    expect(agents).toContain("codex");
  });

  it("stdout tells user k-flow is the Skill Workflow entrypoint", () => {
    const { stdout } = init("--platform=codex");
    expect(stdout).toContain("k-flow");
  });

  it("deterministic init prints compact kflow brand mark", () => {
    const { stdout } = init("--platform=codex");
    // Compact mark identifies kflow specifically with a distinctive literal
    expect(stdout).toContain("kflow · AI coding workflow skill pack");
    expect(stdout).toContain("kflow initialized with: codex");
  });

  it("brand mark is not written into generated project files", () => {
    init("--platform=codex");
    const markLiteral = "kflow · AI coding workflow skill pack";
    // Check key generated files
    const files = [
      join(tempDir, "AGENTS.md"),
      join(tempDir, ".kflow/attention.md"),
      join(tempDir, ".kflow/architecture/ARCHITECTURE.md"),
      join(tempDir, ".agents/skills/k-flow/SKILL.md"),
    ];
    for (const f of files) {
      if (existsSync(f)) {
        expect(readFileSync(f, "utf-8")).not.toContain(markLiteral);
      }
    }
  });

  it("saves kflow as devDependency by default", () => {
    // Create a minimal package.json first
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({ name: "test-project", version: "1.0.0" })
    );
    init("--platform=codex");
    const pkg = JSON.parse(readFileSync(join(tempDir, "package.json"), "utf-8"));
    expect(pkg.devDependencies).toBeDefined();
    expect(pkg.devDependencies["kflow"]).toBeTruthy();
  });

  it("init --platform=claude creates .claude/skills/ with packaged skills", () => {
    init("--platform=claude");
    const claudeSkillsDir = join(tempDir, ".claude/skills");
    expect(existsSync(claudeSkillsDir)).toBe(true);
    expect(statSync(claudeSkillsDir).isDirectory()).toBe(true);
    expect(existsSync(join(claudeSkillsDir, "k-flow/SKILL.md"))).toBe(true);
    expect(existsSync(join(claudeSkillsDir, "k-onboard/SKILL.md"))).toBe(true);
  });

  it("init --platform=codex does not create .claude/skills/", () => {
    init("--platform=codex");
    expect(existsSync(join(tempDir, ".claude/skills"))).toBe(false);
  });

  it("init --platform=cursor creates .agents/skills/ with skills", () => {
    init("--platform=cursor");
    const skillsDir = join(tempDir, ".agents/skills");
    expect(statSync(skillsDir).isDirectory()).toBe(true);
    expect(existsSync(join(skillsDir, "k-flow/SKILL.md"))).toBe(true);
    expect(existsSync(join(skillsDir, "k-onboard/SKILL.md"))).toBe(true);
    expect(existsSync(join(tempDir, ".claude/skills"))).toBe(false);
  });

  it("init --platform=opencode creates .agents/skills/ with skills", () => {
    init("--platform=opencode");
    const skillsDir = join(tempDir, ".agents/skills");
    expect(statSync(skillsDir).isDirectory()).toBe(true);
    expect(existsSync(join(skillsDir, "k-flow/SKILL.md"))).toBe(true);
    expect(existsSync(join(skillsDir, "k-onboard/SKILL.md"))).toBe(true);
    expect(existsSync(join(tempDir, ".claude/skills"))).toBe(false);
  });

  it("init --platform=claude,codex installs to both .claude/skills/ and .agents/skills/", () => {
    const { stdout } = init("--platform=claude,codex");
    // Both runtime dirs exist with skills
    const agentsDir = join(tempDir, ".agents/skills");
    expect(statSync(agentsDir).isDirectory()).toBe(true);
    expect(existsSync(join(agentsDir, "k-flow/SKILL.md"))).toBe(true);

    const claudeDir = join(tempDir, ".claude/skills");
    expect(statSync(claudeDir).isDirectory()).toBe(true);
    expect(existsSync(join(claudeDir, "k-flow/SKILL.md"))).toBe(true);

    // stdout mentions both platforms
    expect(stdout).toContain("claude");
    expect(stdout).toContain("codex");

    // meta.json lists both
    const meta = JSON.parse(readFileSync(join(tempDir, ".kflow/meta.json"), "utf-8"));
    const names = meta.platforms.map((e: any) => e.name);
    expect(names).toContain("claude");
    expect(names).toContain("codex");
  });

  it("init --platform=codex,cursor,opencode shares one .agents/skills/ without duplicating", () => {
    init("--platform=codex,cursor,opencode");
    // .agents/skills/ exists exactly once
    const agentsDir = join(tempDir, ".agents/skills");
    expect(statSync(agentsDir).isDirectory()).toBe(true);
    expect(existsSync(join(agentsDir, "k-flow/SKILL.md"))).toBe(true);
    // .claude/skills/ should not exist
    expect(existsSync(join(tempDir, ".claude/skills"))).toBe(false);
  });

  it("meta.json records selected platforms with version", () => {
    const pkg = JSON.parse(readFileSync(resolve(CLI, "../../package.json"), "utf-8"));
    init("--platform=claude,codex");
    const meta = JSON.parse(readFileSync(join(tempDir, ".kflow/meta.json"), "utf-8"));
    expect(meta.version).toBe(pkg.version);
    const names = meta.platforms.map((e: any) => e.name);
    expect(names).toContain("claude");
    expect(names).toContain("codex");
  });

  it("blocks before overwriting malformed authoritative Installation State", () => {
    init("--platform=codex");
    const metaPath = join(tempDir, ".kflow/meta.json");
    writeFileSync(metaPath, "{not-json");

    const { stdout, exitCode } = init("--platform=claude");

    expect(exitCode).not.toBe(0);
    expect(stdout).toContain("Installation State is malformed");
    expect(readFileSync(metaPath, "utf-8")).toBe("{not-json");
    expect(existsSync(join(tempDir, ".claude/skills"))).toBe(false);
  });

  it("init --platform=claude writes CLAUDE.md pointing at .claude/skills/", () => {
    init("--platform=claude");
    const claudeMd = readFileSync(join(tempDir, "CLAUDE.md"), "utf-8");
    expect(claudeMd).toContain(".claude/skills/");
    expect(claudeMd).not.toContain(".agents/skills/");
  });

  it("--no-save leaves package.json unchanged", () => {
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({ name: "test-project" })
    );
    init("--no-save", "--platform=codex");
    const pkg = JSON.parse(readFileSync(join(tempDir, "package.json"), "utf-8"));
    expect(pkg.devDependencies).toBeUndefined();
    expect(pkg.dependencies).toBeUndefined();
    expect(pkg.name).toBe("test-project");
  });
});
