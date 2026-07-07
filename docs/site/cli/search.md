# kflow search

Search YAML-frontmatter Markdown files in a directory.

## Usage

```
kflow search --dir <dir> [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--dir <dir>` | Directory to search (required) |
| `--filter <k=v>` / `-f <k=v>` | Filter by frontmatter field (repeatable) |
| `--query <text>` / `-q <text>` | Full-text search in file content |
| `--full` | Print full file content instead of matches |
| `--json` | Output results as JSON |
| `--sort-by <field>` | Sort results by a frontmatter field |
| `--order <asc\|desc>` | Sort order (default: `desc`) |

## Examples

```bash
kflow search --dir .kflow/features --filter status=draft
kflow search --dir .kflow/issues -q "timeout" --json
```
