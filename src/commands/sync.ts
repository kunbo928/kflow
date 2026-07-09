import { readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { mirrorDir } from "./assets.js";
import { readMeta, RUNTIME_SKILL_DIRS, isPlatform } from "./meta.js";
import type { Platform } from "./meta.js";

/** Return the set of directory names under pkgRoot/skills/. */
function kflowSkillNames(pkgRoot: string): string[] {
  const skillsDir = join(pkgRoot, "skills");
  if (!existsSync(skillsDir)) return [];
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

export function run(_argv: string[]): void {
  const cwd = process.cwd();
  // Package root: dist/commands/sync.js → ../../ → pkg root
  const pkgRoot = resolve(import.meta.dirname, "..", "..");
  const kflowDir = join(cwd, ".kflow");

  // ── Skills: mirror into every platform-specific runtime dir ──────────
  const meta = readMeta(cwd);
  let skillDirs: string[];
  if (meta) {
    // Derive deduped runtime dirs from installed platforms
    skillDirs = [
      ...new Set(
        meta.platforms
          .map((e) => e.name)
          .filter((n): n is Platform => isPlatform(n))
          .map((p) => RUNTIME_SKILL_DIRS[p]),
      ),
    ];
  } else {
    // No meta.json: fall back to .agents/skills/ only
    skillDirs = [".agents/skills"];
  }

  const skillNames = kflowSkillNames(pkgRoot);
  for (const dir of skillDirs) {
    for (const name of skillNames) {
      mirrorDir(
        join(pkgRoot, "skills", name),
        join(cwd, dir, name),
      );
    }
  }

  // Templates → reference
  mirrorDir(join(pkgRoot, "templates"), join(kflowDir, "reference"));

  // Tools
  mirrorDir(join(pkgRoot, "tools"), join(kflowDir, "tools"));

  console.log("kflow assets mirrored.");
}
