import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tempProject } from "../cli-helpers/temp";
import { run } from "../cli-helpers/run";

describe("kflow validate", () => {
  let cwd: string;

  beforeEach(() => {
    cwd = tempProject();
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  function validate(args: string[]): { stdout: string; exitCode: number } {
    return run(["validate", ...args], cwd);
  }

  function seedFile(name: string, content: string): string {
    const fp = join(cwd, name);
    writeFileSync(fp, content);
    return fp;
  }

  // ── Slice 12: single markdown file pass ─────────────────

  it("valid markdown frontmatter: exit 0, pass icon", () => {
    const fp = seedFile("ok.md", [
      "---",
      "doc_type: learning",
      "status: active",
      "---",
      "",
      "# Body",
    ].join("\n"));
    const { stdout, exitCode } = validate(["--file", fp]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("✓");
    expect(stdout).toContain("ok.md");
    expect(stdout).toContain("All files valid.");
  });

  // ── Slice 14: missing frontmatter ───────────────────────

  it("missing frontmatter: exit 1, error message", () => {
    const fp = seedFile("no-fm.md", "# No frontmatter\n\nJust text.");
    const { stdout, exitCode } = validate(["--file", fp]);
    expect(exitCode).toBe(1);
    expect(stdout).toContain("✗");
    expect(stdout).toContain("No opening '---' delimiter found");
  });

  // ── Slice 15: malformed YAML ────────────────────────────

  it("malformed YAML frontmatter: exit 1, syntax error", () => {
    const fp = seedFile("bad.md", [
      "---",
      "key: [unclosed",
      "---",
      "",
      "# Body",
    ].join("\n"));
    const { stdout, exitCode } = validate(["--file", fp]);
    expect(exitCode).toBe(1);
    expect(stdout).toContain("✗");
    expect(stdout).toContain("YAML syntax error");
  });

  // ── Slice 13: --yaml-only pure YAML ─────────────────────

  it("--yaml-only treats input as pure YAML", () => {
    const fp = seedFile("config.txt", "key: value\nlist: [a, b]");
    const { stdout, exitCode } = validate(["--file", fp, "--yaml-only"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("✓");
  });

  // ── Slice 16: --require missing field ───────────────────

  it("--require reports missing required field", () => {
    const fp = seedFile("partial.md", [
      "---",
      "doc_type: learning",
      "---",
      "",
      "# No status field",
    ].join("\n"));
    const { stdout, exitCode } = validate(["--file", fp, "--require", "status"]);
    expect(exitCode).toBe(1);
    expect(stdout).toContain("Missing required field: 'status'");
  });

  it("--require passes when required fields are present", () => {
    const fp = seedFile("complete.md", [
      "---",
      "doc_type: learning",
      "status: active",
      "---",
      "",
      "# All good",
    ].join("\n"));
    const { stdout, exitCode } = validate(["--file", fp, "--require", "doc_type", "--require", "status"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("All files valid.");
  });

  // ── Slice 17: --dir recursive ───────────────────────────

  it("--dir recursively validates .md files", () => {
    const dir = join(cwd, "docs");
    mkdirSync(dir);
    writeFileSync(join(dir, "a.md"), [
      "---",
      "key: value",
      "---",
      "",
      "# A",
    ].join("\n"));
    writeFileSync(join(dir, "b.md"), [
      "---",
      "key: value",
      "---",
      "",
      "# B",
    ].join("\n"));
    const { stdout, exitCode } = validate(["--dir", dir]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Validated 2 file(s): 2 passed, 0 failed.");
    expect(stdout).toContain("All files valid.");
  });

  it("--dir with mixed pass/fail reports counts and exit 1", () => {
    const dir = join(cwd, "mixed");
    mkdirSync(dir);
    writeFileSync(join(dir, "good.md"), [
      "---",
      "key: value",
      "---",
      "",
      "# Good",
    ].join("\n"));
    writeFileSync(join(dir, "bad.md"), "# No frontmatter");
    const { stdout, exitCode } = validate(["--dir", dir]);
    expect(exitCode).toBe(1);
    expect(stdout).toContain("1 passed");
    expect(stdout).toContain("1 failed");
    expect(stdout).toContain("1 file(s) have YAML errors.");
  });

  // ── Slice 18: --json output ─────────────────────────────

  it("--json outputs structured result", () => {
    const fp = seedFile("ok2.md", [
      "---",
      "doc_type: decision",
      "status: accepted",
      "---",
      "",
      "# OK",
    ].join("\n"));
    const { stdout } = validate(["--file", fp, "--json"]);
    const parsed = JSON.parse(stdout);
    expect(parsed.total).toBe(1);
    expect(parsed.passed).toBe(1);
    expect(parsed.failed).toBe(0);
    expect(parsed.results[0].status).toBe("pass");
    expect(parsed.results[0].fields).toContain("doc_type");
  });

  // ── Slice 20: exit codes ────────────────────────────────

  it("exit code 2 for file-not-found", () => {
    const { exitCode } = validate(["--file", "/no/such/file.md"]);
    expect(exitCode).toBe(2);
  });

  it("exit code 2 for directory-not-found", () => {
    const { exitCode } = validate(["--dir", "/no/such/dir"]);
    expect(exitCode).toBe(2);
  });

  // ── Zod mapping contract: top-level array rejected ──────

  it("top-level YAML array in markdown frontmatter: exit 1, mapping error", () => {
    const fp = seedFile("arr.md", [
      "---",
      "- a",
      "- b",
      "---",
      "",
      "# Body",
    ].join("\n"));
    const { stdout, exitCode } = validate(["--file", fp]);
    expect(exitCode).toBe(1);
    expect(stdout).toContain("Expected a mapping, got array");
  });

  // ── Zod mapping contract: top-level scalar rejected ─────

  it("top-level YAML scalar in markdown frontmatter: exit 1, mapping error", () => {
    const fp = seedFile("scalar.md", [
      "---",
      "hello world",
      "---",
      "",
      "# Body",
    ].join("\n"));
    const { stdout, exitCode } = validate(["--file", fp]);
    expect(exitCode).toBe(1);
    expect(stdout).toContain("Expected a mapping");
  });

  // ── Zod mapping contract: --yaml-only with array ────────

  it("--yaml-only with top-level array: exit 1, mapping error", () => {
    const fp = seedFile("arr.yaml", "- a\n- b\n");
    const { stdout, exitCode } = validate(["--file", fp, "--yaml-only"]);
    expect(exitCode).toBe(1);
    expect(stdout).toContain("Expected a mapping, got array");
  });

  // ── --json with missing required field preserves error string

  it("--json output includes errors array with required-field message", () => {
    const fp = seedFile("partial2.md", [
      "---",
      "doc_type: learning",
      "---",
      "",
      "# No status field",
    ].join("\n"));
    const { stdout } = validate(["--file", fp, "--require", "status", "--json"]);
    const parsed = JSON.parse(stdout);
    expect(parsed.results[0].status).toBe("fail");
    expect(parsed.results[0].errors).toContain("Missing required field: 'status'");
  });

  // ── node_modules exclusion ──────────────────────────────

  it("skips node_modules during directory scanning", () => {
    const dir = join(cwd, "docs");
    mkdirSync(dir);
    writeFileSync(join(dir, "good.md"), [
      "---",
      "key: value",
      "---",
      "",
      "# Good",
    ].join("\n"));
    mkdirSync(join(dir, "node_modules"));
    writeFileSync(join(dir, "node_modules", "bad.md"), "# No frontmatter");
    const { stdout, exitCode } = validate(["--dir", dir]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Validated 1 file(s): 1 passed, 0 failed.");
    expect(stdout).not.toContain("bad.md");
    expect(stdout).not.toContain("node_modules");
  });
});
