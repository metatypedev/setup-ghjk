# Create a GitHub Action Using TypeScript

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)

## Usage

```yaml
steps:
  - uses: metatypedev/setup-ghjk@v1
```

## Inputs

| Input                 | Desc                                                                                               | Default                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `version`             | `Ghjk version/ref to use`.                                                                         | `GHJK_VERSION` or latest GitHub release from ghjk repository.   |
| `skip-deno-install`   | Avoid installing separate deno and use what's found in environment.                                | `false`                                                         |
| `installer-url`       | Installer script to use.                                                                           | `https://raw.github.com/metatypedev/ghjk/${version}/install.ts` |
| `cook`                | Weather or not to run `ghjk envs cook`.                                                            | `true`                                                          |
| `cache-disable`       | Disable caching `$GHJK_DIR/envs`.                                                                  | `false`                                                         |
| `cache-save-if`       | Weather or not to enable cache saving. Doesn't affect cache restore step.                          | `true`                                                          |
| `cache-key-prefix`    | Override to add more target entropy to the cache key.                                              | `v0-ghjk`                                                       |
| `cache-key-env-vars:` | Comma separated list of prefixes to match env var names to. Matches will be hashed into cache key. | "", GHJK and DENO are included by always.                       |

| Env vars                   | Desc                                                                                         | Default                    |
| -------------------------- | -------------------------------------------------------------------------------------------- | -------------------------- |
| `GHJK_ENV`                 | The environment that'll bee cooked if `cook` is enabled.                                     | Default env from ghjkfile. |
| `GHJK_DIR`                 | Root directory for ghjk installation and envs.                                               | `$HOME/.local/share/ghjk`  |
| `GHJK_INSTALL_EXE_DIR`     | Location to install the `ghjk` exec.                                                         | `$HOME/.local/bin`         |
| `GHJK_INSTALL_DENO_EXEC`   | Alternative deno exec to use. This will not affect weather or not deno is installed as well. | `"deno"`                   |
| `GHJK_INSTALL_HOOK_SHELLS` | Comma separated list of shells to hook.                                                      | `bash`                     |
| `GHJK_INSTALL_HOOK_MARKER` | Marker to use when installing shell hooks. Hardly relevant in actions.                       | `ghjk-hook-marker`         |
| `GHJK_INSTALL_NO_LOCKFILE` | Hardcode `--no-lock` into the ghjk exec.                                                     | `false`                    |
