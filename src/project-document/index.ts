import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import fg from "fast-glob";
import { parse as parseYaml } from "yaml";

export type ProjectDocumentMode = "markdown" | "yaml";
export type ProjectDocumentKind =
  | "missing"
  | "unterminated"
  | "empty"
  | "malformed"
  | "mapping"
  | "scalar"
  | "array";

export interface ProjectDocumentDiagnostic {
  code: "missing-frontmatter" | "unterminated-frontmatter" | "empty-frontmatter" | "yaml-syntax" | "read-error";
  message: string;
}

interface ProjectDocumentFactDetails {
  body: string;
  fields: string[];
  diagnostics: ProjectDocumentDiagnostic[];
}

export type ProjectDocumentFacts = ProjectDocumentFactDetails & (
  | { kind: "mapping"; data: Record<string, unknown> }
  | { kind: "array"; data: unknown[] }
  | { kind: "scalar"; data: unknown }
  | { kind: "missing" | "unterminated" | "empty" | "malformed"; data?: undefined }
);

export interface DiscoveredProjectDocument {
  absolutePath: string;
  relativePath: string;
  mode: ProjectDocumentMode;
}

export type LoadedProjectDocument = DiscoveredProjectDocument & ProjectDocumentFacts;

const DOCUMENT_PATTERNS = ["**/*.md", "**/*.yaml", "**/*.yml"];
const IGNORED_DIRECTORIES = ["**/node_modules/**", "**/dist/**", "**/.git/**"];

export function discoverProjectDocuments(root: string): DiscoveredProjectDocument[] {
  const absoluteRoot = resolve(root);
  return fg.sync(DOCUMENT_PATTERNS, {
    cwd: absoluteRoot,
    absolute: true,
    onlyFiles: true,
    dot: true,
    ignore: IGNORED_DIRECTORIES,
  }).sort().map((absolutePath) => ({
    absolutePath,
    relativePath: relative(absoluteRoot, absolutePath),
    mode: isYamlDocument(absolutePath) ? "yaml" : "markdown",
  }));
}

export function parseProjectDocumentText(text: string, mode: ProjectDocumentMode): ProjectDocumentFacts {
  if (mode === "markdown") {
    if (!text.startsWith("---")) {
      return diagnostic("missing", "missing-frontmatter", "No opening '---' delimiter found", text);
    }
    const end = text.indexOf("\n---", 3);
    if (end === -1) {
      return diagnostic(
        "unterminated",
        "unterminated-frontmatter",
        "No closing '---' delimiter found (frontmatter block not terminated)",
        text,
      );
    }
    const yamlText = text.slice(3, end).trim();
    const body = text.slice(end + 4).trim();
    if (!yamlText) {
      return diagnostic("empty", "empty-frontmatter", "Frontmatter block is empty", body);
    }
    return parseYamlFacts(yamlText, body);
  }
  return parseYamlFacts(text, "");
}

export function loadProjectDocument(document: DiscoveredProjectDocument): LoadedProjectDocument {
  try {
    const facts = parseProjectDocumentText(readFileSync(document.absolutePath, "utf-8"), document.mode);
    return { ...document, ...facts };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ...document,
      ...diagnostic("malformed", "read-error", `Cannot read file: ${message}`),
    };
  }
}

export function isYamlDocument(file: string): boolean {
  return file.endsWith(".yaml") || file.endsWith(".yml");
}

function parseYamlFacts(text: string, body: string): ProjectDocumentFacts {
  let data: unknown;
  try {
    data = parseYaml(text);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return diagnostic("malformed", "yaml-syntax", `YAML syntax error: ${message}`, body);
  }

  if (data === null || data === undefined) data = {};
  if (Array.isArray(data)) return { kind: "array", data, body, fields: [], diagnostics: [] };
  if (typeof data === "object") {
    const mapping = data as Record<string, unknown>;
    return { kind: "mapping", data: mapping, body, fields: Object.keys(mapping), diagnostics: [] };
  }
  return { kind: "scalar", data, body, fields: [], diagnostics: [] };
}

function diagnostic(
  kind: Extract<ProjectDocumentKind, "missing" | "unterminated" | "empty" | "malformed">,
  code: ProjectDocumentDiagnostic["code"],
  message: string,
  body = "",
): ProjectDocumentFacts {
  return { kind, body, fields: [], diagnostics: [{ code, message }] };
}
