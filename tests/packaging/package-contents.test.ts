import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";

const REPO_ROOT = resolve(import.meta.dirname, "../..");

describe("npm package contents", () => {
  it("package.json defines kflow bin entrypoint", () => {
    const pkg = require(join(REPO_ROOT, "package.json")) as Record<
      string,
      unknown
    >;
    expect(pkg.name).toBe("kflow");
    expect(pkg.bin).toBeDefined();
    expect((pkg.bin as Record<string, string>)["kflow"]).toBeTruthy();
  });

  it("package.json files array includes dist, skills, templates, platforms", () => {
    const pkg = require(join(REPO_ROOT, "package.json")) as Record<
      string,
      unknown
    >;
    const files = pkg.files as string[];
    expect(files).toContain("dist");
    expect(files).toContain("skills");
    expect(files).toContain("templates");
    expect(files).toContain("platforms");
    expect(files).toContain("tools");
  });

  it("npm pack dry-run includes CLI build output", () => {
    // npm pack --dry-run lists tarball contents to stderr; merge via shell redirect
    const output = execSync("npm pack --dry-run 2>&1", {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      shell: true,
    });
    expect(output).toContain("dist/cli.js");
  });

  it("npm pack dry-run includes Skill Assets", () => {
    const output = execSync("npm pack --dry-run 2>&1", {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      shell: true,
    });
    expect(output).toMatch(/skills\/k-flow\/SKILL\.md/);
    expect(output).toMatch(/skills\/k-onboard\/SKILL\.md/);
  });

  it("npm pack dry-run includes Project Templates", () => {
    const output = execSync("npm pack --dry-run 2>&1", {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      shell: true,
    });
    expect(output).toContain("templates/shared-paths.md");
    expect(output).toContain("templates/system-overview.md");
  });

  it("npm pack dry-run includes Platform Plugin assets", () => {
    const output = execSync("npm pack --dry-run 2>&1", {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      shell: true,
    });
    expect(output).toContain("platforms/codex/");
  });

  it("npm pack dry-run includes tools (reference scripts)", () => {
    const output = execSync("npm pack --dry-run 2>&1", {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      shell: true,
    });
    expect(output).toContain("tools/search-yaml.py");
    expect(output).toContain("tools/validate-yaml.py");
  });

  it("CLI stub runs and exits 0", () => {
    const result = execSync("node dist/cli.js --help", {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    expect(result).toContain("kflow");
  });

  // ── Dependency boundary guard ───────────────────────────
  it("runtime dependencies stay within approved allowlist", () => {
    const pkg = require(join(REPO_ROOT, "package.json")) as Record<
      string,
      unknown
    >;
    const deps = Object.keys((pkg.dependencies ?? {}) as Record<string, string>);

    const APPROVED = new Set(["commander", "fast-glob", "yaml", "zod"]);
    const FORBIDDEN = [
      "@inquirer/prompts",
      "chalk",
      "ora",
      "posthog-node",
    ];
    const FORBIDDEN_PREFIX = "@changesets/";

    for (const dep of deps) {
      if (!APPROVED.has(dep)) {
        // Give a clear pointer to the dependency-policy docs
        expect(dep).toBe(
          `UNEXPECTED_RUNTIME_DEP: add to the approved allowlist or revert. See docs/site/upgrade/dependencies.md`
        );
      }
    }

    for (const dep of deps) {
      for (const banned of FORBIDDEN) {
        expect(dep).not.toBe(banned);
      }
      expect(dep.startsWith(FORBIDDEN_PREFIX)).toBe(false);
    }
  });
});
