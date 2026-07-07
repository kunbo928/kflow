# kflow validate

Validate YAML frontmatter in Markdown files.

## Usage

```
kflow validate --file <f> | --dir <d> [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--file <f>` | Validate a single file |
| `--dir <d>` | Validate all `.md` files in a directory |
| `--require <field>` | Require a specific frontmatter field (repeatable) |
| `--json` | Output results as JSON |
| `--yaml-only` | Validate YAML syntax only, skip schema checks |

Exactly one source (`--file` or `--dir`) is required.

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | All checks pass |
| 1 | One or more validation failures |
| 2 | Argument error (missing or invalid `--file` / `--dir`) |

## Examples

```bash
kflow validate --file .kflow/features/my-feature.md
kflow validate --dir .kflow/features --require status --require title
```
