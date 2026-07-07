import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tempProject } from "../cli-helpers/temp";
import { run } from "../cli-helpers/run";

/** Write .md files with YAML frontmatter into a temp directory. */
function seedDocs(cwd: string) {
  const dir = join(cwd, "docs");
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, "one.md"),
    [
      "---",
      "doc_type: learning",
      "track: knowledge",
      "tags: [prisma, database, orm]",
      "date: 2025-01-15",
      "---",
      "",
      "# One",
      "This document covers shadow database setup with Prisma.",
    ].join("\n")
  );

  writeFileSync(
    join(dir, "two.md"),
    [
      "---",
      "doc_type: decision",
      "track: architecture",
      "framework: Vue 3",
      "date: 2025-03-20",
      "---",
      "",
      "# Two",
      "We decided to use Vue 3 for the frontend.",
    ].join("\n")
  );

  writeFileSync(
    join(dir, "three.md"),
    [
      "---",
      "doc_type: explore",
      "tags: [database, shadow]",
      "date: 2025-06-01",
      "---",
      "",
      "# Three",
      "Exploring shadow databases in different environments.",
    ].join("\n")
  );

  writeFileSync(
    join(dir, "no-fm.md"),
    [
      "# No Frontmatter",
      "",
      "This file has no YAML frontmatter block.",
    ].join("\n")
  );

  // nested subdirectory
  mkdirSync(join(dir, "nested"));
  writeFileSync(
    join(dir, "nested", "nested.md"),
    [
      "---",
      "doc_type: learning",
      "framework: React",
      "date: 2025-01-10",
      "---",
      "",
      "# Nested",
      "Learning about React hooks.",
    ].join("\n")
  );

  return dir;
}

describe("kflow search", () => {
  let cwd: string;

  beforeEach(() => {
    cwd = tempProject();
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  function search(args: string[]): { stdout: string; exitCode: number } {
    return run(["search", ...args], cwd);
  }

  // ── Slice 1: basic filter (exact match) ─────────────────

  it("filter exact match returns matching docs only", () => {
    const dir = seedDocs(cwd);
    const { stdout, exitCode } = search(["--dir", dir, "--filter", "doc_type=learning"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Found 2 document(s).");
    expect(stdout).toContain("one.md");
    expect(stdout).toContain("nested.md");
    expect(stdout).not.toContain("two.md");
    expect(stdout).not.toContain("three.md");
  });

  it("filter exact match with no results prints no-matches message", () => {
    const dir = seedDocs(cwd);
    const { stdout, exitCode } = search(["--dir", dir, "--filter", "doc_type=nonexistent"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("No matching documents found.");
    expect(stdout).not.toContain("Found");
  });

  // ── Slice 2: OR pipe filter ─────────────────────────────

  it("OR pipe filter matches any candidate", () => {
    const dir = seedDocs(cwd);
    const { stdout } = search(["--dir", dir, "--filter", "doc_type=learning|decision"]);
    expect(stdout).toContain("Found 3 document(s).");
    expect(stdout).toContain("one.md");
    expect(stdout).toContain("two.md");
    expect(stdout).toContain("nested.md");
  });

  // ── Slice 3: AND repeated filter ────────────────────────

  it("AND repeated filters narrow results", () => {
    const dir = seedDocs(cwd);
    const { stdout } = search([
      "--dir", dir,
      "--filter", "doc_type=learning",
      "--filter", "track=knowledge",
    ]);
    expect(stdout).toContain("Found 1 document(s).");
    expect(stdout).toContain("one.md");
  });

  // ── Slice 4: substring ~= operator ──────────────────────

  it("substring ~= on list field matches element-in", () => {
    const dir = seedDocs(cwd);
    const { stdout } = search(["--dir", dir, "--filter", "tags~=prisma"]);
    expect(stdout).toContain("Found 1 document(s).");
    expect(stdout).toContain("one.md");
  });

  it("substring ~= on string field matches substring", () => {
    const dir = seedDocs(cwd);
    const { stdout } = search(["--dir", dir, "--filter", "framework~=vue"]);
    expect(stdout).toContain("Found 1 document(s).");
    expect(stdout).toContain("two.md");
  });

  // ── Slice 5: full-text query ────────────────────────────

  it("full-text query searches body and meta values case-insensitively", () => {
    const dir = seedDocs(cwd);
    const { stdout } = search(["--dir", dir, "--query", "shadow database"]);
    // "shadow database" is a substring of "shadow databases" in three.md too
    expect(stdout).toContain("Found 2 document(s).");
    expect(stdout).toContain("one.md");
    expect(stdout).toContain("three.md");
  });

  it("full-text query combined with filters", () => {
    const dir = seedDocs(cwd);
    const { stdout } = search([
      "--dir", dir,
      "--filter", "doc_type=learning",
      "--query", "shadow",
    ]);
    expect(stdout).toContain("Found 1 document(s).");
    expect(stdout).toContain("one.md");
  });

  // ── Slice 6: sort-by + missing-to-end ───────────────────

  it("sort-by date desc (newest first)", () => {
    const dir = seedDocs(cwd);
    const { stdout } = search(["--dir", dir, "--sort-by", "date", "--order", "desc"]);
    expect(stdout).toContain("Found 5 document(s).");
    // three.md (2025-06-01) should appear before one.md (2025-01-15)
    const threeIdx = stdout.indexOf("three.md");
    const oneIdx = stdout.indexOf("one.md");
    expect(threeIdx).toBeGreaterThan(-1);
    expect(oneIdx).toBeGreaterThan(-1);
    expect(threeIdx).toBeLessThan(oneIdx);
  });

  it("sort-by date asc (oldest first)", () => {
    const dir = seedDocs(cwd);
    const { stdout } = search(["--dir", dir, "--sort-by", "date", "--order", "asc"]);
    expect(stdout).toContain("Found 5 document(s).");
    // nested.md (2025-01-10) should appear before three.md (2025-06-01)
    const nestedIdx = stdout.indexOf("nested.md");
    const threeIdx = stdout.indexOf("three.md");
    expect(nestedIdx).toBeGreaterThan(-1);
    expect(threeIdx).toBeGreaterThan(-1);
    expect(nestedIdx).toBeLessThan(threeIdx);
  });

  it("sort-by pushes docs missing the field to the end", () => {
    const dir = seedDocs(cwd);
    const { stdout } = search(["--dir", dir, "--sort-by", "framework", "--order", "asc"]);
    expect(stdout).toContain("Found 5 document(s).");
    // Docs with framework appear first, missing-field docs last
    const nestedIdx = stdout.indexOf("nested.md");
    const twoIdx = stdout.indexOf("two.md");
    const noFmIdx = stdout.indexOf("no-fm.md");
    // nested.md and two.md (have framework) appear before no-fm.md/one.md/three.md (missing framework)
    expect(nestedIdx).toBeLessThan(noFmIdx);
    expect(twoIdx).toBeLessThan(noFmIdx);
  });

  // ── Slice 7: --full output ──────────────────────────────

  it("--full prints body content", () => {
    const dir = seedDocs(cwd);
    const { stdout } = search(["--dir", dir, "--filter", "doc_type=decision", "--full"]);
    expect(stdout).toContain("Found 1 document(s).");
    expect(stdout).toContain("We decided to use Vue 3");
    expect(stdout).toContain("two.md");
  });

  // ── Slice 8: --json output + 400-char truncation ────────

  it("--json outputs JSON array with file, meta, body", () => {
    const dir = seedDocs(cwd);
    const { stdout } = search(["--dir", dir, "--filter", "doc_type=decision", "--json"]);
    const parsed = JSON.parse(stdout);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
    expect(parsed[0].file).toBe("two.md");
    expect(parsed[0].meta).toMatchObject({ doc_type: "decision" });
    expect(parsed[0].body).toContain("Vue 3");
  });

  it("--json body truncation at 400 chars + …", () => {
    const dir = seedDocs(cwd);
    // Create a doc with a long body (>400 chars)
    const longBody = "x".repeat(500);
    writeFileSync(
      join(dir, "long.md"),
      [
        "---",
        "doc_type: note",
        "---",
        "",
        longBody,
      ].join("\n")
    );
    const { stdout } = search(["--dir", dir, "--filter", "doc_type=note", "--json"]);
    const parsed = JSON.parse(stdout);
    expect(parsed[0].body.length).toBe(401);
    expect(parsed[0].body.endsWith("…")).toBe(true);
  });

  it("--json with --full returns full body without truncation", () => {
    const dir = seedDocs(cwd);
    const longBody = "x".repeat(500);
    writeFileSync(
      join(dir, "long2.md"),
      [
        "---",
        "doc_type: note",
        "---",
        "",
        longBody,
      ].join("\n")
    );
    const { stdout } = search(["--dir", dir, "--filter", "doc_type=note", "--json", "--full"]);
    const parsed = JSON.parse(stdout);
    expect(parsed[0].body.length).toBe(500);
  });

  // ── Slice 9: text format header + separator ─────────────

  it("text output has header and separator between docs", () => {
    const dir = seedDocs(cwd);
    const { stdout } = search(["--dir", dir, "--filter", "doc_type=learning"]);
    expect(stdout).toContain("Found 2 document(s).");
    // ─ repeated 60 times as separator
    expect(stdout).toContain("────────────────────────────────────────────────────────────");
  });

  // ── Slice 11: nonexistent dir ───────────────────────────

  it("nonexistent directory exits non-zero with error", () => {
    const { stdout, exitCode } = search(["--dir", "/no/such/dir"]);
    expect(exitCode).not.toBe(0);
    expect(stdout).toContain("Directory not found");
  });

  // ── node_modules exclusion ──────────────────────────────

  it("skips node_modules during file discovery", () => {
    const dir = seedDocs(cwd);
    // Seed a leaked file inside node_modules
    mkdirSync(join(dir, "node_modules"));
    writeFileSync(
      join(dir, "node_modules", "leaked.md"),
      [
        "---",
        "doc_type: learning",
        "---",
        "",
        "# Should not appear",
      ].join("\n")
    );
    const { stdout } = search(["--dir", dir, "--filter", "doc_type=learning"]);
    expect(stdout).toContain("Found 2 document(s).");
    expect(stdout).not.toContain("leaked.md");
  });
});
