import { join, resolve } from "node:path";
import { mirrorDir } from "./assets.js";

export function run(_argv: string[]): void {
  const cwd = process.cwd();
  // Package root: dist/commands/sync.js → ../../ → pkg root
  const pkgRoot = resolve(import.meta.dirname, "..", "..");
  const kflowDir = join(cwd, ".kflow");

  // Skills: mirror pkg skills/ → .agents/skills/ (universal runtime discovery path).
  mirrorDir(join(pkgRoot, "skills"), join(cwd, ".agents", "skills"));

  // Templates → reference
  mirrorDir(join(pkgRoot, "templates"), join(kflowDir, "reference"));

  // Tools
  mirrorDir(join(pkgRoot, "tools"), join(kflowDir, "tools"));

  console.log("kflow assets mirrored.");
}
