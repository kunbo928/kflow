import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const CLI = resolve(import.meta.dirname, "../../dist/cli.js");

export function run(
  args: string[],
  cwd: string,
  env?: Record<string, string>,
): { stdout: string; exitCode: number } {
  let stdout = "";
  let exitCode = 0;
  const opts: any = {
    cwd,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  };
  if (env) opts.env = { ...process.env, ...env };
  try {
    stdout = execFileSync("node", [CLI, ...args], opts);
  } catch (e: any) {
    exitCode = e.status ?? 1;
    stdout = (e.stdout?.toString() ?? "") + (e.stderr?.toString() ?? "");
  }
  return { stdout, exitCode };
}
