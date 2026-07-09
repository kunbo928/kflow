import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync, statSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tempProject } from "./cli-helpers/temp";
import { run } from "./cli-helpers/run";

describe("kflow sync", () => {
  let cwd: string;

  beforeEach(() => {
    cwd = tempProject();
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  function init(args: string[] = []) {
    return run(["init", "--platform=codex", ...args], cwd);
  }

  function sync(args: string[] = []): { stdout: string; exitCode: number } {
    return run(["sync", ...args], cwd);
  }

  it("installs skills/ into .agents/skills/", () => {
    init();
    const { exitCode } = sync();
    expect(exitCode).toBe(0);

    const skillsDir = join(cwd, ".agents/skills");
    expect(existsSync(skillsDir)).toBe(true);
    expect(statSync(skillsDir).isDirectory()).toBe(true);

    // Spot-check a known skill
    expect(existsSync(join(skillsDir, "k-flow/SKILL.md"))).toBe(true);
    expect(existsSync(join(skillsDir, "k-onboard/SKILL.md"))).toBe(true);
  });

  it("refreshes .claude/skills/ when Claude installed", () => {
    run(["init", "--platform=claude"], cwd);
    // Remove the runtime dir so sync must recreate it
    rmSync(join(cwd, ".claude"), { recursive: true, force: true });

    const { exitCode } = sync();
    expect(exitCode).toBe(0);

    const claudeSkillsDir = join(cwd, ".claude/skills");
    expect(existsSync(claudeSkillsDir)).toBe(true);
    expect(statSync(claudeSkillsDir).isDirectory()).toBe(true);
    expect(existsSync(join(claudeSkillsDir, "k-flow/SKILL.md"))).toBe(true);
    expect(existsSync(join(claudeSkillsDir, "k-onboard/SKILL.md"))).toBe(true);
  });

  it("codex-only sync does not create .claude/skills/", () => {
    init();
    rmSync(join(cwd, ".agents"), { recursive: true, force: true });

    const { exitCode } = sync();
    expect(exitCode).toBe(0);
    expect(existsSync(join(cwd, ".agents/skills/k-flow/SKILL.md"))).toBe(true);
    expect(existsSync(join(cwd, ".claude/skills"))).toBe(false);
  });

  it("codex,cursor,opencode sync refreshes .agents/skills/ once, not .claude/", () => {
    run(["init", "--platform=codex,cursor,opencode"], cwd);
    rmSync(join(cwd, ".agents"), { recursive: true, force: true });

    const { exitCode } = sync();
    expect(exitCode).toBe(0);
    expect(existsSync(join(cwd, ".agents/skills/k-flow/SKILL.md"))).toBe(true);
    expect(existsSync(join(cwd, ".claude/skills"))).toBe(false);
  });

  it("claude,codex sync refreshes both .claude/skills/ and .agents/skills/", () => {
    run(["init", "--platform=claude,codex"], cwd);
    rmSync(join(cwd, ".agents"), { recursive: true, force: true });
    rmSync(join(cwd, ".claude"), { recursive: true, force: true });

    const { exitCode } = sync();
    expect(exitCode).toBe(0);
    expect(existsSync(join(cwd, ".claude/skills/k-flow/SKILL.md"))).toBe(true);
    expect(existsSync(join(cwd, ".agents/skills/k-flow/SKILL.md"))).toBe(true);
  });

  it("repairs Codex .agents/skills/ when missing", () => {
    init();
    rmSync(join(cwd, ".agents"), { recursive: true, force: true });

    const { exitCode } = sync();
    expect(exitCode).toBe(0);

    const skillsDir = join(cwd, ".agents/skills");
    expect(existsSync(skillsDir)).toBe(true);
    expect(statSync(skillsDir).isDirectory()).toBe(true);
    expect(existsSync(join(skillsDir, "k-flow/SKILL.md"))).toBe(true);
    expect(existsSync(join(skillsDir, "k-onboard/SKILL.md"))).toBe(true);
  });

  it("refreshes stale kflow-owned file", () => {
    init();
    // Mutate a reference file
    const checklist = join(cwd, ".kflow/reference/shared-checklist.md");
    writeFileSync(checklist, "corrupted content");
    expect(readFileSync(checklist, "utf-8")).toBe("corrupted content");

    sync();
    // Should be restored to original content
    expect(readFileSync(checklist, "utf-8")).not.toBe("corrupted content");
    expect(readFileSync(checklist, "utf-8")).toContain("checklist");
  });

  it("preserves user-owned content", () => {
    init();
    // Create user content
    const featuresDir = join(cwd, ".kflow/features");
    const userFile = join(featuresDir, "my-feature.md");
    writeFileSync(userFile, "my feature notes");

    // Edit attention.md (user-owned scaffold)
    const attention = join(cwd, ".kflow/attention.md");
    writeFileSync(attention, "my custom attention rules");

    sync();

    // User content untouched
    expect(readFileSync(userFile, "utf-8")).toBe("my feature notes");
    expect(readFileSync(attention, "utf-8")).toBe("my custom attention rules");
  });

  it("deletes stale files from .agents/skills/", () => {
    init();
    sync();

    // Add a file that does not exist in the package source
    const staleFile = join(cwd, ".agents/skills/k-flow/stale.md");
    writeFileSync(staleFile, "stale content");
    expect(existsSync(staleFile)).toBe(true);

    sync();

    // Stale file should be deleted
    expect(existsSync(staleFile)).toBe(false);
    // Real skill file should still exist
    expect(existsSync(join(cwd, ".agents/skills/k-flow/SKILL.md"))).toBe(true);
  });

  it("deletes stale files from .claude/skills/", () => {
    run(["init", "--platform=claude"], cwd);
    sync();

    // Add a file that does not exist in the package source
    const staleFile = join(cwd, ".claude/skills/k-flow/stale.md");
    writeFileSync(staleFile, "stale content");
    expect(existsSync(staleFile)).toBe(true);

    sync();

    // Stale file should be deleted
    expect(existsSync(staleFile)).toBe(false);
    // Real skill file should still exist
    expect(existsSync(join(cwd, ".claude/skills/k-flow/SKILL.md"))).toBe(true);
  });

  it("preserves non-kflow skill under .claude/skills/", () => {
    run(["init", "--platform=claude"], cwd);
    sync();

    // Create a non-kflow skill directory
    mkdirSync(join(cwd, ".claude/skills/my-custom"), { recursive: true });
    const customSkill = join(cwd, ".claude/skills/my-custom/SKILL.md");
    writeFileSync(customSkill, "custom skill content");
    expect(existsSync(customSkill)).toBe(true);

    sync();

    // Non-kflow skill preserved
    expect(existsSync(customSkill)).toBe(true);
    expect(readFileSync(customSkill, "utf-8")).toBe("custom skill content");
    // kflow skills still refreshed
    expect(existsSync(join(cwd, ".claude/skills/k-flow/SKILL.md"))).toBe(true);
  });

  it("preserves non-kflow skill under .agents/skills/", () => {
    init();
    sync();

    // Create a non-kflow skill directory
    mkdirSync(join(cwd, ".agents/skills/my-custom"), { recursive: true });
    const customSkill = join(cwd, ".agents/skills/my-custom/SKILL.md");
    writeFileSync(customSkill, "custom skill content");
    expect(existsSync(customSkill)).toBe(true);

    sync();

    // Non-kflow skill preserved
    expect(existsSync(customSkill)).toBe(true);
    expect(readFileSync(customSkill, "utf-8")).toBe("custom skill content");
    // kflow skills still refreshed
    expect(existsSync(join(cwd, ".agents/skills/k-flow/SKILL.md"))).toBe(true);
  });

  it("restores corrupted kflow skill file in .claude/skills/", () => {
    run(["init", "--platform=claude"], cwd);
    sync();

    // Corrupt a kflow skill file
    const skillFile = join(cwd, ".claude/skills/k-flow/SKILL.md");
    writeFileSync(skillFile, "corrupted content");
    expect(readFileSync(skillFile, "utf-8")).toBe("corrupted content");

    sync();

    // Should be restored (not corrupted)
    expect(readFileSync(skillFile, "utf-8")).not.toBe("corrupted content");
  });

  it("restores corrupted kflow skill file in .agents/skills/", () => {
    init();
    sync();

    // Corrupt a kflow skill file
    const skillFile = join(cwd, ".agents/skills/k-flow/SKILL.md");
    writeFileSync(skillFile, "corrupted content");
    expect(readFileSync(skillFile, "utf-8")).toBe("corrupted content");

    sync();

    // Should be restored (not corrupted)
    expect(readFileSync(skillFile, "utf-8")).not.toBe("corrupted content");
  });

  it("deletes stale files from .kflow/reference/ and .kflow/tools/", () => {
    init();
    sync();

    // Add manual files that don't exist in the package source
    const staleRef = join(cwd, ".kflow/reference/manual-note.md");
    const staleTool = join(cwd, ".kflow/tools/manual-script.py");
    writeFileSync(staleRef, "manual reference");
    writeFileSync(staleTool, "manual tool");
    expect(existsSync(staleRef)).toBe(true);
    expect(existsSync(staleTool)).toBe(true);

    sync();

    // Stale files should be deleted
    expect(existsSync(staleRef)).toBe(false);
    expect(existsSync(staleTool)).toBe(false);
    // Known real files should still exist
    expect(existsSync(join(cwd, ".kflow/reference/shared-checklist.md"))).toBe(true);
    expect(existsSync(join(cwd, ".kflow/tools/validate-yaml.py"))).toBe(true);
  });

  it("is idempotent across repeated runs", () => {
    init();
    const { exitCode: exit1 } = sync();
    expect(exit1).toBe(0);

    const { exitCode: exit2 } = sync();
    expect(exit2).toBe(0);

    // Known real file still intact after second sync
    expect(existsSync(join(cwd, ".agents/skills/k-flow/SKILL.md"))).toBe(true);
  });

  it("is idempotent across repeated runs for claude+codex", () => {
    run(["init", "--platform=claude,codex"], cwd);
    const { exitCode: exit1 } = sync();
    expect(exit1).toBe(0);

    const { exitCode: exit2 } = sync();
    expect(exit2).toBe(0);

    // Both dirs still have skills
    expect(existsSync(join(cwd, ".claude/skills/k-flow/SKILL.md"))).toBe(true);
    expect(existsSync(join(cwd, ".agents/skills/k-flow/SKILL.md"))).toBe(true);
  });
});
