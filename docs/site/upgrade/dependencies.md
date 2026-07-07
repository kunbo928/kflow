# Dependency Policy

The Workflow CLI ships a small, deterministic set of runtime dependencies.
This page records the boundary so that future implementation agents know which
categories are approved and which require separate decisions.

## Approved runtime dependencies

| Package | Category | Supported commands |
|---|---|---|
| `commander` | Command / option parsing | All (`init`, `install`, `search`, `validate`, `doctor`, `sync`) |
| `zod` | Validation contracts | `validate` |
| `fast-glob` | Asset discovery | `search`, `validate` |
| `yaml` | YAML / frontmatter parsing | `search`, `validate` |

## Boundary

- The Workflow CLI is a **deterministic project tool** — it sets up, validates,
  and discovers project assets. It does not handle workflow intent or interactive
  agent loops.
- `k-flow` is the **Workflow Router** inside the Agent Runtime (see
  [Workflows > k-flow](/workflows/k-flow) for how routing intent works).

## Deferred: UX dependencies

`@inquirer/prompts`, `chalk`, and `ora` are not approved for this pass.
Optional interactive flows (e.g., a guided `init` or `install` prompt) may be
considered later, but non-interactive flags (`--no-save`, `--platform`, etc.)
already cover automation. A separate ADR is required before adding any UX
runtime dependency.

## Deferred: Telemetry

`posthog-node` requires a separate opt-in privacy and product decision. No
telemetry code ships in the current Workflow CLI, and any future telemetry must
go through an explicit ADR that addresses opt-in, data collected, and
retention.

## Deferred: Release tooling

`@changesets/*` requires a separate release-process decision. The current
release model is **tag-triggered npm publish** (see ADR 0010 in
`docs/adr/0010-tag-triggered-npm-publish.md`). Switching to changesets would
replace that mechanism and needs its own ADR.

## Guard

A test in `tests/packaging/package-contents.test.ts` verifies that every
`dependencies` key belongs to the approved allowlist and that no deferred
package is present. Adding an out-of-scope runtime dependency will fail CI with
a message pointing back to this page.

## DevDependencies

Build, test, and documentation tooling (`typescript`, `vitest`, `vitepress`,
`@types/node`) lives in `devDependencies` and is outside the runtime-boundary
scope of this policy.
