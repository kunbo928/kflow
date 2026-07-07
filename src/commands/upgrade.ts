import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

export function run(argv: string[]): void {
  const apply = argv.includes("--apply");
  const posArgs = argv.filter((a) => a !== "--apply");
  const target = posArgs[0] ?? "latest";
  const cwd = process.cwd();
  const pm = detectPackageManager(cwd);

  const installCmd = installCommand(pm, target);
  const syncCmd = syncCommand(pm);

  if (apply) {
    console.log(`Installing package : ${installCmd}`);
    const installExit = runCommand(installCmd, "KFLOW_UPGRADE_INSTALL_CMD", cwd);
    if (installExit !== 0) {
      console.log("Package upgrade failed. Sync was not run.");
      process.exit(installExit);
    }

    console.log(`Running upgraded-CLI sync : ${syncCmd}`);
    const syncExit = runCommand(syncCmd, "KFLOW_UPGRADE_SYNC_CMD", cwd);
    if (syncExit !== 0) {
      console.log("Package upgraded, but asset sync failed.");
      console.log(`Retry asset sync: ${syncCmd}`);
      process.exit(syncExit);
    }

    process.exit(0);
  }

  console.log(`Package manager : ${pm}`);
  console.log(`Target          : ${target}`);
  console.log(`Install command : ${installCmd}`);
  console.log(`Sync command    : ${syncCmd}`);
}

function runCommand(plannedCmd: string, envKey: string, cwd: string): number {
  const override = process.env[envKey];
  const cmd = override ?? plannedCmd;
  const result = spawnSync(cmd, [], {
    cwd,
    shell: true,
    stdio: "inherit",
  });
  return result.status ?? 1;
}

type PM = "pnpm" | "yarn" | "bun" | "npm";

function detectPackageManager(cwd: string): PM {
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  if (existsSync(join(cwd, "bun.lockb"))) return "bun";
  if (existsSync(join(cwd, "bun.lock"))) return "bun";
  if (existsSync(join(cwd, "package-lock.json"))) return "npm";
  return "npm";
}

function installCommand(pm: PM, target: string): string {
  switch (pm) {
    case "pnpm": return `pnpm add -D kflow@${target}`;
    case "yarn": return `yarn add -D kflow@${target}`;
    case "bun":  return `bun add -d kflow@${target}`;
    case "npm":  return `npm install --save-dev kflow@${target}`;
  }
}

function syncCommand(pm: PM): string {
  switch (pm) {
    case "pnpm": return "pnpm exec kflow sync";
    case "yarn": return "yarn kflow sync";
    case "bun":  return "bunx kflow sync";
    case "npm":  return "npx kflow sync";
  }
}
