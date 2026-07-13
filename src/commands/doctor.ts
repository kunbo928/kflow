import { inspectProjectOnboarding } from "../project-onboarding/lifecycle.js";

export function run(_argv: string[]): void {
  const { health } = inspectProjectOnboarding(process.cwd());
  const hasStructure = health.structure === "healthy";
  console.log(`${hasStructure ? "OK" : "MISSING"} — .kflow/ structure${hasStructure ? "" : " (run: kflow init)"}`);

  const hasPlatform = health.installedPlatforms === "healthy";
  console.log(`${hasPlatform ? "OK" : "MISSING"} — Installed Platforms${hasPlatform ? "" : " (run: kflow init)"}`);

  const hasDep = health.projectCliDependency === "healthy";
  console.log(`${hasDep ? "OK" : "MISSING"} — devDependencies.kflow${hasDep ? "" : " (run: npm install --save-dev kflow)"}`);

  process.exit(hasStructure && hasPlatform && hasDep ? 0 : 1);
}
