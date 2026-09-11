# Linting

ESLint is configured in [`eslint.config.js`](../eslint.config.js) (flat config, ESLint 10).

```sh
bun run lint       # report
bun run lint:fix   # apply autofixes
```

## What is enabled

Three rule families are active, per the decision to activate linting incrementally:

| Family           | Key rules                                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Unused variables | `@typescript-eslint/no-unused-vars` (the `_` prefix marks an intentional discard)                                                       |
| React Hooks      | `react-hooks/*` — `rules-of-hooks`, `exhaustive-deps`, `set-state-in-effect`, and the rest of the v7 set                                |
| Promise handling | `no-floating-promises`, `no-misused-promises`, `await-thenable`, `require-await`, `no-async-promise-executor`, `require-atomic-updates` |

`no-floating-promises` is the reason this is worth having: an unawaited wallet
operation fails silently in the extension. It needs type information, so `src/**`
is linted with `parserOptions.project` pointed at `tsconfig.json`. `scripts/**` and
the Vite configs are linted without type information — they are not in any tsconfig
`include`, and adding them would mean a second project just for build scripts.

Prettier owns formatting. `eslint-config-prettier` is applied last so ESLint never
reports a formatting conflict.

## Everything is a warning, on purpose

ESLint had never actually run on this repo: the old `.eslintrc.js` was eslintrc-format,
ESLint itself was not installed, and no `lint` script existed. Turning the rules on
surfaces a backlog, so **every rule is set to `warn`** and `bun run lint` exits 0.
CI is not gated on it yet.

Current baseline — 127 files linted, **0 errors, 252 warnings**:

| Count | Rule                                                                                   |
| ----- | -------------------------------------------------------------------------------------- |
| 97    | `@typescript-eslint/no-floating-promises`                                              |
| 28    | `@typescript-eslint/no-unused-vars`                                                    |
| 22    | `react-hooks/set-state-in-effect`                                                      |
| 16    | `@typescript-eslint/no-unnecessary-type-assertion`                                     |
| 14    | unused `eslint-disable` directives                                                     |
| 13    | `@typescript-eslint/no-unused-expressions`                                             |
| 12    | `@typescript-eslint/require-await`                                                     |
| 10    | `@typescript-eslint/prefer-promise-reject-errors`                                      |
| 9     | `@typescript-eslint/no-misused-promises`                                               |
| ~31   | the long tail (`react-hooks/immutability`, `preserve-caught-error`, `prefer-const`, …) |

The 14 unused `eslint-disable` directives are mostly leftovers pointing at
`@typescript-eslint/no-explicit-any`, which this config turns off. They are harmless;
delete them as you touch each file.

## Promoting to errors

The intended path is per-rule, not all at once:

1. Burn a rule's warnings down to zero — start with `no-unused-vars` (mechanical,
   largely autofixable) and `react-hooks/set-state-in-effect` (concentrated in a few
   components).
2. Change that rule from `'warn'` to `'error'` in `eslint.config.js`.
3. Once at least the three target families are at `error`, add a lint step to
   `.github/actions/build-extension/action.yml` (after `Typecheck`) and to
   `.husky/pre-commit`.

`no-floating-promises` is the largest group (97) and the one most likely to hide real
bugs; review those by hand rather than adding `void`, since each site is either a
genuine missing `await` or a deliberate fire-and-forget.

## Rules deliberately off

`no-explicit-any` and the `no-unsafe-*` family are off. This codebase crosses the
Chrome extension message boundary constantly, where values genuinely arrive untyped;
leaving them on produced noise that buried the three families above.
