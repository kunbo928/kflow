import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tempProject } from "./cli-helpers/temp";
import { run } from "./cli-helpers/run";

describe("kflow doctor", () => {
  let cwd: string;

  beforeEach(() => {
    cwd = tempProject();
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  function init(args: string[] = []) {
    return run(["init", ...args], cwd);
  }

  function doctor(args: string[] = []): { stdout: string; exitCode: number } {
    return run(["doctor", ...args], cwd);
  }

  it("healthy project: exit 0, reports structure + platform + dependency", () => {
    // Create package.json so init saves devDependency
    writeFileSync(
      join(cwd, "package.json"),
      JSON.stringify({ name: "test", version: "1.0.0" })
    );
    init(["--platform=codex"]);
    const { stdout, exitCode } = doctor();

    expect(exitCode).toBe(0);
    expect(stdout).toContain("OK");
    expect(stdout).toContain(".kflow/");
    expect(stdout).toContain("devDependencies");
  });

  it("missing dependency: exit non-zero, warns about non-reproducible tools", () => {
    // init with --no-save: no package.json dependency
    init(["--no-save", "--platform=codex"]);
    const { stdout, exitCode } = doctor();

    expect(exitCode).not.toBe(0);
    expect(stdout).toContain("MISSING");
    expect(stdout).toContain("devDependencies");
  });

  it("broken structure: exit non-zero, reports missing .kflow/ path", () => {
    init(["--platform=codex"]);
    // Nuke .kflow/reference/ to simulate stale/broken state
    const refDir = join(cwd, ".kflow/reference");
    rmSync(refDir, { recursive: true, force: true });

    const { stdout, exitCode } = doctor();
    expect(exitCode).not.toBe(0);
    expect(stdout).toContain("MISSING");
    expect(stdout).toContain(".kflow/");
  });

  it("uses authoritative Installation State for a Claude-only project", () => {
    writeFileSync(
      join(cwd, "package.json"),
      JSON.stringify({ name: "test", version: "1.0.0" }),
    );
    init(["--platform=claude"]);

    const { stdout, exitCode } = doctor();

    expect(exitCode).toBe(0);
    expect(stdout).toContain("OK — Installed Platforms");
  });

  it("reports malformed authoritative Installation State as missing platforms", () => {
    writeFileSync(
      join(cwd, "package.json"),
      JSON.stringify({ name: "test", version: "1.0.0" }),
    );
    init(["--platform=codex"]);
    writeFileSync(join(cwd, ".kflow/meta.json"), "{not-json");

    const { stdout, exitCode } = doctor();

    expect(exitCode).not.toBe(0);
    expect(stdout).toContain("MISSING — Installed Platforms");
  });
});
