#!/usr/bin/env node
// kflow CLI — Workflow CLI entrypoint

import { Command } from "commander";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { run as runInit } from "./commands/init.js";
import { run as runDoctor } from "./commands/doctor.js";
import { run as runSync } from "./commands/sync.js";
import { run as runInstall } from "./commands/install.js";
import { run as runSearch } from "./commands/search.js";
import { run as runValidate } from "./commands/validate.js";
import { run as runUninstall } from "./commands/uninstall.js";
import { run as runUpgrade } from "./commands/upgrade.js";

function pkgVersion(): string {
  try {
    const pkgPath = resolve(import.meta.dirname, "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return (pkg as { version?: string }).version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function define(name: string, desc: string, runner: (argv: string[]) => void): Command {
  return new Command(name)
    .description(desc)
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .action((_, cmd) => runner(cmd.args ?? []));
}

const program = new Command();

program
  .name("kflow")
  .description("AI coding workflow skill pack — orchestrate the software lifecycle with humans in the loop.")
  .version(pkgVersion());

program.addCommand(define("init",      "Onboard a project with kflow assets",             runInit));
program.addCommand(define("install",   "Install kflow integration for a platform",         runInstall));
program.addCommand(define("search",    "Search YAML-frontmatter .md files",                runSearch));
program.addCommand(define("validate",  "Validate YAML frontmatter in .md or .yaml files",  runValidate));
program.addCommand(define("doctor",    "Check kflow installation health",                  runDoctor));
program.addCommand(define("sync",      "Refresh kflow-owned assets",                       runSync));
program.addCommand(define("uninstall", "Plan a kflow uninstall (dry-run default)",         runUninstall));
program.addCommand(define("upgrade",   "Plan or apply a kflow package version upgrade",   runUpgrade));

program.parse();
