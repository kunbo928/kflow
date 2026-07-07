import { cpSync, rmSync } from "node:fs";
import { join } from "node:path";

/** Copy skills into the universal runtime discovery path (.agents/skills/). */
export function copyRuntimeSkills(pkgRoot: string, cwd: string): void {
  cpSync(join(pkgRoot, "skills"), join(cwd, ".agents", "skills"), {
    recursive: true,
  });
}

/** Mirror a directory: delete destination then copy source → destination. */
export function mirrorDir(src: string, dst: string): void {
  rmSync(dst, { recursive: true, force: true });
  cpSync(src, dst, { recursive: true });
}
