import { describe, it, expect } from "vitest";
import { readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "../..");

describe("Skills Directory — flatness", () => {
  const skillsDir = join(REPO_ROOT, "skills");

  it("skills/ directory exists", () => {
    expect(existsSync(skillsDir)).toBe(true);
    expect(statSync(skillsDir).isDirectory()).toBe(true);
  });

  it("every immediate child is a directory", () => {
    const entries = readdirSync(skillsDir, { withFileTypes: true });
    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      expect(
        entry.isDirectory(),
        `"skills/${entry.name}" should be a directory, not a file`
      ).toBe(true);
    }
  });

  it("every immediate child contains a SKILL.md (AgentSkills.io shape)", () => {
    const entries = readdirSync(skillsDir, { withFileTypes: true }).filter(
      (e) => e.isDirectory()
    );

    for (const entry of entries) {
      const skillMd = join(skillsDir, entry.name, "SKILL.md");
      expect(
        existsSync(skillMd),
        `"skills/${entry.name}" is missing SKILL.md`
      ).toBe(true);
    }
  });

  it("includes known kflow skills", () => {
    const entries = readdirSync(skillsDir);
    expect(entries).toContain("k-flow");
    expect(entries).toContain("k-onboard");
    expect(entries).toContain("browser-bridge");
  });
});
