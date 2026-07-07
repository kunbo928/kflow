import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

let counter = 0;

export function tempProject(): string {
  return mkdtempSync(join(tmpdir(), `kflow-${counter++}-`));
}

export { join } from "node:path";
