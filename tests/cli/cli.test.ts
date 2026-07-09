import { describe, it, expect } from "vitest";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { tempProject } from "../cli-helpers/temp";
import { run } from "../cli-helpers/run";

const ALL_COMMANDS = ["init", "search", "validate", "doctor", "sync", "uninstall", "upgrade"];

describe("kflow CLI dispatch (commander)", () => {
  const REPO_ROOT = resolve(import.meta.dirname, "../..");

  // -----------------------------------------------------------------------
  // --version
  // -----------------------------------------------------------------------
  describe("--version", () => {
    it("prints the package version and exits 0", () => {
      const cwd = tempProject();
      const { stdout, exitCode } = run(["--version"], cwd);
      rmSync(cwd, { recursive: true, force: true });

      expect(exitCode).toBe(0);
      // Should match the version declared in package.json
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
    });

    it("-V shorthand also works", () => {
      const cwd = tempProject();
      const { stdout, exitCode } = run(["-V"], cwd);
      rmSync(cwd, { recursive: true, force: true });

      expect(exitCode).toBe(0);
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  // -----------------------------------------------------------------------
  // --help / -h
  // -----------------------------------------------------------------------
  describe("--help", () => {
    it("prints usage with program name and all commands", () => {
      const cwd = tempProject();
      const { stdout, exitCode } = run(["--help"], cwd);
      rmSync(cwd, { recursive: true, force: true });

      expect(exitCode).toBe(0);
      expect(stdout).toContain("kflow");
      expect(stdout).toContain("Usage:");
      for (const cmd of ALL_COMMANDS) {
        expect(stdout).toContain(cmd);
      }
    });

    it("-h also prints help", () => {
      const cwd = tempProject();
      const { stdout, exitCode } = run(["-h"], cwd);
      rmSync(cwd, { recursive: true, force: true });

      expect(exitCode).toBe(0);
      expect(stdout).toContain("kflow");
      for (const cmd of ALL_COMMANDS) {
        expect(stdout).toContain(cmd);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Unknown command
  // -----------------------------------------------------------------------
  describe("unknown command", () => {
    it("exits non-zero and reports the unknown command", () => {
      const cwd = tempProject();
      const { stdout, exitCode } = run(["not-a-real-command"], cwd);
      rmSync(cwd, { recursive: true, force: true });

      expect(exitCode).not.toBe(0);
      // Commander stderr goes to stdout in our run helper (pipe both)
      const output = stdout.toLowerCase();
      expect(output).toContain("not-a-real-command");
    });
  });

  // -----------------------------------------------------------------------
  // Routing reachability — every command is dispatched, not "unknown"
  // -----------------------------------------------------------------------
  describe("command routing", () => {
    for (const cmd of ALL_COMMANDS) {
      it(`routes "${cmd}" to its handler (not unknown-command help)`, () => {
        const cwd = tempProject();
        const args = cmd === "init" ? [cmd, "--platform=codex"] : [cmd];
        const { stdout, exitCode } = run(args, cwd);
        rmSync(cwd, { recursive: true, force: true });

        // Must NOT contain commander's unknown-command error text
        expect(stdout).not.toMatch(/error: unknown command/i);

        // Each command's own output is verified in its own test files,
        // but we assert the dispatch happened: install/validate/search
        // with no required args print their own usage/error (not commander's).
        if (cmd === "validate") {
          // validate with no args prints its own error
          expect(stdout).toContain("--file or --dir is required");
        }
        if (cmd === "search") {
          // search with no --dir prints its own error
          expect(stdout).toContain("--dir is required");
        }
      });
    }
  });
});
