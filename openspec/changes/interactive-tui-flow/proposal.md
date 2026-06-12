## Why

The current interactive flow uses readline-based text prompts that ask the user to type paths and profile names, which is error-prone (typos in paths, confusion about whether `application-{name}.yml` lives next to the base or elsewhere) and slow. Users running the tool from a Spring Boot project usually have the files at hand in `src/main/resources/` and would rather pick them from a list than type paths. The current flow also assumes profile files are named `application-<name>.yml`, which is too coupled to Spring Boot's naming convention and prevents the tool from being reused as a generic YAML comparator. Finally, the flag-based mode still requires the user to spell out a "profile name" and have the tool build the filename, when in scripts and CI the caller almost always knows the full absolute path already.

This change replaces the interactive flow with a fully guided TUI: ASCII banner, arrow-key directory picker, flat file pickers for the two profiles, automatic base-file detection, summary, and confirmation. It also rewrites the flag-based mode around absolute paths. The tool is still a Spring Boot-flavoured YAML comparator, but it stops pretending it doesn't know about file selection.

## What Changes

- Add a new interactive TUI flow launched by default when no flag is provided.
- Print an ASCII-art banner with the title "yaml profile comparator" and a "sgalan.dev" credit on startup.
- Replace text-input prompts for the base file, profile A, and profile B with arrow-key selectors.
- Add a working-directory picker that starts at `process.cwd()`, always offers `./` (refresh) and `../` (go up), and lists subdirectories. Selection is confirmed with Enter.
- Add flat file pickers (no level changes) for profile A and profile B that show only `*.yml` and `*.yaml` files inside the chosen working directory, plus a "← Volver" option to return to the working-directory picker when the directory has no YAML files.
- Auto-detect `application.yml` and `application.yaml` inside the working directory. If none exist, print a warning and continue without a base. If exactly one exists, take it silently. If both exist, prompt the user with an arrow-key selector to choose one.
- Print a final summary listing the three resolved paths (base optional, profile A, profile B) and ask for confirmation before running the comparison.
- Add `@inquirer/prompts` as a runtime dependency and migrate the project from CommonJS to ESM (`"type": "module"` in `package.json`, `engines.node >= 18`).
- Rewrite the flag-based mode so each flag specifies the absolute file path directly. **BREAKING**: replace `--base`, `--profile-a`, `--profile-b`, `--profile-a-path`, `--profile-b-path` with `--base-path`, `--profile-a-path`, `--profile-b-path`. The two profile flags remain required; `--base-path` is optional (missing or non-existent file means "no base"). The short flags `-y` and `-h` are kept.
- Display the basename (without extension) of each chosen file as the profile name in the report. The basename `application` is rendered as `base` for readability.
- Support both `.yml` and `.yaml` extensions throughout the project (auto-detection, validation, summary). The current restriction to `.yml` only is removed.
- The three picker screens (working directory, profile A, profile B) MUST each be navigable backwards: hitting Enter on "← Volver" from a file picker returns to the working-directory picker, and from the working-directory picker it is not offered (the user can only move forward into subdirectories, refresh, or go up).
- Keep `mergeDeep`, `flatten`, and `diffKeys` unchanged. The change is confined to the user-facing flow and to file/path resolution.

## Capabilities

### New Capabilities
- `tui-interactive-flow`: The TUI-driven interactive flow (banner, working-directory picker, file pickers, base auto-detection, summary, confirmation).
- `cli-flags-absolute-paths`: The rewritten flag-based mode that uses absolute paths for the base and both profile files.

### Modified Capabilities
- `profile-comparison`: Requirements change. The "Interactive mode prompts" requirement is rewritten to describe the TUI flow. The "Flag-based non-interactive mode" requirement is rewritten around the new flags. The "Strict file existence and parseability" requirement is extended to cover `.yaml` as well as `.yml`. A new requirement is added for the ASCII banner. A new requirement is added for working-directory navigation including the `./` and `../` entries. A new requirement covers base-file auto-detection including the 0/1/multiple-matches cases.

## Impact

- `package.json`: add `@inquirer/prompts` to `dependencies`; set `"type": "module"`; bump `engines.node` from `>=16` to `>=18`.
- `src/args.js`: rewrite to expose only `--base-path`, `--profile-a-path`, `--profile-b-path`, `-y/--yes`, `-h/--help`. Removing old flags is a breaking CLI change.
- `src/interactive.js`: rewrite using `@inquirer/prompts` instead of `readline`. The function returns the same shape as today (`{ basePath, profileAPath, profileBPath, profileAName, profileBName }`) so `src/index.js::runComparison` is untouched.
- `src/index.js::resolveFromFlags`: rewrite to use the new flags. The contract with `runComparison` (file paths and display names) is preserved.
- `src/loader.js`: extend YAML-extension handling to `.yaml`; keep `.yml` working.
- `src/render.js`: keep current output but ensure summary tolerates the `base` label and the basename-without-extension display names.
- `README.md`: needs a full rewrite of the "Uso interactivo" and "Uso con flags" sections, plus an updated "Alcance y limitaciones" note about `.yml`/`.yaml`. Noted as a follow-up task; not in scope for this proposal's implementation.
- Test surface: there are currently no automated tests. The change adds manual verification steps in `tasks.md` but does not introduce a test framework.
