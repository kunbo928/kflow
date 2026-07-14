import { checkbox, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import {
  executeFullUninstall,
  planPackageRemoval,
} from "../package-manager/execution.js";
import {
  ALL_PLATFORMS,
  inspectProjectOnboarding,
  isPlatform,
  removeProjectOnboardingAssets,
  removeProjectOnboardingPlatforms,
  type Platform,
  type ProjectOnboardingAssetRemoval,
  type ProjectOnboardingRemovalAction,
} from "../project-onboarding/lifecycle.js";

function renderRemovalActions(
  actions: ProjectOnboardingRemovalAction[],
  options: { planned?: boolean; indent?: string; includeSkills?: boolean; separator?: string } = {},
): void {
  const { planned = false, indent = "", includeSkills = true, separator = ": " } = options;
  const skillDirs = new Set<string>();
  for (const action of actions) {
    if (action.kind === "skill-removed") {
      if (includeSkills) skillDirs.add(action.directory);
      continue;
    }

    const verb = action.kind.endsWith("removed") ? "Removed" : "Preserved";
    const icon = verb === "Removed" ? chalk.green("✓") : chalk.yellow("⚠");
    const plannedVerb = verb === "Removed" ? "remove" : "preserve";
    const label = planned ? `Would ${plannedVerb}` : `${icon} ${verb}`;
    const target = "file" in action ? action.file : action.directory;
    const detail = action.kind === "runtime-directory-preserved"
      ? "shared with other installed platforms"
      : action.kind === "parent-directory-preserved"
        ? "contains non-kflow content"
        : action.kind === "runtime-directory-removed"
          ? "empty"
          : action.kind === "entry-file-preserved"
            ? action.reason
            : undefined;
    console.log(`${indent}${label}${separator}${target}${detail ? ` (${detail})` : ""}`);
  }

  for (const directory of skillDirs) {
    const label = planned ? "Would remove" : `${chalk.green("✓")} Removed`;
    console.log(`${indent}${label}${separator}kflow skills from ${directory}`);
  }
}

/** Delete one or more platform integrations as one lifecycle operation. */
function removePlatforms(cwd: string, platforms: Platform[]): void {
  const result = removeProjectOnboardingPlatforms({ cwd, platforms });
  if (result.status === "blocked") {
    console.log(chalk.red(`Installation State is ${result.installationState}; repair .kflow/meta.json before retrying.`));
    process.exit(1);
  }
  if (result.status === "failed") {
    console.log(chalk.red(`Platform removal failed: ${result.message}`));
    if (result.partialChanges) console.log(chalk.yellow("Removal stopped after partial filesystem changes."));
    process.exit(1);
  }

  renderRemovalActions(result.actions, { indent: "  " });
}

function renderCompletedAssetRemoval(removal: Extract<
  ProjectOnboardingAssetRemoval,
  { status: "completed" }
>): void {
  if (removal.projectKnowledgeRemoved) {
    console.log(`${chalk.green("✓")} Removed: .kflow (project knowledge)`);
  }
  renderRemovalActions(removal.actions.filter((action) =>
    action.kind.startsWith("entry-file") || action.kind === "parent-directory-preserved"
  ), { includeSkills: false });
}

/** Full uninstall: remove everything kflow. */
async function applyFullUninstall(cwd: string): Promise<void> {
  const plan = planPackageRemoval({ cwd });

  console.log(chalk.bold("\nkflow uninstall — full removal\n"));
  console.log(`Package manager : ${plan.packageManager}`);
  console.log(`Remove command  : ${plan.remove.command}`);

  const result = executeFullUninstall({
    cwd,
    plan,
    removeAssets: () => removeProjectOnboardingAssets({ cwd }),
  });
  if (result.status === "package-removal-failed") {
    console.log(chalk.red("\nPackage removal failed. File deletion skipped."));
    console.log("Next step: resolve the package manager error and re-run kflow uninstall --apply.");
    process.exit(result.exitCode);
  }

  if (result.status === "asset-removal-failed") {
    console.log("");
    console.log(chalk.red("Package removal succeeded, but file deletion failed."));
    console.log("Partial uninstall: some kflow files remain.");
    console.log(`Error: ${result.assetRemoval.message}`);
    if (!result.retry.packageRemovalRequired) {
      console.log("Next step: package removal already succeeded; manually remove .kflow, .agents, and kflow entry files without re-running package removal.");
    }
    process.exit(1);
  }
  const removal = result.assetRemoval;
  renderCompletedAssetRemoval(removal);

  console.log(chalk.green("\nkflow uninstall complete."));
}

// ── Main ──────────────────────────────────────────────────────────────

export async function run(argv: string[]): Promise<void> {
  const apply = argv.includes("--apply");
  const platformArg = argv.find((a) => a.startsWith("--platform="));
  const platformList = platformArg?.replace("--platform=", "");
  const cwd = process.cwd();

  // ── Deterministic path (--platform flag) ─────────────────────────────
  if (platformList) {
    const names = platformList.split(",").map((s) => s.trim()).filter(Boolean);
    for (const n of names) {
      if (!isPlatform(n)) {
        console.log(
          chalk.red(`kflow uninstall: unsupported platform '${n}'. Supported: ${ALL_PLATFORMS.join(", ")}`)
        );
        process.exit(1);
      }
    }
    const platforms = [...new Set(names)] as Platform[];

    const platformLabel = platforms.join(",");
    if (apply) {
      console.log(chalk.bold(`\nkflow uninstall ${platformLabel} --apply\n`));
      removePlatforms(cwd, platforms);
      console.log(chalk.green(`\n${platformLabel} uninstall complete.`));
      console.log("Preserved: .kflow (project knowledge), kflow CLI package dependency");
    } else {
      console.log(chalk.bold(`\nkflow uninstall ${platformLabel} (dry-run)\n`));
      const plan = removeProjectOnboardingPlatforms({ cwd, platforms, apply: false });
      if (plan.status === "completed") {
        renderRemovalActions(plan.actions, { planned: true });
      } else if (plan.status === "blocked") {
        console.log(`Cannot plan removal: Installation State is ${plan.installationState}.`);
      } else {
        console.log(`Cannot plan removal: ${plan.message}`);
      }
      console.log("\nWill preserve:");
      console.log("  - .kflow (project knowledge)");
      console.log("  - kflow CLI package dependency");
      console.log(chalk.dim(`\nTo apply: kflow uninstall --platform=${platformLabel} --apply`));
    }
    return;
  }

  // ── Full uninstall (no platform specified) ──────────────────────────
  const posArgs = argv.filter((a) => a !== "--apply" && !a.startsWith("--platform="));
  if (posArgs.length > 0 && !apply) {
    // Legacy full-uninstall dry-run
    console.log("kflow uninstall (dry-run)");

    const plan = removeProjectOnboardingAssets({ cwd, apply: false });
    if (plan.status === "completed") {
      if (plan.projectKnowledgeRemoved) {
        console.log("Would remove   : .kflow");
        console.log("  ⚠ .kflow contains user-authored project knowledge. Back up before applying.");
      }
      renderRemovalActions(plan.actions, { planned: true, separator: "   : " });
    } else {
      console.log(`Cannot plan asset removal: ${plan.message}`);
    }
    const packagePlan = planPackageRemoval({ cwd });
    console.log(`Package manager : ${packagePlan.packageManager}`);
    console.log(`Remove command  : ${packagePlan.remove.command}`);
    console.log("");
    console.log("To apply: kflow uninstall --apply");
    return;
  }

  if (posArgs.length > 0 && apply) {
    // Legacy full-uninstall apply
    await applyFullUninstall(cwd);
    return;
  }

  // ── Interactive picker ──────────────────────────────────────────────
  if (apply) {
    // --apply without --platform → full uninstall
    await applyFullUninstall(cwd);
    return;
  }

  // Interactive: no flags, pick platforms
  const state = inspectProjectOnboarding(cwd).installationState;
  const fileInstalled = state.kind === "authoritative" || state.kind === "inferred"
    ? state.platforms
    : [];
  if (fileInstalled.length === 0) {
    console.log(chalk.yellow("No kflow platform integrations detected."));
    console.log("To fully remove kflow: kflow uninstall --apply");
    process.exit(0);
  }

  const selected = await checkbox({
    message: "Select platforms to uninstall:",
    choices: fileInstalled.map((p) => ({
      name: p,
      value: p,
      checked: true,
    })),
    pageSize: 10,
  }) as Platform[];

  if (selected.length === 0) {
    console.log(chalk.dim("No platforms selected. Aborted."));
    process.exit(0);
  }

  // Last-platform warning
  const remainingAfter = fileInstalled.filter((p) => !selected.includes(p));
  if (remainingAfter.length === 0) {
    const proceed = await confirm({
      message: chalk.yellow(
        "This is the last installed platform. All kflow files (including .kflow project knowledge) will be removed. Continue?"
      ),
      default: false,
    });
    if (!proceed) {
      console.log(chalk.dim("Aborted."));
      process.exit(0);
    }
    // Full uninstall
    await applyFullUninstall(cwd);
    return;
  }

  // Execute removal
  console.log(chalk.bold("\nUninstalling platforms:\n"));
  removePlatforms(cwd, selected);

  console.log(chalk.green(`\nUninstalled: ${selected.join(", ")}`));
  console.log("Preserved: .kflow (project knowledge), kflow CLI package dependency");
}
