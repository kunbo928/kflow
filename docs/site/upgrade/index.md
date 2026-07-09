# Upgrade & Sync

## How upgrades work

kflow is distributed as an npm package. A version upgrade has two parts:
updating the package version and reconciling kflow-owned project assets.

Plan an upgrade without changing files:

```bash
kflow upgrade
kflow upgrade 2.1.0
```

Apply an upgrade:

```bash
kflow upgrade --apply
kflow upgrade 2.1.0 --apply
```

`kflow upgrade [target] --apply` upgrades the project's `kflow` package through
the detected package manager, then invokes the upgraded CLI's `kflow sync`.
The target defaults to `latest` and may also be a version or dist-tag.

`kflow sync` refreshes all installed-platform Runtime Skill Directories per
`.kflow/meta.json` — `.claude/skills/` for Claude Code, `.agents/skills/`
for universal platforms — plus the `.kflow/reference/` and `.kflow/tools/`
directories. Stale kflow-owned files are removed and non-kflow content is
preserved. Your project's own work artifacts (features,
issues, brainstorms, architecture notes, compound notes, etc.) are never
touched.

After upgrading, verify health:

```bash
kflow doctor
```

## The Documentation Site

The documentation site deploys from the main branch **independently** of npm
releases. Docs can be updated without publishing a new package version.

## Documentation currency

This site deploys from the `main` branch, which may describe features or
behavior that have not yet been published to npm. The current published npm
version may lag behind what you read here.

- **Published behavior** — what you get when you install `kflow@latest` from npm
- **Unreleased behavior** — changes merged to `main` but not yet tagged for
  release

Check your installed version: `kflow --version`

## Release process (for maintainers)

kflow publishes npm releases through a GitHub Actions workflow triggered by
version tags.

### Cutting a release

1. Ensure all changes are merged to `main`
2. Tag the release: `git tag vX.Y.Z`
3. Push the tag: `git push origin vX.Y.Z`

The workflow runs automatically:

- **Install** — `npm ci`
- **Test** — `npm test` (builds CLI, runs the full test suite including package
  content verification)
- **Build** — `npm run build` (explicit build step for release artifact)
- **Publish** — `npm publish` authenticated via `NPM_TOKEN`

If any step fails (e.g., a required asset is missing from the package, or a test
fails), the workflow stops and nothing is published.

### Requirements

- A `NPM_TOKEN` secret must be configured in the GitHub repository settings
  (Settings → Secrets and variables → Actions)
- Only pushes of version tags (`v*`) trigger the workflow; ordinary pushes to
  `main` do **not** publish

### Documentation site

The documentation site deploys separately from the `main` branch (see the docs
deploy workflow). Docs can be updated without cutting a package release.

## Diagnosing issues

Run `kflow doctor` to check:

- `.kflow/` structure is intact
- Default Platform is configured
- `kflow` is in `devDependencies`

If any check fails, the command reports the fix (e.g., "run: kflow init") and
exits with code 1.
