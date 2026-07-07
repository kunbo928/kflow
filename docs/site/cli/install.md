# kflow install

Install kflow integration for a specific AI coding platform.

## Usage

```
kflow install <platform>
```

## Supported platforms

| Platform | Install behavior |
|----------|-----------------|
| `codex` | Copy platform files; ready to use |
| `cursor` | Copy platform files; reload Cursor to apply |
| `claude` | Copy platform files; restart Claude Code to apply |
| `opencode` | Copy platform files; reload OpenCode to apply |

## Prerequisites

The project must be initialized first — run `kflow init` before installing
additional platform integrations.

## Examples

```bash
kflow install claude
kflow install cursor
```
