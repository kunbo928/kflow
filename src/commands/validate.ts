import { readFileSync, existsSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import fg from "fast-glob";

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
// YAML parsing
// ---------------------------------------------------------------------------

function parseYamlText(text: string): { ok: true; data: unknown } | { ok: false; error: string } {
  try {
    const result = parseYaml(text);
    if (result === null || result === undefined) return { ok: true, data: {} };
    return { ok: true, data: result };
  } catch (e: any) {
    return { ok: false, error: String(e.message ?? e) };
  }
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
// Frontmatter extraction
// ---------------------------------------------------------------------------

function extractFrontmatter(text: string): { ok: true; yamlText: string } | { ok: false; error: string } {
  if (!text.startsWith("---")) {
    return { ok: false, error: "No opening '---' delimiter found" };
  }

  const end = text.indexOf("\n---", 3);
  if (end === -1) {
    return { ok: false, error: "No closing '---' delimiter found (frontmatter block not terminated)" };
  }

  const fmText = text.slice(3, end).trim();
  if (!fmText) {
    return { ok: false, error: "Frontmatter block is empty" };
  }

  return { ok: true, yamlText: fmText };
}

// ---------------------------------------------------------------------------
// Validation logic
// ---------------------------------------------------------------------------

function validateFile(
  filePath: string,
  displayPath: string,
  requiredFields: string[],
  mode: "markdown" | "yaml"
): ValidationResult {
  const result: ValidationResult = { file: displayPath, errors: [], warnings: [], fields: [] };

  let text: string;
  try {
    text = readFileSync(filePath, "utf-8");
  } catch (e: any) {
    result.errors.push(`Cannot read file: ${e.message ?? e}`);
    return result;
  }

  let yamlText: string;
  if (mode === "markdown") {
    const extracted = extractFrontmatter(text);
    if (!extracted.ok) {
      result.errors.push(extracted.error);
      return result;
    }
    yamlText = extracted.yamlText;
  } else {
    yamlText = text;
  }

  const parsed = parseYamlText(yamlText);
  if (!parsed.ok) {
    result.errors.push(`YAML syntax error: ${parsed.error}`);
    return result;
  }

  // Validate the parsed data is a mapping with required fields via zod
  const schema = frontmatterSchema(requiredFields);
  const validated = schema.safeParse(parsed.data);

  if (validated.success) {
    result.fields = Object.keys(validated.data);
    return result;
  }

  // Map zod errors back to the exact legacy strings
  result.errors.push(...formatZodErrors(parsed.data, validated));

  // Still extract whatever fields we can from the raw data for json output
  if (typeof parsed.data === "object" && parsed.data !== null && !Array.isArray(parsed.data)) {
    result.fields = Object.keys(parsed.data as Record<string, unknown>);
  }

  return result;
}

function isYamlExt(file: string): boolean {
  return file.endsWith(".yaml") || file.endsWith(".yml");
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
    const mode = yamlOnly || isYamlExt(fp) ? "yaml" : "markdown";
    results = [validateFile(fp, file, requireFields, mode)];
  } else {
    const dp = resolve(dir!);
    if (!existsSync(dp) || !statSync(dp).isDirectory()) {
      console.log(`Error: Directory not found: ${dp}`);
      process.exit(2);
    }
    results = validateDirectory(dp, dir!, requireFields);
  }

  if (asJson) {
    printJson(results);
  } else {
    printText(results);
  }

  const allOk = results.every((r) => r.errors.length === 0);
  process.exit(allOk ? 0 : 1);
}

const VALIDATE_PATTERNS = ["**/*.md", "**/*.yaml", "**/*.yml"];
const IGNORE_PATTERNS = ["**/node_modules/**", "**/dist/**", "**/.git/**"];

function validateDirectory(dp: string, displayDir: string, requireFields: string[]): ValidationResult[] {
  const results: ValidationResult[] = [];
  const root = resolve(displayDir);

  const files = fg.sync(VALIDATE_PATTERNS, {
    cwd: dp,
    absolute: true,
    onlyFiles: true,
    dot: true,
    ignore: IGNORE_PATTERNS,
  }).sort();

  if (files.length === 0) {
    console.log(`No .md or .yaml files found under ${dp}`);
    process.exit(2);
  }

  for (const full of files) {
    const relPath = relative(root, full);
    const mode = isYamlExt(full) ? "yaml" : "markdown";
    results.push(validateFile(full, relPath, requireFields, mode));
  }

  return results;
}
