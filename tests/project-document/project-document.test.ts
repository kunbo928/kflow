import { describe, expect, it } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  discoverProjectDocuments,
  parseProjectDocumentText,
} from "../../src/project-document/index";
import { tempProject } from "../cli-helpers/temp";

describe("Project document", () => {
  const corpus = [
    {
      name: "missing markdown frontmatter",
      text: "# Body only",
      mode: "markdown" as const,
      expected: { kind: "missing", code: "missing-frontmatter" },
    },
    {
      name: "unterminated markdown frontmatter",
      text: "---\ntitle: Open",
      mode: "markdown" as const,
      expected: { kind: "unterminated", code: "unterminated-frontmatter" },
    },
    {
      name: "empty markdown frontmatter",
      text: "---\n\n---\nBody",
      mode: "markdown" as const,
      expected: { kind: "empty", code: "empty-frontmatter" },
    },
    {
      name: "malformed YAML",
      text: "---\nkey: [open\n---",
      mode: "markdown" as const,
      expected: { kind: "malformed", code: "yaml-syntax" },
    },
    {
      name: "mapping frontmatter",
      text: "---\ntitle: Hello\ntags: [one, two]\n---\nBody",
      mode: "markdown" as const,
      expected: { kind: "mapping", fields: ["title", "tags"] },
    },
    {
      name: "scalar frontmatter",
      text: "---\nhello world\n---",
      mode: "markdown" as const,
      expected: { kind: "scalar" },
    },
    {
      name: "array frontmatter",
      text: "---\n- one\n- two\n---",
      mode: "markdown" as const,
      expected: { kind: "array" },
    },
    {
      name: "empty YAML-only input remains an empty mapping",
      text: "",
      mode: "yaml" as const,
      expected: { kind: "mapping", fields: [] },
    },
    {
      name: "malformed YAML-only input",
      text: "key: [open",
      mode: "yaml" as const,
      expected: { kind: "malformed", code: "yaml-syntax" },
    },
    {
      name: "mapping YAML-only input",
      text: "title: Hello\ntags: [one, two]",
      mode: "yaml" as const,
      expected: { kind: "mapping", fields: ["title", "tags"] },
    },
    {
      name: "scalar YAML-only input",
      text: "hello world",
      mode: "yaml" as const,
      expected: { kind: "scalar" },
    },
    {
      name: "array YAML-only input",
      text: "- one\n- two",
      mode: "yaml" as const,
      expected: { kind: "array" },
    },
  ];

  for (const example of corpus) {
    it(`reports ${example.name}`, () => {
      const result = parseProjectDocumentText(example.text, example.mode);
      expect(result.kind).toBe(example.expected.kind);
      expect(result.fields).toEqual("fields" in example.expected ? example.expected.fields : []);
      expect(result.diagnostics[0]?.code).toBe("code" in example.expected ? example.expected.code : undefined);
    });
  }

  it("discovers markdown and YAML documents while ignoring generated directories", () => {
    const root = tempProject();
    try {
      for (const directory of ["docs", "node_modules", "dist", ".git"]) {
        mkdirSync(join(root, directory), { recursive: true });
        writeFileSync(join(root, directory, `${directory.replace(".", "")}.md`), "---\nkey: value\n---");
      }
      writeFileSync(join(root, "docs", "config.yaml"), "key: value");
      writeFileSync(join(root, "docs", "ignored.txt"), "key: value");

      expect(discoverProjectDocuments(root).map((document) => document.relativePath)).toEqual([
        "docs/config.yaml",
        "docs/docs.md",
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
