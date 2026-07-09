# Dependency Policy

The Workflow CLI ships a small, deterministic set of runtime dependencies.
This page records the boundary so that future implementation agents know which
categories are approved and which require separate decisions.

## Approved runtime dependencies

| Package | Category | Supported commands |
|---|---|---|
| `@inquirer/prompts` | Interactive CLI prompts | `init`, `uninstall` |
| `chalk` | Terminal styling | All |
| `commander` | Command / option parsing | All (`init`, `doctor`, `search`, `sync`, `uninstall`, `upgrade`, `validate`) |
| `fast-glob` | Asset discovery | `search`, `validate` |
| `ora` | Terminal spinners | `init`, `uninstall` |
| `yaml` | YAML / frontmatter parsing | `search`, `validate` |
| `zod` | Validation contracts | `validate` |

## Boundary

- The Workflow CLI is a **deterministic project tool** — it sets up, validates,
  and discovers project assets. It does not handle workflow intent or interactive
  agent loops.
- Interactive prompts (`init`, `uninstall`) are discovery aids that still
  support deterministic flag paths (`--platform`, `--apply`).
- `k-flow` is the **Workflow Router** inside the Agent Runtime (see
  [Workflows > k-flow](/workflows/k-flow) for how routing intent works).

## UX dependencies

`@inquirer/prompts`, `chalk`, and `ora` are approved per ADR 0015.
Non-interactive flags (`--platform`, `--apply`) still cover automation;
interactive pickers serve as a discovery aid for first-time users.

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
