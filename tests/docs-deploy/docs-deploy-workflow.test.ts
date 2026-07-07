import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";

const REPO_ROOT = resolve(import.meta.dirname, "../..");
const WORKFLOW_PATH = join(REPO_ROOT, ".github/workflows/docs-deploy.yml");

interface Workflow {
  name?: string;
  on?:
    | Record<string, unknown>
    | string
    | string[];
  jobs?: Record<string, Job>;
  permissions?: Record<string, unknown>;
}

interface Job {
  "runs-on"?: string;
  steps?: Step[];
}

interface Step {
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
  "continue-on-error"?: boolean;
  env?: Record<string, unknown>;
}

describe("Docs Deploy Workflow — config validation", () => {
  let workflow: Workflow;

  it("workflow file exists", () => {
    expect(
      existsSync(WORKFLOW_PATH),
      ".github/workflows/docs-deploy.yml not found"
    ).toBe(true);
  });

  it("workflow is valid YAML", () => {
    const raw = readFileSync(WORKFLOW_PATH, "utf-8");
    expect(() => {
      workflow = parseYaml(raw) as Workflow;
    }).not.toThrow();
  });

  it("triggered by push to main branch, not by tags", () => {
    const on = workflow.on as Record<string, unknown>;
    expect(on?.push).toBeDefined();

    const pushConfig = on.push as Record<string, unknown>;

    // Must trigger on main branch push
    const branches = pushConfig.branches as string[] | undefined;
    expect(
      branches,
      "missing on.push.branches (main branch trigger required)"
    ).toBeDefined();
    expect(
      branches!.includes("main"),
      `expected on.push.branches to include "main", got: ${JSON.stringify(branches)}`
    ).toBe(true);

    // Must NOT be tag-triggered (docs deploy is branch-driven, not version-tag)
    expect(
      pushConfig.tags,
      "on.push.tags must NOT be set (docs deploy must not require a version tag)"
    ).toBeUndefined();
  });

  it("has a checkout step (actions/checkout)", () => {
    const steps = allSteps();
    const checkoutStep = steps.find(
      (s) => s.uses?.startsWith("actions/checkout")
    );
    expect(checkoutStep, "missing actions/checkout step").toBeDefined();
  });

  it("has a Node setup step (actions/setup-node)", () => {
    const steps = allSteps();
    const setupNode = steps.find(
      (s) => s.uses?.startsWith("actions/setup-node")
    );
    expect(setupNode, "missing actions/setup-node step").toBeDefined();
  });

  it("has an install step (npm ci)", () => {
    const steps = allSteps();
    const installStep = steps.find(
      (s) => s.run === "npm ci" || s.run?.includes("npm ci")
    );
    expect(installStep, "missing npm ci step").toBeDefined();
  });

  it("has a docs build step (npm run docs:build)", () => {
    const steps = allSteps();
    const buildStep = steps.find(
      (s) =>
        s.run === "npm run docs:build" ||
        s.run?.includes("docs:build") ||
        s.run?.includes("vitepress build")
    );
    expect(buildStep, "missing docs build step (npm run docs:build)").toBeDefined();
  });

  it("build step does NOT have continue-on-error (failure must stop deploy)", () => {
    const steps = allSteps();
    const buildStep = steps.find(
      (s) =>
        s.run === "npm run docs:build" ||
        s.run?.includes("docs:build") ||
        s.run?.includes("vitepress build")
    );
    expect(
      buildStep?.["continue-on-error"],
      "build step has continue-on-error — build failure must stop the workflow"
    ).toBeFalsy();
  });

  it("has a deploy step that publishes the built output", () => {
    const steps = allSteps();
    // Look for a GitHub Pages deploy action or a run step that does deploying
    const deployStep = steps.find(
      (s) =>
        s.uses?.includes("deploy-pages") ||
        s.uses?.includes("gh-pages") ||
        s.uses?.includes("upload-pages-artifact") ||
        s.run?.includes("deploy")
    );
    expect(
      deployStep,
      "missing deploy step (expected deploy-pages, gh-pages, or upload-pages-artifact action)"
    ).toBeDefined();
  });

  it("is a distinct file from the release workflow", () => {
    const releasePath = join(REPO_ROOT, ".github/workflows/release.yml");

    // If release.yml exists (and it should), ensure content differs
    if (existsSync(releasePath)) {
      const docsContent = readFileSync(WORKFLOW_PATH, "utf-8");
      const releaseContent = readFileSync(releasePath, "utf-8");
      expect(
        docsContent,
        "docs-deploy.yml content is identical to release.yml — they must be separate workflows"
      ).not.toBe(releaseContent);
    }
  });

  // ── helpers ──

  function allSteps(): Step[] {
    const jobs = workflow.jobs ?? {};
    const steps: Step[] = [];
    for (const job of Object.values(jobs)) {
      if (job.steps) steps.push(...job.steps);
    }
    return steps;
  }
});
