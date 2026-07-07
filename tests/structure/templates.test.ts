import { describe, it, expect } from "vitest";
import { readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "../..");

describe("Templates — platform-neutral Markdown only", () => {
  const templatesDir = join(REPO_ROOT, "templates");

  it("templates/ directory exists", () => {
    expect(existsSync(templatesDir)).toBe(true);
    expect(statSync(templatesDir).isDirectory()).toBe(true);
  });

  it("contains shared reference Markdown files", () => {
    const files = readdirSync(templatesDir);
    expect(files).toContain("shared-paths.md");
    expect(files).toContain("system-overview.md");
    expect(files).toContain("shared-conventions.md");
    expect(files).toContain("tools.md");
  });

  it("contains only .md files (platform-neutral)", () => {
    const files = readdirSync(templatesDir, { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile()) continue;
      expect(
        file.name.endsWith(".md"),
        `"templates/${file.name}" is not Markdown — found non-platform-neutral file`
      ).toBe(true);
    }
  });

  it("contains no Python or shell scripts", () => {
    const files = readdirSync(templatesDir);
    const nonMd = files.filter(
      (f) => !f.endsWith(".md") && !f.startsWith(".")
    );
    expect(nonMd).toHaveLength(0);
  });
});
