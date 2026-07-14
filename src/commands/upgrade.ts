import {
  executePackageUpgrade,
  planPackageUpgrade,
} from "../package-manager/execution.js";

export function run(argv: string[]): void {
  const apply = argv.includes("--apply");
  const posArgs = argv.filter((argument) => argument !== "--apply");
  const target = posArgs[0] ?? "latest";
  const cwd = process.cwd();
  const plan = planPackageUpgrade({ cwd, target });

  if (!apply) {
    console.log(`Package manager : ${plan.packageManager}`);
    console.log(`Target          : ${plan.target}`);
    console.log(`Install command : ${plan.install.command}`);
    console.log(`Sync command    : ${plan.synchronize.command}`);
    return;
  }

  const result = executePackageUpgrade({
    cwd,
    plan,
    onStepStart: (step, command) => {
      if (step === "install") {
        console.log(`Installing package : ${command}`);
      } else {
        console.log(`Running upgraded-CLI sync : ${command}`);
      }
    },
  });

  if (result.status === "install-failed") {
    console.log("Package upgrade failed. Sync was not run.");
    process.exit(result.exitCode);
  }
  if (result.status === "synchronize-failed") {
    console.log("Package upgraded, but asset sync failed.");
    console.log(`Retry asset sync: ${result.retryCommand}`);
    process.exit(result.exitCode);
  }
  process.exit(0);
}
