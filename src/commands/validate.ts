import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import {
  discoverProjectDocuments,
  isYamlDocument,
  loadProjectDocument,
  type DiscoveredProjectDocument,
  type LoadedProjectDocument,
} from "../project-document/index.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ValidationResult {
  file: string;
  errors: string[];
  warnings: string[];
  fields: string[];
}

// ---------------------------------------------------------------------------
// Zod contract
// ---------------------------------------------------------------------------

/** Build a zod schema that validates the parsed YAML is a mapping and that
 *  `requiredFields` are present. The returned schema produces the exact
 *  user-facing error strings the CLI has always emitted. */
function frontmatterSchema(required: string[]) {
  let schema: z.ZodType<Record<string, unknown>> = z.record(z.string(), z.unknown()) as z.ZodType<Record<string, unknown>>;
  for (const field of required) {
    schema = schema.refine(
      (data: Record<string, unknown>) => field in data,
      { message: `Missing required field: '${field}'` },
    );
  }
  return schema;
}

/** Translate zod-safeParse errors back to the exact user-facing strings
 *  the CLI has always emitted. `input` is the value that failed validation. */
function formatZodErrors(input: unknown, result: { success: false; error: z.ZodError }): string[] {
  const errors: string[] = [];
  for (const issue of result.error.issues) {
    if (issue.code === "invalid_type" && issue.expected === "record") {
      const typeName = Array.isArray(input) ? "array" : typeof input;
      errors.push(`Expected a mapping, got ${typeName}`);
    } else if (issue.code === "custom") {
      errors.push(issue.message);
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Validation logic
// ---------------------------------------------------------------------------

function validateDocument(
  document: LoadedProjectDocument,
  displayPath: string,
  requiredFields: string[],
): ValidationResult {
  const result: ValidationResult = { file: displayPath, errors: [], warnings: [], fields: [] };

  if (document.diagnostics.length > 0) {
    result.errors.push(...document.diagnostics.map((diagnostic) => diagnostic.message));
    return result;
  }

  const schema = frontmatterSchema(requiredFields);
  const validated = schema.safeParse(document.data);

  if (validated.success) {
    result.fields = document.fields;
    return result;
  }

  result.errors.push(...formatZodErrors(document.data, validated));
  result.fields = document.fields;

  return result;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function printText(results: ValidationResult[]): void {
  const passed = results.filter((r) => r.errors.length === 0).length;
  const failed = results.length - passed;

  console.log(`Validated ${results.length} file(s): ${passed} passed, ${failed} failed.\n`);

  for (const r of results) {
    const icon = r.errors.length === 0 ? "✓" : "✗";
    console.log(`  ${icon} ${r.file}`);
    for (const err of r.errors) {
      console.log(`      ERROR: ${err}`);
    }
    for (const warn of r.warnings) {
      console.log(`      WARN:  ${warn}`);
    }
  }

  if (failed > 0) {
    console.log(`\n${failed} file(s) have YAML errors.`);
  } else {
    console.log("\nAll files valid.");
  }
}

function printJson(results: ValidationResult[]): void {
  const output = {
    total: results.length,
    passed: results.filter((r) => r.errors.length === 0).length,
    failed: results.filter((r) => r.errors.length > 0).length,
    results: results.map((r) => {
      const d: Record<string, unknown> = { file: r.file, status: r.errors.length === 0 ? "pass" : "fail" };
      if (r.errors.length > 0) d.errors = r.errors;
      if (r.warnings.length > 0) d.warnings = r.warnings;
      if (r.fields.length > 0) d.fields = r.fields;
      return d;
    }),
  };
  console.log(JSON.stringify(output, null, 2));
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

export function run(argv: string[]): void {
  let file: string | null = null;
  let dir: string | null = null;
  const requireFields: string[] = [];
  let asJson = false;
  let yamlOnly = false;

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "--file") {
      file = argv[++i] ?? "";
    } else if (arg === "--dir") {
      dir = argv[++i] ?? "";
    } else if (arg === "--require") {
      requireFields.push(argv[++i] ?? "");
    } else if (arg === "--json") {
      asJson = true;
    } else if (arg === "--yaml-only") {
      yamlOnly = true;
    }
    i++;
  }

  // Resolve source
  if (!file && !dir) {
    console.log("kflow validate: --file or --dir is required.");
    process.exit(2);
  }

  let results: ValidationResult[];

  if (file) {
    const fp = resolve(file);
    if (!existsSync(fp)) {
      console.log(`Error: File not found: ${fp}`);
      process.exit(2);
    }
    const source: DiscoveredProjectDocument = {
      absolutePath: fp,
      relativePath: file,
      mode: yamlOnly || isYamlDocument(fp) ? "yaml" : "markdown",
    };
    results = [validateDocument(loadProjectDocument(source), file, requireFields)];
  } else {
    const dp = resolve(dir!);
    if (!existsSync(dp) || !statSync(dp).isDirectory()) {
      console.log(`Error: Directory not found: ${dp}`);
      process.exit(2);
    }
    results = validateDirectory(dp, requireFields);
  }

  if (asJson) {
    printJson(results);
  } else {
    printText(results);
  }

  const allOk = results.every((r) => r.errors.length === 0);
  process.exit(allOk ? 0 : 1);
}

function validateDirectory(dp: string, requireFields: string[]): ValidationResult[] {
  const results: ValidationResult[] = [];
  const documents = discoverProjectDocuments(dp);

  if (documents.length === 0) {
    console.log(`No .md or .yaml files found under ${dp}`);
    process.exit(2);
  }

  for (const document of documents) {
    results.push(validateDocument(loadProjectDocument(document), document.relativePath, requireFields));
  }

  return results;
}
