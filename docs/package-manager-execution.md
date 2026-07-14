# Package Manager Execution Boundary

Completion evidence for the package-manager deletion test.

The package-manager execution module is the shared policy boundary for both
Version Upgrade and full uninstall:

| Caller | Package-manager responsibility it consumes |
| --- | --- |
| `upgrade` | lockfile precedence, fallback selection, install and upgraded-CLI sync plans, execution order, and structured failures |
| `uninstall` | the same manager selection, package-removal plans, package-before-assets ordering, partial-uninstall state, and retry facts |

Removing `src/package-manager/execution.ts` would require both callers to
recreate lockfile precedence, npm/pnpm/yarn/bun command syntax, shell process
execution, environment override compatibility, exit handling, and sequencing.
That is meaningful policy redistribution rather than deletion of a forwarding
helper.

The command modules retain argument parsing, user-visible rendering, and exit
selection. Project asset ownership and deletion remain delegated to the
Project Onboarding lifecycle callback supplied to full-uninstall execution.
