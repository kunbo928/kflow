# Project Onboarding Lifecycle Boundary

Completion evidence for the Project Onboarding lifecycle deletion test.

The lifecycle module is the single policy boundary used by all four lifecycle
commands:

| Caller | Lifecycle responsibility it consumes |
| --- | --- |
| `init` | Installation State inspection, platform validation, initialization, Runtime Skill Directory targeting, and asset ownership |
| `doctor` | Installation State and health facts |
| `sync` | authoritative targets, legacy fallback, and mirror reconciliation |
| `uninstall` | Installation State, platform/full-removal planning, shared ownership, preservation, and application |

Removing `src/project-onboarding/lifecycle.ts` would therefore require those
four callers to recreate the platform registry, Installation State parsing and
validation, entry-file ownership, Runtime Skill Directory ownership, packaged
asset targeting, synchronization, removal, and health policy. That is
meaningful policy redistribution, not the removal of a forwarding helper.

The former command-side alternatives were deleted during contraction:

- `src/commands/meta.ts`
- `src/commands/assets.ts`
- the unregistered legacy `src/commands/install.ts`

Command modules retain caller intent, interaction, rendering, package-manager
orchestration where not yet migrated, and exit selection.
