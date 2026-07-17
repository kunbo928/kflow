# Tickets: Deepen Workflow CLI Modules

Deepen Project Onboarding, package-manager execution, and Project document parsing behind three high-leverage module interfaces. Source: [Deepen Workflow CLI Modules spec](.scratch/deepen-workflow-cli-modules/SPEC.md).

Work the **frontier**: any ticket whose blockers are all done. The initial frontier is **Establish authoritative Installation State through doctor**, **Deepen package-manager execution through Version Upgrade**, and **Deepen Project document parsing through validation**.

## Establish authoritative Installation State through doctor

**What to build:** Establish the first complete Project Onboarding lifecycle path so doctor evaluates the same authoritative Installation State that later lifecycle commands will use. Valid persisted state, absent state, malformed JSON, structurally invalid state, legacy entry-file evidence, and metadata/file disagreement must produce explicit health facts rather than caller-specific guesses.

**Blocked by:** None — can start immediately.

- [ ] The Project Onboarding lifecycle module exposes structured Installation State and health results through one cohesive interface.
- [ ] Valid persisted Installation State is authoritative over entry-file inference.
- [ ] File-based inference is used only when authoritative state is absent and is reported as inferred state.
- [ ] Malformed JSON and structurally invalid metadata are distinguishable from absent metadata.
- [ ] The platform registry colocates Platform Integration Template, entry-file, and Runtime Skill Directory facts.
- [ ] Doctor renders its existing user-visible checks and preserves its established exit behavior from lifecycle health results.
- [ ] Tests cross the lifecycle interface for state authority, inference, invalid shapes, shared entry files, unique entry files, and state disagreement.
- [ ] A small Workflow CLI regression set confirms doctor output and exit status remain compatible.

## Migrate Project Onboarding initialization

**What to build:** Make deterministic and interactive Project Onboarding use the lifecycle module to create the project skeleton, install selected Platform Integration Templates and Packaged Skill Assets, deduplicate shared Runtime Skill Directories, and persist authoritative Installation State while preserving current Workflow CLI behavior.

**Blocked by:** Establish authoritative Installation State through doctor.

- [ ] Deterministic and interactive initialization call the lifecycle module instead of reconstructing installation and state policy.
- [ ] Selected platforms receive their Platform Integration Templates and native Runtime Skill Directories.
- [ ] Platforms sharing a Runtime Skill Directory trigger one installation action for that directory.
- [ ] Existing user-authored project knowledge is preserved and project skeleton creation remains idempotent.
- [ ] Authoritative Installation State records the complete installed-platform set and package version after successful initialization.
- [ ] Existing platform-selection, already-installed, no-save, KFlow Brand Mark, success-output, and Project CLI Dependency behavior remains compatible.
- [ ] Lifecycle-interface tests cover single-platform, multi-platform, shared-directory, repeated-init, and existing-state paths.
- [ ] Workflow CLI tests retain only interaction, rendering, and representative end-to-end coverage.

## Migrate kflow-owned asset synchronization

**What to build:** Make synchronization use the lifecycle module to reconcile every installed platform's Kflow-Owned Asset Directories from the current package while preserving non-kflow skills and user-authored project knowledge.

**Blocked by:** Establish authoritative Installation State through doctor.

- [ ] Synchronization derives its targets from authoritative Installation State through the lifecycle interface.
- [ ] A legacy fallback remains explicit and deterministic when authoritative state is absent.
- [ ] Shared Runtime Skill Directories are reconciled once per operation.
- [ ] Packaged Skill Asset additions, changes, deletions, renames, and corrupted installed files are reconciled.
- [ ] Non-kflow skills inside shared Runtime Skill Directories are preserved.
- [ ] User-owned project knowledge remains untouched while Kflow-Owned Asset Directories are mirrored.
- [ ] Repeated synchronization is idempotent for universal-only, Claude-only, and mixed-platform installations.
- [ ] Policy-heavy synchronization tests cross the lifecycle interface; Workflow CLI tests cover wiring and the established success output.

## Migrate platform and full asset removal

**What to build:** Make platform uninstall and the filesystem phase of full uninstall use the lifecycle module so removals obey authoritative Installation State, shared Runtime Skill Directory ownership, kflow-generated entry-file rules, and user-content preservation.

**Blocked by:** Establish authoritative Installation State through doctor.

- [ ] Platform removal is planned and applied through structured lifecycle results.
- [ ] Removing one platform preserves a shared Runtime Skill Directory while another installed platform still depends on it.
- [ ] Removing the final owner deletes only kflow-owned skills and preserves unrelated skills and surrounding non-kflow content.
- [ ] Platform removal preserves project knowledge and the Project CLI Dependency.
- [ ] Full asset removal handles both universal and Claude Runtime Skill Directories and preserves non-kflow skills.
- [ ] Kflow-generated entry files are removed while non-kflow entry files are preserved.
- [ ] Removal updates authoritative Installation State only after the corresponding asset operation succeeds.
- [ ] Repeated removal remains safe where existing behavior permits it.
- [ ] Lifecycle-interface tests cover shared ownership, final ownership, legacy state, partial filesystem failure, and preservation; Workflow CLI tests cover prompts and rendering.

## Contract the Project Onboarding lifecycle implementation

**What to build:** Complete the Project Onboarding deepening by removing superseded state, registry, asset-copy, ownership, and health policy from command modules, leaving command modules responsible only for caller intent, interaction, rendering, and exit selection.

**Blocked by:** Migrate Project Onboarding initialization; Migrate kflow-owned asset synchronization; Migrate platform and full asset removal.

- [ ] Initialization, synchronization, doctor, and uninstall no longer merge or reinterpret Installation State independently.
- [ ] Platform facts have one source and no parallel entry-file or Runtime Skill Directory mappings remain.
- [ ] Asset ownership, target derivation, mirroring, preservation, and removal policy exist only behind the lifecycle interface.
- [ ] Superseded shallow modules are deleted or become genuine private implementation details rather than forwarding modules.
- [ ] Policy-matrix tests no longer need to repeat through every command.
- [ ] Existing command names, options, output contracts, exit behavior, prompts, and dry-run defaults remain compatible.
- [ ] The full test suite passes without adding a new runtime dependency category.
- [ ] The deletion test confirms that removing the lifecycle module would redistribute meaningful policy across all lifecycle callers.

## Deepen package-manager execution through Version Upgrade

**What to build:** Establish a package-manager module and process adapter through the complete Version Upgrade path, covering package-manager detection, dry-run planning, package installation, upgraded-CLI synchronization, execution ordering, and structured failures.

**Blocked by:** None — can start immediately.

- [ ] One package-manager interface owns lockfile precedence, fallback selection, planning, execution order, and structured outcomes.
- [ ] npm, pnpm, yarn, and bun plans preserve the established package install and upgraded-CLI synchronization behavior.
- [ ] Both supported bun lockfile names and multi-lockfile precedence are covered.
- [ ] Dry-run rendering is derived from the same plan used by apply mode.
- [ ] Production execution uses a process adapter; tests use a deterministic adapter that records plans and returns controlled outcomes.
- [ ] Package installation failure prevents synchronization and returns the established failure meaning.
- [ ] Synchronization failure after successful installation reports partial success and the correct retry instruction without rollback.
- [ ] Version Upgrade command output and exit behavior remain compatible.
- [ ] Package-manager matrix and failure tests cross the module interface; Workflow CLI tests retain representative sequencing and rendering coverage.

## Migrate full uninstall package removal

**What to build:** Complete a safe full-uninstall path by combining package-manager removal results with lifecycle asset-removal results, then remove duplicated package-manager knowledge from uninstall.

**Blocked by:** Migrate platform and full asset removal; Deepen package-manager execution through Version Upgrade.

- [ ] Full uninstall obtains package removal plans and outcomes from the package-manager module.
- [ ] Package removal failure skips lifecycle asset deletion and preserves the established recovery guidance.
- [ ] Successful package removal proceeds to lifecycle asset deletion exactly once.
- [ ] Filesystem deletion failure after successful package removal reports partial uninstall without re-running package removal.
- [ ] Dry-run and apply modes derive package-manager details from the same plan.
- [ ] Uninstall no longer owns lockfile precedence, package-manager command syntax, shell execution, or environment override policy.
- [ ] Existing package-manager-specific uninstall behavior, output, preservation notes, and exit status remain compatible.
- [ ] Deterministic adapter tests cover success, package failure, asset failure, retry, and no unintended second invocation.
- [ ] The deletion test confirms that removing the package-manager module would duplicate policy across Version Upgrade and uninstall.

## Deepen Project document parsing through validation

**What to build:** Establish the Project document module through validation so eligible-file discovery, ignore rules, frontmatter extraction, YAML parsing facts, mapping facts, and structured diagnostics have one interface and one shared corpus.

**Blocked by:** None — can start immediately.

- [ ] The Project document module reports discovery and parsing facts without deciding validation or search policy.
- [ ] Discovery consistently ignores dependency, build, and version-control directories.
- [ ] Missing, unterminated, empty, malformed, mapping, scalar, and array frontmatter produce structured and distinguishable facts.
- [ ] Markdown and YAML-only inputs preserve their established parsing behavior.
- [ ] Validation applies required-field and mapping policy to Project document results without reaching past the module interface.
- [ ] Text and JSON diagnostics, validation counts, file/directory modes, and exit codes remain compatible.
- [ ] A shared parsing corpus tests the Project document interface across delimiter and YAML cases.
- [ ] Workflow CLI validation tests focus on options, rendering, exit status, and representative end-to-end behavior.

## Migrate search and contract Project document parsing

**What to build:** Make search consume the Project document module while retaining its tolerant policy, filtering, full-text matching, sorting, and output contracts; then remove duplicated discovery and frontmatter parsing.

**Blocked by:** Deepen Project document parsing through validation.

- [ ] Search and validation consume the same Project document discovery and parsing facts.
- [ ] Search explicitly applies its established tolerant policy to missing, malformed, or unterminated frontmatter.
- [ ] Exact, contains, repeated, and OR filters retain their established behavior.
- [ ] Full-text matching, sorting, missing-field ordering, summary/full text output, and JSON truncation remain compatible.
- [ ] Search and validation agree on eligible input discovery while retaining their distinct command policies.
- [ ] Duplicate delimiter extraction, YAML parsing, ignore rules, and document loading are removed from command modules.
- [ ] Shared parser tests live at the Project document interface; command tests cover only command-specific policy and presentation.
- [ ] The full test suite passes without introducing a new runtime dependency category.
- [ ] The deletion test confirms that removing the Project document module would force format facts back into both search and validation.
