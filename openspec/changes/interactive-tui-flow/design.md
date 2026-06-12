## Context

`yaml-profile-comparator` is a local Node.js CLI for developers working on Spring Boot projects. The tool compares two `application-{perfil}.yml` files (optionally against an `application.yml` base) and reports which keys are present in one and missing in the other. It is a pure read-only developer aid, not a runtime dependency.

The current code base (as of the archived change `2026-06-11-yaml-profile-comparator`) has the comparison engine (`src/merge.js`, `src/flatten.js`, `src/diff.js`) and the rendering helpers (`src/render.js`, `src/colors.js`) working and tested manually. The interactive flow (`src/interactive.js`) is a `readline`-based sequence of free-text questions that asks the user to type paths and profile names. The flag-based mode (`src/args.js`, `src/index.js::resolveFromFlags`) takes individual flag values and reconstructs filenames like `application-{profile-a}.yml`.

This change replaces the user-facing flow without touching the comparison engine. It introduces a TUI built on `@inquirer/prompts`, adds an ASCII-art banner, switches the project to ESM, and rewrites the flag interface around absolute file paths.

Constraints that shape the design:

- The tool is local-only and developer-facing. There is no server, no API, no concurrent access.
- Output must be coloured when stdout is a TTY and plain when piped (already true via `src/colors.js`).
- The tool must run on Windows, Linux, and macOS without shell-specific commands.
- The current `engines.node >= 16` must move to `>= 18` because the chosen TUI library is ESM-only.
- No new test framework is introduced; verification is manual smoke tests.

## Goals / Non-Goals

**Goals:**

- A single, predictable interactive flow that always works the same way regardless of the user's filesystem layout.
- Default working directory = the directory the user is in when they launch the tool. No need to type a path.
- File selection by browsing, not by typing.
- The base file (`application.yml` or `application.yaml`) is auto-detected; the user is asked only when there is genuine ambiguity.
- Flag-based mode that takes absolute paths so it composes well with shell scripts and CI.
- Preserve the engine output contract: `{ basePath, profileAPath, profileBPath, profileAName, profileBName }`.
- Keep ANSI colours, no emojis, cross-platform support.

**Non-Goals:**

- A graphical or web UI. The tool stays a terminal program.
- Reading `spring.profiles.active`, `spring.config.import`, or any other indirect Spring Boot mechanism. Files are still named explicitly by the user.
- Persisting any state between invocations (no "last used directory" file).
- Watching the filesystem for changes. Single-shot execution.
- Supporting absolute paths in the interactive TUI. The TUI flow is always relative to a chosen working directory; absolute paths are a flag-mode concern.
- A new test framework. Verification stays manual.
- Touching `merge.js`, `flatten.js`, or `diff.js`.

## Decisions

### D1. TUI library: `@inquirer/prompts`

**Why:** It is the actively maintained successor of the classic `inquirer`, exposes the high-level prompts we need (`select`, `confirm`), handles raw mode / signals / resize internally, and renders with a consistent look.

**Alternatives considered:**

- `prompts` (terkel): CommonJS, no migration cost. Rejected because its keyboard model is less polished and `@inquirer/prompts` is the de-facto standard today.
- `enquirer`: API less stable, raw-mode edge cases.
- Hand-rolled TTY: zero dependencies, but a lot of code to maintain for resize, signals, and Windows console quirks.

**Cost:** The library is ESM-only, which forces a project-wide migration to ESM (see D2).

### D2. Migrate the project to ESM and bump `engines.node` to >= 18

**Why:** `@inquirer/prompts` ships as ESM and the project needs to `import` it. Mixing CJS and ESM in a small CLI is more painful than just converting everything.

**Approach:**

- Set `"type": "module"` in `package.json`.
- Rewrite `src/*.js` to use `import`/`export`. Names of files stay the same; the entry point in `package.json` bin is unchanged.
- Update `engines.node` from `>= 16` to `>= 18` because `@inquirer/prompts` requires it.
- The shebang `#!/usr/bin/env node` on `src/index.js` is preserved.

**Alternative considered:** Keep CommonJS and dynamically `import()` `@inquirer/prompts`. Rejected because it produces an awkward two-style codebase for no real benefit at this size.

### D3. New flag set: `--base-path`, `--profile-a-path`, `--profile-b-path`

**Why:** In a script or CI invocation the caller already knows the absolute paths. Asking for a "profile name" and having the tool build the filename is a relic of the prompt-driven mode and adds nothing in non-interactive use.

**Mapping from old to new flags:**

| Old flag             | New flag                | Notes                                                  |
|----------------------|-------------------------|--------------------------------------------------------|
| `--base <path>`      | `--base-path <abs>`     | Optional in both. Non-existent file means "no base".   |
| `--profile-a <name>` | (removed)               | Use `--profile-a-path <abs>` instead.                  |
| `--profile-b <name>` | (removed)               | Use `--profile-b-path <abs>` instead.                  |
| `--profile-a-path`   | `--profile-a-path <abs>`| Renamed for symmetry. Now the value is the file itself. |
| `--profile-b-path`   | `--profile-b-path <abs>`| Renamed for symmetry. Now the value is the file itself. |
| `-y`, `--yes`        | `-y`, `--yes`           | Unchanged.                                             |
| `-h`, `--help`       | `-h`, `--help`          | Unchanged.                                             |

**Breaking-change handling:** Out of scope. This is a developer tool used by a single user; no external consumers, no migration window. Old flags are removed outright.

### D4. Working-directory picker: arrow-key navigation across levels

**Why:** Typing paths is the main source of friction today. With a picker, the user can land in the right directory by pressing ↓ a few times and Enter.

**Layout (one entry per line, `>` marks the cursor):**

```
? Working directory: (/home/sgalan/proj/src/main/resources)
> ./
  ../
  ./config/
  ./static/
  ./templates/
```

**Behaviour:**

- `. /` is always present and means "stay in this directory". It is the "confirm" action.
- `../` is always present (except in the OS root, where it would loop; we keep it visible and the directory stays at `/` if the user selects it). Means "go up one level" and re-list.
- Subdirectories are listed alphabetically, directories only (no files at this stage). Hidden directories (those whose name starts with a dot) are filtered out to keep the list short, except `.` and `..` which are always shown explicitly.
- Enter on `./` finalises the working directory and moves to the file pickers.
- Enter on `../` or on a subdirectory navigates and re-renders the list. There is no "← Volver" option at this stage; the only way to go back from the working-directory picker is `Ctrl+C`.

### D5. File pickers: flat, no level changes, "← Volver" always present

**Why:** The working-directory step is the only place where the user navigates the tree. After that, picking a profile file is just "pick one of the YAMLs in this folder". If the folder is wrong, we need a way back without restarting the tool.

**Layout (one entry per line, `>` marks the cursor):**

```
? Profile A: (working dir = /home/sgalan/proj/src/main/resources)
> ← Volver
  application-dev.yml
  application-local.yml
  application-prod.yml
```

**Behaviour:**

- Only files whose name matches `*.yml` or `*.yaml` are listed. Sort alphabetically, case-insensitive. Files starting with a dot are excluded.
- "← Volver" is the first entry. Selecting it returns the user to the working-directory picker.
- If the directory contains zero YAML files, the list contains only "← Volver" and the message `(este directorio no contiene archivos .yml o .yaml)`. The user must go back.
- The same picker is used for profile A and profile B with different labels; behaviour is identical.

### D6. Base-file auto-detection in the working directory

**Why:** In the typical Spring Boot project layout, `application.yml` lives next to `application-{profile}.yml`. Asking the user to type its path is busywork.

**Resolution rules:**

- 0 matches: print `Aviso: no se encontró application.yml ni application.yaml en <dir>. Se comparará sin archivo base.` and continue without a base. The summary shows `base  -> (sin archivo base)`.
- 1 match: take it silently. Summary shows its full path.
- 2 matches (`application.yml` and `application.yaml` both present): prompt the user with an arrow-key selector listing the two candidates with their basenames.
- More than 2 matches: not expected (there are only two possible filenames). Defensive: if it happens, treat it as 2 matches and present all of them in the same selector.

The detection scans the working directory only (no recursion, no `config/`, no `BOOT-INF/classes/`). This matches the "no se contemplan varios niveles" decision from the conversation.

### D7. Display name = basename without extension, with one exception

**Why:** With the new flow the user picks a file, not a "profile name". The natural name to show in the report is the file's basename.

**Rules:**

- `profileAName = path.basename(profileAPath, path.extname(profileAPath))`.
- If that basename is `application`, the displayed name is `base` instead, so the summary reads `base  -> /path/to/application.yml` when the user actually picked a file called `application.yml` as a profile (rare but possible if the user is using the tool generically).
- The base file's displayed name is always `base`, regardless of basename.

### D8. Final summary and confirmation

**Why:** Last sanity check before running the comparison. Mirrors today's behaviour, just with the new path sources.

**Layout:**

```
Resumen de archivos
-------------------
  base  -> /home/sgalan/proj/src/main/resources/application.yml
  dev   -> /home/sgalan/proj/src/main/resources/application-dev.yml
  prod  -> /home/sgalan/proj/src/main/resources/application-prod.yml

? Continuar con la comparación? (Y/n)
```

`Y` is the default. Enter accepts. `n` aborts cleanly with exit 0 and an `Cancelado por el usuario.` info line. `-y`/`--yes` skips the prompt.

### D9. Module layout after the change

```
src/
  index.js         # entry point, parseArgs, dispatch to runInteractive or resolveFromFlags
  args.js          # arg parsing + help text (new flag set)
  interactive.js   # TUI flow (banner + pickers + summary)
  flags.js         # flag-based path resolution (extracted from current resolveFromFlags)
  render.js        # summary, diff, success, error, info, warning, prompt helpers
  colors.js        # ANSI wrapper, unchanged
  loader.js        # fileExists, loadYaml, validateFile, dirnameOf, plus listYmlFiles helper
  merge.js         # unchanged
  flatten.js       # unchanged
  diff.js          # unchanged
  banner.js        # new: ASCII-art title + credit
```

`index.js::runComparison({ basePath, profileAPath, profileBPath, profileAName, profileBName })` is the single shared function called by both modes. The contract is unchanged.

### D10. ASCII-art banner

**Why:** Sets the tone, gives a clear "the tool has started" signal, and carries the author's credit.

**Approach:**

- Hardcoded multi-line string in `src/banner.js`, not a figlet runtime dependency. Keeps the bundle small and deterministic.
- Target width: 60 characters, fits an 80-column terminal with margin.
- Two lines of art, then a centred `yaml profile comparator` line, then a centred `sgalan.dev` line. No emojis. No colour on the banner so it works in any TTY; if the user wants colour later it can be added without changing the structure.
- The banner is printed once at the very start of `runInteractive`, before the first picker.

**Sketch (final art will be in `src/banner.js`):**

```
   _   _  ___  __  __    _    ___ ___ ___
  | | | || __||  \/  |  /_\  / __| __| _ \
  | |_| || _| | |\/| | / _ \| (__| _||   /
   \___/ |___||_|  |_|/_/ \_\\___|___|_|_\
                yaml profile comparator
                    sgalan.dev
```

### D11. `loader.js` extension handling

**Why:** Today the code only knows `.yml`. The new flow promises `.yml` and `.yaml` for both auto-detection and validation.

**Changes:**

- New helper `listYmlFiles(dir)` returning the absolute paths of all `*.yml` and `*.yaml` files in `dir` (non-recursive, no dotfiles), sorted case-insensitively.
- New helper `findBaseCandidate(dir)` returning the absolute paths of any of `application.yml` / `application.yaml` present in `dir`, in that order, with the duplicate case still returning both.
- `validateFile` and `loadYamlOptional` are unchanged in spirit; the only adjustment is recognising both extensions when callers ask for "the base file" (the call site already passes the resolved absolute path, so no real change is needed there).
- The internal "build path as `application-<x>.yml`" logic in the old `resolveFromFlags` is deleted; flag mode passes the absolute path straight through.

## Risks / Trade-offs

- **Breaking CLI change in flag mode** → Documented in the proposal and called out in the help text. Single-user tool, no migration window is offered. Mitigation: keep the help text explicit so the new flags are discoverable.
- **Node >= 18 requirement** → Users on older Node versions must upgrade. Acceptable because Node 16 is out of maintenance and `@inquirer/prompts` requires 18+. Mitigation: bump is announced in the README and the `engines` field.
- **TUI breaks in non-TTY environments (CI, pipes)** → If stdout is not a TTY, `readline`-style fallbacks would be ideal, but `@inquirer/prompts` does not offer a non-interactive fallback for `select`. The TUI is the default; the flag mode is the path for CI/pipes. The proposal's scope is explicit about this. Mitigation: README and help text steer non-TTY users to flag mode.
- **ANSI-only output remains dependent on `process.stdout.isTTY`** → Already handled in `src/colors.js`. No new code needed.
- **`@inquirer/prompts` version churn** → The library has had breaking changes across v9 → v10. Pin a known-good minor version in `package.json` and review on upgrade. Mitigation: lock to a specific version range.
- **Windows console quirks (Ctrl+C handling, ANSI in legacy cmd)** → `@inquirer/prompts` and Node 18+ handle modern Windows Terminal and Windows ConPTY well. The cross-platform requirement is preserved. Mitigation: keep the manual smoke test for Windows in `tasks.md`.
- **Hidden directories (`.git`, `.idea`) are excluded from the working-directory picker** → Possible friction if the user keeps config in a dotfile-prefixed directory. Mitigation: easy follow-up if it ever becomes a real complaint; out of scope for this change.
- **ASCII banner is hardcoded and may look off in some terminal fonts** → Acceptable risk; the content is plain ASCII. If it ever needs reworking, it's a one-file change in `src/banner.js`.

## Migration Plan

- Single-shot migration: land the change in one pass, no gradual rollout, no feature flag.
- Steps in `tasks.md` follow the order: dependency + ESM conversion first, banner next, then TUI primitives (working-directory, file pickers, base auto-detection, summary), then flag-mode rewrite, then validation/colour, then manual smoke tests.
- Rollback: `git revert` the merge commit. There is no persistent state to clean up; the tool is stateless.
- README rewrite is a follow-up task listed in `tasks.md` but flagged as non-blocking.

## Open Questions

- None blocking. All H1–H11 questions raised in the exploration conversation have been resolved with user input.
