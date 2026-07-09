# kflow upgrade

Plan or apply a kflow package version upgrade for the current project.

## Usage

```
kflow upgrade [target] [--apply]
```

## Targets

If no target is provided, `latest` is used.

```bash
kflow upgrade
kflow upgrade latest
kflow upgrade next
kflow upgrade 2.1.0
```

Targets may be npm versions or dist-tags.

## Dry run by default

Without `--apply`, `kflow upgrade` prints the package manager it detected and
the commands it would run. It does not modify `package.json`, lockfiles, or
kflow-owned asset directories.

## Apply mode

With `--apply`, `kflow upgrade` performs two steps:

1. Upgrade the project dependency to `kflow@<target>`
2. Run the upgraded CLI's `kflow sync`

The sync step is invoked through the detected package manager so the upgraded
CLI version performs the asset reconciliation. The spawned `kflow sync`
refreshes all installed-platform Runtime Skill Directories per
`.kflow/meta.json` (see [kflow sync](/cli/sync)).

| Lockfile | Package manager | Upgrade command | Sync command |
|----------|-----------------|-----------------|--------------|
| `pnpm-lock.yaml` | pnpm | `pnpm add -D kflow@<target>` | `pnpm exec kflow sync` |
| `yarn.lock` | yarn | `yarn add -D kflow@<target>` | `yarn kflow sync` |
| `bun.lockb` or `bun.lock` | bun | `bun add -d kflow@<target>` | `bunx kflow sync` |
| `package-lock.json` | npm | `npm install --save-dev kflow@<target>` | `npx kflow sync` |
| none | npm | `npm install --save-dev kflow@<target>` | `npx kflow sync` |

## Failure behavior

If the package upgrade step fails, `kflow upgrade --apply` exits non-zero and
does not run `sync`.

If the package upgrade succeeds but `sync` fails, the command exits non-zero and
reports that the package was upgraded but asset sync failed. It does not
automatically roll back the package version; fix the sync failure and rerun the
reported sync command.
