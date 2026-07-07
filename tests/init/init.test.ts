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
      stdout = e.stdout?.toString() ?? "";
    }
    return { stdout, exitCode };
  }

  it("creates .kflow/ directory", () => {
    init();
    const kflowDir = join(tempDir, ".kflow");
    expect(existsSync(kflowDir)).toBe(true);
    expect(statSync(kflowDir).isDirectory()).toBe(true);
  });

  it("creates aggregation subdirectories without .gitkeep", () => {
    init();
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
    const { exitCode } = init();
    expect(exitCode).toBe(0);
  });

  it("creates .kflow/attention.md with minimal template", () => {
    init();
    const attention = readFileSync(join(tempDir, ".kflow/attention.md"), "utf-8");
    expect(attention).toContain("# Attention");
    expect(attention).toContain("kflow");
  });

  it("creates .kflow/architecture/ARCHITECTURE.md with placeholder template", () => {
    init();
    const archDir = join(tempDir, ".kflow/architecture");
    expect(statSync(archDir).isDirectory()).toBe(true);

    const arch = readFileSync(join(archDir, "ARCHITECTURE.md"), "utf-8");
    expect(arch).toContain("架构总入口");
    expect(arch).toContain("骨架");
  });

  it("copies templates/ into .kflow/reference/", () => {
    init();
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
    init();
    const toolsDir = join(tempDir, ".kflow/tools");
    expect(statSync(toolsDir).isDirectory()).toBe(true);

    const files = readdirSync(toolsDir);
    expect(files).toContain("search-yaml.py");
    expect(files).toContain("validate-yaml.py");
  });

  it("copies skills/ into .agents/skills/", () => {
    init();
    const skillsDir = join(tempDir, ".agents/skills");
    expect(statSync(skillsDir).isDirectory()).toBe(true);
    expect(existsSync(join(skillsDir, "k-flow/SKILL.md"))).toBe(true);
    expect(existsSync(join(skillsDir, "k-onboard/SKILL.md"))).toBe(true);
  });

  it("generates AGENTS.md with Codex default platform marker", () => {
    init();
    const agents = readFileSync(join(tempDir, "AGENTS.md"), "utf-8");
    expect(agents).toContain("kflow");
    expect(agents).toContain("k-flow");
    expect(agents).toContain("Codex");
  });

  it("stdout tells user k-flow is the Skill Workflow entrypoint", () => {
    const { stdout } = init();
    expect(stdout).toContain("k-flow");
  });

  it("saves kflow as devDependency by default", () => {
    // Create a minimal package.json first
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({ name: "test-project", version: "1.0.0" })
    );
    init();
    const pkg = JSON.parse(readFileSync(join(tempDir, "package.json"), "utf-8"));
    expect(pkg.devDependencies).toBeDefined();
    expect(pkg.devDependencies["kflow"]).toBeTruthy();
  });

  it("--no-save leaves package.json unchanged", () => {
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({ name: "test-project" })
    );
    init("--no-save");
    const pkg = JSON.parse(readFileSync(join(tempDir, "package.json"), "utf-8"));
    expect(pkg.devDependencies).toBeUndefined();
    expect(pkg.dependencies).toBeUndefined();
    expect(pkg.name).toBe("test-project");
  });
});
