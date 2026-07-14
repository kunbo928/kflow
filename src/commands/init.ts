import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { checkbox, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import {
  ALL_PLATFORMS,
  initializeProjectOnboarding,
  inspectProjectOnboarding,
  isPlatform,
  type Platform,
} from "../project-onboarding/lifecycle.js";

function pkgVersion(pkgRoot: string): string {
  try {
    const p = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf-8"));
    return (p as { version?: string }).version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function printCompactBrandMark(): void {
  console.log("kflow · AI coding workflow skill pack");
  console.log("");
}

function printFullBrandMark(): void {
  console.log(chalk.bold("╭──────────────────────────────────────────────────────╮"));
  console.log(chalk.bold("│") + "  kflow · AI coding workflow skill pack              " + chalk.bold("│"));
  console.log(chalk.bold("│") + "  orchestrate the software lifecycle                 " + chalk.bold("│"));
  console.log(chalk.bold("│") + "  with humans in the loop                            " + chalk.bold("│"));
  console.log(chalk.bold("╰──────────────────────────────────────────────────────╯"));
  console.log("");
}

export async function run(argv: string[]): Promise<void> {
  const cwd = process.cwd();
  const pkgRoot = resolve(import.meta.dirname, "..", "..");

  // Parse --platform and --no-save flags
  const platformArg = argv.find((a) => a.startsWith("--platform="));
  const platformList = platformArg?.replace("--platform=", "");
  const noSave = argv.includes("--no-save");

  // Detect already-installed platforms
  const state = inspectProjectOnboarding(cwd).installationState;
  const alreadyInstalled = state.kind === "authoritative" || state.kind === "inferred"
    ? state.platforms
    : [];

  let selected: Platform[];

  // ── Deterministic path (--platform flag) ─────────────────────────────
  if (platformList) {
    printCompactBrandMark();
    const names = platformList.split(",").map((s) => s.trim()).filter(Boolean);
    for (const n of names) {
      if (!isPlatform(n)) {
        console.error(
          chalk.red(`kflow init: unsupported platform '${n}'. Supported: ${ALL_PLATFORMS.join(", ")}`)
        );
        process.exit(1);
      }
    }
    selected = [...new Set(names)] as Platform[];

    // Filter out already-installed
    const newPlatforms = selected.filter((p) => !alreadyInstalled.includes(p));
    if (newPlatforms.length === 0) {
      console.log(chalk.yellow("All selected platforms are already installed."));
      process.exit(0);
    }
    selected = newPlatforms;
  } else {
    // ── Interactive picker ─────────────────────────────────────────────

    printFullBrandMark();

    // Sort: installed platforms first, then remaining alphabetically
    const remaining = ALL_PLATFORMS.filter((p) => !alreadyInstalled.includes(p));
    const choices = [
      ...alreadyInstalled.map((p) => ({
        name: `${p} ${chalk.dim("(already installed)")}`,
        value: p,
        checked: false,
        disabled: true,
      })),
      ...remaining.map((p) => ({
        name: p,
        value: p,
        checked: p === "codex" && !alreadyInstalled.includes("codex"),
      })),
    ];

    const installable = remaining.length > 0;
    if (!installable) {
      console.log(chalk.green("All platforms are already installed."));
      process.exit(0);
    }

    // No-package.json warning
    if (!existsSync(join(cwd, "package.json"))) {
      const proceed = await confirm({
        message: chalk.yellow(
          "No package.json found. kflow will not be saved as a devDependency. Continue?"
        ),
        default: true,
      });
      if (!proceed) {
        console.log(chalk.dim("Aborted."));
        process.exit(0);
      }
    }

    selected = await checkbox({
      message: "Select platforms to install:",
      choices,
      pageSize: 10,
    }) as Platform[];

    if (selected.length === 0) {
      console.log(chalk.dim("No platforms selected. Aborted."));
      process.exit(0);
    }
  }

  // ── Install ──────────────────────────────────────────────────────────

  const spinner = ora("Installing kflow skill assets…").start();
  const initialization = initializeProjectOnboarding({
    cwd,
    pkgRoot,
    platforms: selected,
    version: pkgVersion(pkgRoot),
    installedAt: new Date().toISOString(),
  });
  if (initialization.status === "blocked") {
    spinner.fail("kflow initialization blocked.");
    console.error(
      chalk.red(`Installation State is ${initialization.installationState}; repair .kflow/meta.json before retrying.`),
    );
    process.exit(1);
  }
  if (initialization.status === "failed") {
    spinner.fail("kflow initialization failed.");
    console.error(chalk.red(`Filesystem error: ${initialization.message}`));
    if (initialization.partialChanges) {
      console.error(chalk.yellow("Initialization stopped after partial filesystem changes."));
    }
    process.exit(1);
  }
  spinner.succeed("kflow skill assets installed.");
  for (const action of initialization.actions) {
    if (action.kind !== "platform-integration-installed") continue;
    spinner.start(`Installing ${action.platform} integration…`);
    spinner.succeed(`${action.platform} integration installed.`);
  }

  console.log("");
  if (alreadyInstalled.length > 0) {
    console.log(chalk.dim(`Previously installed: ${alreadyInstalled.join(", ")}`));
  }
  console.log(chalk.green(`kflow initialized with: ${selected.join(", ")}`));
  console.log("Use /k-flow as the Skill Workflow entrypoint in your Agent Runtime.");

  // Save kflow as devDependency
  if (noSave) return;
  const targetPkgPath = join(cwd, "package.json");
  if (existsSync(targetPkgPath)) {
    const targetPkg = JSON.parse(readFileSync(targetPkgPath, "utf-8"));
    targetPkg.devDependencies ??= {};
    targetPkg.devDependencies["kflow"] = "*";
    writeFileSync(targetPkgPath, JSON.stringify(targetPkg, null, 2) + "\n");
  }
}
