import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";

const REPO_ROOT = resolve(import.meta.dirname, "../..");
const WORKFLOW_PATH = join(REPO_ROOT, ".github/workflows/release.yml");

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
  env?: Record<string, unknown>;
}

describe("Release Workflow — config validation", () => {
  let workflow: Workflow;

  it("workflow file exists", () => {
    expect(
      existsSync(WORKFLOW_PATH),
      ".github/workflows/release.yml not found"
    ).toBe(true);
  });

  it("workflow is valid YAML", () => {
    const raw = readFileSync(WORKFLOW_PATH, "utf-8");
    expect(() => {
      workflow = parseYaml(raw) as Workflow;
    }).not.toThrow();
  });

  it("triggered by version tags (v*) only, not by main-branch push", () => {
    const on = workflow.on as Record<string, unknown>;
    expect(on?.push).toBeDefined();

    const pushConfig = on.push as Record<string, unknown>;

    // Must have a tags filter
    expect(pushConfig.tags, "missing on.push.tags (tag trigger required)").toBeDefined();

    // Tags must match version-tag pattern
    const tags = pushConfig.tags as string[];
    const hasVersionTagPattern = tags.some(
      (t) => t === "v*" || t.startsWith("v") || /^v\d/.test(t)
    );
    expect(
      hasVersionTagPattern,
      `expected a version-tag pattern (v*), got: ${JSON.stringify(tags)}`
    ).toBe(true);

    // Must NOT have on.push.branches (would auto-publish on main push)
    expect(
      pushConfig.branches,
      "on.push.branches must NOT be set (main-branch pushes should NOT trigger publish)"
    ).toBeUndefined();
  });

  it("has a checkout step (actions/checkout)", () => {
    const steps = allSteps();
    const checkoutStep = steps.find(
      (s) => s.uses?.startsWith("actions/checkout")
    );
    expect(checkoutStep, "missing actions/checkout step").toBeDefined();
  });

  it("has a Node setup step (actions/setup-node) with registry-url", () => {
    const steps = allSteps();
    const setupNode = steps.find(
      (s) => s.uses?.startsWith("actions/setup-node")
    );
    expect(setupNode, "missing actions/setup-node step").toBeDefined();
    // Must configure a registry so npm publish has a target
    const withConfig = setupNode!.with as Record<string, unknown> | undefined;
    expect(
      withConfig?.["registry-url"],
      "setup-node step missing registry-url"
    ).toBeDefined();
  });

  it("has an install step (npm ci)", () => {
    const steps = allSteps();
    const installStep = steps.find(
      (s) => s.run === "npm ci" || s.run?.includes("npm ci")
    );
    expect(installStep, "missing npm ci step").toBeDefined();
  });

  it("has a test step (npm test)", () => {
    const steps = allSteps();
    const testStep = steps.find(
      (s) => s.run === "npm test" || s.run?.includes("npm test")
    );
    expect(testStep, "missing npm test step").toBeDefined();
  });

  it("has an explicit build step (npm run build)", () => {
    const steps = allSteps();
    const buildStep = steps.find(
      (s) => s.run === "npm run build" || s.run?.includes("npm run build")
    );
    expect(buildStep, "missing npm run build step").toBeDefined();
  });

  it("has a publish step (npm publish) gated on NPM_TOKEN", () => {
    const steps = allSteps();
    const publishStep = steps.find(
      (s) => s.run === "npm publish" || s.run?.includes("npm publish")
    );
    expect(publishStep, "missing npm publish step").toBeDefined();

    // Publish must use NODE_AUTH_TOKEN → secrets.NPM_TOKEN
    const env = publishStep!.env as Record<string, unknown> | undefined;
    expect(
      env?.["NODE_AUTH_TOKEN"],
      "publish step missing NODE_AUTH_TOKEN env"
    ).toBeDefined();
    expect(
      String(env!["NODE_AUTH_TOKEN"]),
      "NODE_AUTH_TOKEN must reference secrets.NPM_TOKEN"
    ).toContain("NPM_TOKEN");
  });

  it("release workflow is a distinct file from any docs-deploy workflow", () => {
    // ADR 0011: docs deployment is a separate workflow from npm release
    const docsWorkflowPath = join(
      REPO_ROOT,
      ".github/workflows/docs-deploy.yml"
    );
    // This test doesn't mandate docs-deploy.yml exists yet (issue 08),
    // only that release.yml is its own file, not embedded in another workflow.
    // We also verify release.yml exists (which the first test already covers).
    const releaseExists = existsSync(WORKFLOW_PATH);
    expect(releaseExists, ".github/workflows/release.yml must exist").toBe(
      true
    );

    // If docs-deploy.yml exists, it must be a different file
    if (existsSync(docsWorkflowPath)) {
      const releaseContent = readFileSync(WORKFLOW_PATH, "utf-8");
      const docsContent = readFileSync(docsWorkflowPath, "utf-8");
      expect(releaseContent).not.toBe(docsContent);
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
