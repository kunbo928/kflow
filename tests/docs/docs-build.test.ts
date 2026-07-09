import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "../..");
const DOCS_SITE = join(REPO_ROOT, "docs/site");
const BUILD_OUT = join(DOCS_SITE, ".vitepress/dist");

/** Run `vitepress build` and return exit code + stdout. */
function buildDocs(): { exitCode: number; stdout: string } {
  let stdout = "";
  let exitCode = 0;
  try {
    stdout = execSync("npx vitepress build docs/site", {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e: any) {
    exitCode = e.status ?? 1;
    stdout = e.stdout?.toString() ?? "";
  }
  return { exitCode, stdout };
}

describe("Documentation Site — build", () => {
  it(
    "build exits 0",
    () => {
      const { exitCode, stdout } = buildDocs();
      expect(exitCode, `build stdout:\n${stdout}`).toBe(0);
    },
    120_000
  );

  it("landing page exists", () => {
    expect(existsSync(join(BUILD_OUT, "index.html"))).toBe(true);
  });

  it("getting-started page exists", () => {
    expect(existsSync(join(BUILD_OUT, "guide/getting-started.html"))).toBe(
      true
    );
  });

  it("CLI reference pages exist", () => {
    const pages = [
      "cli/init.html",
      "cli/sync.html",
      "cli/doctor.html",
      "cli/install.html",
      "cli/search.html",
      "cli/validate.html",
    ];
    for (const p of pages) {
      expect(existsSync(join(BUILD_OUT, p)), `missing ${p}`).toBe(true);
    }
  });

  it("workflows page exists", () => {
    expect(existsSync(join(BUILD_OUT, "workflows/k-flow.html"))).toBe(true);
  });

  it("platform guide pages exist", () => {
    const pages = [
      "platforms/codex.html",
      "platforms/cursor.html",
      "platforms/claude.html",
      "platforms/opencode.html",
    ];
    for (const p of pages) {
      expect(existsSync(join(BUILD_OUT, p)), `missing ${p}`).toBe(true);
    }
  });

  it("concepts page exists", () => {
    expect(existsSync(join(BUILD_OUT, "concepts/index.html"))).toBe(true);
  });

  it("upgrade page exists", () => {
    expect(existsSync(join(BUILD_OUT, "upgrade/index.html"))).toBe(true);
  });
});
