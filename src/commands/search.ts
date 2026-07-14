import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  discoverProjectDocuments,
  loadProjectDocument,
  type LoadedProjectDocument,
} from "../project-document/index.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Doc {
  file: string;
  meta: unknown;
  body: string;
}

interface Filter {
  key: string;
  values: string[];
  operator: "exact" | "contains";
}

function loadDocuments(dir: string): Doc[] {
  return discoverProjectDocuments(dir)
    .map(loadProjectDocument)
    .filter((document) => !document.diagnostics.some((diagnostic) => diagnostic.code === "read-error"))
    .map(toSearchDocument);
}

function toSearchDocument(document: LoadedProjectDocument): Doc {
  const meta = document.kind === "mapping" || document.kind === "scalar" || document.kind === "array"
    ? document.data
    : {};
  return { file: document.relativePath, meta, body: document.body };
}

// ---------------------------------------------------------------------------
// Filter parsing
// ---------------------------------------------------------------------------

function splitFilterValues(value: string): string[] {
  const values = value.split("|").map((s) => s.trim());
  return values.filter((v) => v.length > 0);
}

function parseFilter(raw: string): Filter {
  let operator: "exact" | "contains";
  let key: string;
  let rawValue: string;

  if (raw.includes("~=")) {
    [key, rawValue] = raw.split("~=", 2);
    operator = "contains";
  } else if (raw.includes("=")) {
    [key, rawValue] = raw.split("=", 2);
    operator = "exact";
  } else {
    throw new Error(
      `Invalid filter expression ${JSON.stringify(raw)}. ` +
        "Use 'key=value' for exact match or 'key~=value' for substring/list-contains match. " +
        "Use pipes for OR values, e.g. 'doc_type=decision|explore|learning'."
    );
  }

  return {
    key: key.trim(),
    values: splitFilterValues(rawValue.trim()),
    operator,
  };
}

function filterMatches(filter: Filter, meta: unknown): boolean {
  const fieldVal = metadataField(meta, filter.key);
  if (fieldVal === undefined || fieldVal === null) return false;

  if (filter.operator === "exact") {
    return filter.values.some(
      (v) => String(fieldVal).toLowerCase() === v.toLowerCase()
    );
  }

  // contains: substring for strings, element-in for lists
  if (Array.isArray(fieldVal)) {
    return filter.values.some((v) =>
      fieldVal.some((item) => String(item).toLowerCase() === v.toLowerCase())
    );
  }
  return filter.values.some((v) =>
    String(fieldVal).toLowerCase().includes(v.toLowerCase())
  );
}

// ---------------------------------------------------------------------------
// Query matching
// ---------------------------------------------------------------------------

function docMatches(doc: Doc, filters: Filter[], query: string | null): boolean {
  for (const f of filters) {
    if (!filterMatches(f, doc.meta)) return false;
  }

  if (query) {
    const needle = query.toLowerCase();
    const haystack =
      doc.body.toLowerCase() +
      " " +
      Object.values(Object(doc.meta))
        .map((v) => String(v))
        .join(" ")
        .toLowerCase();
    if (!haystack.includes(needle)) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

function sortKey(doc: Doc, field: string): [number, string] {
  const val = metadataField(doc.meta, field);
  if (val === undefined || val === null) return [1, ""];
  if (val instanceof Date) return [0, val.toISOString()];
  return [0, String(val)];
}

function sortResults(results: Doc[], sortBy: string, order: "asc" | "desc"): Doc[] {
  const present = results.filter((d) => {
    const v = metadataField(d.meta, sortBy);
    return v !== undefined && v !== null;
  });
  const missing = results.filter((d) => {
    const v = metadataField(d.meta, sortBy);
    return v === undefined || v === null;
  });
  present.sort((a, b) => {
    const [ia, sa] = sortKey(a, sortBy);
    const [ib, sb] = sortKey(b, sortBy);
    if (ia !== ib) return ia - ib;
    const cmp = sa.localeCompare(sb);
    return order === "desc" ? -cmp : cmp;
  });
  return [...present, ...missing];
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function metaSummary(meta: unknown): string {
  const skip = new Set(["slug"]);
  const parts: string[] = [];
  for (const [k, v] of Object.entries(Object(meta))) {
    if (skip.has(k)) continue;
    if (Array.isArray(v)) {
      parts.push(`${k}=[${v.map(String).join(", ")}]`);
    } else {
      parts.push(`${k}=${v}`);
    }
  }
  return parts.join("  ");
}

function metadataField(meta: unknown, field: string): unknown {
  if (meta === null || meta === undefined) return undefined;
  return (Object(meta) as Record<string, unknown>)[field];
}

function formatSummary(doc: Doc): string {
  return `### ${doc.file}\n${metaSummary(doc.meta)}`;
}

function formatFull(doc: Doc): string {
  return `${formatSummary(doc)}\n\n${doc.body}`;
}

function printText(results: Doc[], full: boolean): void {
  console.log(`Found ${results.length} document(s).\n`);
  const sep = "\n" + "─".repeat(60) + "\n";
  const chunks = results.map((d) => (full ? formatFull(d) : formatSummary(d)));
  console.log(chunks.join(sep));
}

function printJson(results: Doc[], full: boolean): void {
  const output = results.map((doc) => {
    let body = doc.body;
    if (!full && body.length > 400) {
      body = body.slice(0, 400) + "…";
    }
    return { file: doc.file, meta: doc.meta, body };
  });
  console.log(JSON.stringify(output, null, 2));
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

export function run(argv: string[]): void {
  let dir = "";
  const filters: Filter[] = [];
  let query: string | null = null;
  let full = false;
  let asJson = false;
  let sortBy: string | null = null;
  let order: "asc" | "desc" = "desc";

  // Simple arg parser
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "--dir") {
      dir = argv[++i] ?? "";
    } else if (arg === "--filter" || arg === "-f") {
      filters.push(parseFilter(argv[++i] ?? ""));
    } else if (arg === "--query" || arg === "-q") {
      query = argv[++i] ?? "";
    } else if (arg === "--full") {
      full = true;
    } else if (arg === "--json") {
      asJson = true;
    } else if (arg === "--sort-by") {
      sortBy = argv[++i] ?? "";
    } else if (arg === "--order") {
      order = (argv[++i] ?? "desc") as "asc" | "desc";
    }
    // else: ignore unknown args
    i++;
  }

  if (!dir) {
    console.log("kflow search: --dir is required.");
    process.exit(1);
  }

  const directory = resolve(dir);
  if (!existsSync(directory)) {
    console.log(`[error] Directory not found: ${directory}`);
    process.exit(1);
  }
  if (!statSync(directory).isDirectory()) {
    console.log(`[error] Not a directory: ${directory}`);
    process.exit(1);
  }

  const docs = loadDocuments(dir);
  if (docs.length === 0) {
    console.log(`No .md files found in ${dir}`);
    return;
  }

  let results = docs.filter((d) => docMatches(d, filters, query));
  if (results.length === 0) {
    console.log("No matching documents found.");
    return;
  }

  if (sortBy) {
    results = sortResults(results, sortBy, order);
  }

  if (asJson) {
    printJson(results, full);
  } else {
    printText(results, full);
  }
}
