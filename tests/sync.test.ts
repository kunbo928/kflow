import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { run } from "./cli-helpers/run";
import { tempProject } from "./cli-helpers/temp";

describe("kflow sync", () => {
  let cwd: string;

  beforeEach(() => {
    cwd = tempProject();
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it("wires authoritative Codex state to asset synchronization and preserves success output", () => {
    run(["init", "--platform=codex"], cwd);
    rmSync(join(cwd, ".agents"), { recursive: true, force: true });

    const { stdout, exitCode } = run(["sync"], cwd);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("kflow assets mirrored.");
    expect(existsSync(join(cwd, ".agents/skills/k-flow/SKILL.md"))).toBe(true);
    expect(existsSync(join(cwd, ".claude/skills"))).toBe(false);
  });

  it("wires authoritative Claude state to its native Runtime Skill Directory", () => {
    run(["init", "--platform=claude"], cwd);
    rmSync(join(cwd, ".claude"), { recursive: true, force: true });

    const { exitCode } = run(["sync"], cwd);

    expect(exitCode).toBe(0);
    expect(existsSync(join(cwd, ".claude/skills/k-flow/SKILL.md"))).toBe(true);
  });

  it("blocks before writes when authoritative Installation State is malformed", () => {
    run(["init", "--platform=codex"], cwd);
    const metaPath = join(cwd, ".kflow/meta.json");
    writeFileSync(metaPath, "{not-json");
    const skillPath = join(cwd, ".agents/skills/k-flow/SKILL.md");
    writeFileSync(skillPath, "locally changed");

    const { stdout, exitCode } = run(["sync"], cwd);

    expect(exitCode).not.toBe(0);
    expect(stdout).toContain("Installation State is malformed");
    expect(readFileSync(skillPath, "utf-8")).toBe("locally changed");
  });
});
