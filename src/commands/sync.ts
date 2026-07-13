import { resolve } from "node:path";
import { synchronizeProjectOnboarding } from "../project-onboarding/lifecycle.js";

export function run(_argv: string[]): void {
  const result = synchronizeProjectOnboarding({
    cwd: process.cwd(),
    pkgRoot: resolve(import.meta.dirname, "..", ".."),
  });

  if (result.status === "blocked") {
    console.error(`Installation State is ${result.installationState}; repair .kflow/meta.json before retrying.`);
    process.exit(1);
  }
  if (result.status === "failed") {
    console.error(`kflow sync failed: ${result.message}`);
    if (result.partialChanges) {
      console.error("Synchronization stopped after partial filesystem changes.");
    }
    process.exit(1);
  }

  console.log("kflow assets mirrored.");
}
