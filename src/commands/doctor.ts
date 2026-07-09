import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function run(_argv: string[]): void {
  const cwd = process.cwd();
  const kflowDir = join(cwd, ".kflow");
  let ok = true;

  // Check 1: structure
  const hasStructure = existsSync(kflowDir) &&
    existsSync(join(kflowDir, "reference")) &&
    existsSync(join(kflowDir, "tools"));
  console.log(`${hasStructure ? "OK" : "MISSING"} — .kflow/ structure${hasStructure ? "" : " (run: kflow init)"}`);
  if (!hasStructure) ok = false;

  // Check 2: installed platforms
  let hasPlatform = false;
  try {
    const agents = readFileSync(join(cwd, "AGENTS.md"), "utf-8");
    hasPlatform = agents.includes("## Installed Platforms");
  } catch {}
  console.log(`${hasPlatform ? "OK" : "MISSING"} — Installed Platforms${hasPlatform ? "" : " (run: kflow init)"}`);
  if (!hasPlatform) ok = false;

  // Check 3: CLI dependency
  let hasDep = false;
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, "package.json"), "utf-8"));
    hasDep = !!pkg.devDependencies?.kflow;
  } catch {}
  console.log(`${hasDep ? "OK" : "MISSING"} — devDependencies.kflow${hasDep ? "" : " (run: npm install --save-dev kflow)"}`);
  if (!hasDep) ok = false;

  process.exit(ok ? 0 : 1);
}
