import { existsSync, cpSync } from "node:fs";
import { join, resolve } from "node:path";
import { copyRuntimeSkills } from "./assets.js";

const SUPPORTED = ["codex", "cursor", "claude", "opencode"] as const;
type Platform = (typeof SUPPORTED)[number];

function isSupported(name: string): name is Platform {
  return (SUPPORTED as readonly string[]).includes(name);
}

/** Source asset directory under platforms/<name>/ */
function sourceDir(pkgRoot: string, platform: Platform): string {
  return join(pkgRoot, "platforms", platform);
}

/** Check that .kflow/ exists; if not, warn and return false. */
function ensureInitialized(cwd: string): boolean {
  if (existsSync(join(cwd, ".kflow"))) return true;
  console.log(
    "kflow: project not initialized. Run 'kflow init' first."
  );
  return false;
}

export function run(argv: string[]): void {
  const platform = argv[0];

  if (!platform) {
    console.log(
      "kflow install: missing <platform>. Supported: " +
        SUPPORTED.join(", ") +
        "\nUsage: kflow install <platform>"
    );
    process.exit(1);
  }

  if (!isSupported(platform)) {
    console.log(
      `kflow install: unsupported platform '${platform}'. Supported: ${SUPPORTED.join(", ")}`
    );
    process.exit(1);
  }

  const cwd = process.cwd();
  // Package root: dist/commands/install.js → ../../ → pkg root
  const pkgRoot = resolve(import.meta.dirname, "..", "..");

  if (!ensureInitialized(cwd)) {
    process.exit(1);
  }

  // Copy platform asset(s)
  const src = sourceDir(pkgRoot, platform);
  cpSync(src, cwd, { recursive: true });

  // Copy skills into the universal runtime discovery path.
  copyRuntimeSkills(pkgRoot, cwd);

  // Success output: distinguish completed setup from platform-native next steps
  const nextSteps: Record<Platform, string> = {
    codex: "Load the project in Codex — /k-flow is ready to use.",
    cursor: "Reload the Cursor window to pick up the integration files.",
    claude: "Restart Claude Code to pick up CLAUDE.md.",
    opencode: "Reload OpenCode to pick up the integration files.",
  };

  console.log(`Completed: kflow platform integration installed for ${platform}.`);
  console.log(`Next steps: ${nextSteps[platform]}`);
}
