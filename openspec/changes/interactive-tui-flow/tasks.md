## 1. Dependency and module-system migration

- [x] 1.1 Run `npm install @inquirer/prompts` and verify the entry appears in `package.json` `dependencies` with a pinned minor version
- [x] 1.2 Set `"type": "module"` in `package.json` and bump `engines.node` from `>=16` to `>=18`
- [x] 1.3 Convert `src/index.js` from `require`/`module.exports` to `import`/`export` syntax; keep the shebang and the `main()` orchestration intact
- [x] 1.4 Convert `src/args.js`, `src/interactive.js`, `src/loader.js`, `src/merge.js`, `src/flatten.js`, `src/diff.js`, `src/render.js`, `src/colors.js` to ESM
- [x] 1.5 Run `node src/index.js --help` after the conversion and confirm the help text still prints without parse errors

## 2. ASCII-art banner

- [x] 2.1 Create `src/banner.js` exporting a `renderBanner()` function that prints the multi-line ASCII banner (title "yaml profile comparator" + credit "sgalan.dev") to stdout
- [x] 2.2 Verify the banner contains no emoji characters and no ANSI codes (it should be plain ASCII)
- [x] 2.3 Verify the banner fits within an 80-column terminal with at least one column of margin on each side
- [x] 2.4 Print the banner at the very start of `runInteractive` in `src/interactive.js`, before the first picker

## 3. Loader helpers for the new flow

- [x] 3.1 Add `listYmlFiles(dir)` to `src/loader.js`: returns absolute paths of `*.yml` and `*.yaml` files in `dir`, non-recursive, no dotfiles, sorted case-insensitively
- [x] 3.2 Add `findBaseCandidates(dir)` to `src/loader.js`: returns the absolute paths of any `application.yml` and/or `application.yaml` present in `dir`, preserving that order, empty array if none
- [x] 3.3 Confirm `validateFile` and `loadYamlOptional` work unchanged for both `.yml` and `.yaml` files (no code change expected; the call sites already pass absolute paths)
- [x] 3.4 Unit-style smoke check: call `listYmlFiles` and `findBaseCandidates` against a temporary directory containing both extensions, one of each, and neither, and verify the returned arrays

## 4. TUI primitives in `src/interactive.js`

- [x] 4.1 Replace the `readline`-based `ask` and `confirm` helpers with imports from `@inquirer/prompts` (`select`, `confirm`)
- [x] 4.2 Implement `pickWorkingDirectory(startDir)` using `select` from `@inquirer/prompts`: render `./`, `../`, and the sorted list of subdirectories, loop on `../` and on a selected subdirectory until `./` is chosen, return the final absolute directory
- [x] 4.3 Implement `pickYamlFile(dir, label)` using `select` from `@inquirer/prompts`: render `← Volver` followed by the result of `listYmlFiles(dir)`, return the chosen absolute path or the sentinel `__back__`
- [x] 4.4 Implement `pickBaseCandidate(dir, candidates)` using `select` from `@inquirer/prompts`: render the absolute paths of the candidates and return the chosen one
- [x] 4.5 Wire the three primitives into a single `runInteractive` loop that handles the `← Volver` jumps: file pickers return to the working-directory picker; the working-directory picker has no "back"

## 5. Base-file auto-detection in the flow

- [x] 5.1 After the working directory is chosen, call `findBaseCandidates` on it
- [x] 5.2 If the result is empty, call `renderWarning` with the message `no se encontró application.yml ni application.yaml en <dir>; se comparará sin archivo base`
- [x] 5.3 If the result has one element, use it as the base path silently
- [x] 5.4 If the result has two elements, call `pickBaseCandidate` and use the user's choice

## 6. Final summary and confirmation

- [x] 6.1 Compute display names with `path.basename(p, path.extname(p))`; if the basename is `application`, render it as `base`
- [x] 6.2 Call the existing `renderSummary` (or extend it) to show base, profile A, profile B with their display names
- [x] 6.3 After the summary, call `confirm` from `@inquirer/prompts` with the prompt `Continuar con la comparación?` and default `true`
- [x] 6.4 If the user rejects, print `Cancelado por el usuario.` via `renderInfo` and return an object that causes `index.js` to exit with code 0

## 7. Flag-based mode rewrite

- [x] 7.1 Rewrite `src/args.js::parseArgs` to recognise only `--base-path`, `--profile-a-path`, `--profile-b-path`, `-y` / `--yes`, `-h` / `--help`
- [x] 7.2 Update `printHelp` to document the new flags and to call out that `--profile-a` and `--profile-b` (the old "profile name" flags) are gone
- [x] 7.3 Rewrite `src/index.js::resolveFromFlags` to resolve each path against `process.cwd()` (if relative) and return `{ basePath, profileAPath, profileBPath, profileAName, profileBName }` ready for `runComparison`
- [x] 7.4 In flag mode, if `--base-path` is missing or points to a non-existent file, set `basePath = null` and emit a warning; do not abort
- [x] 7.5 In flag mode, if `--profile-a-path` or `--profile-b-path` is missing, print usage and exit with code 1
- [x] 7.6 Smoke-check: `node src/index.js --base-path /p/application.yml --profile-a-path /p/application-dev.yml --profile-b-path /p/application-prod.yml` runs the comparison without prompting

## 8. `index.js` orchestration

- [x] 8.1 Confirm the `main()` function still branches on `flags.hasAnyFlag` to decide between `resolveFromFlags` and `runInteractive`
- [x] 8.2 Confirm `runInteractive` returns the same shape as `resolveFromFlags` so `runComparison` needs no changes
- [x] 8.3 Confirm the `uncaughtException` and `unhandledRejection` handlers still print coloured error messages and exit with code 1

## 9. Manual smoke tests

- [x] 9.1 From a directory with `application.yml`, `application-dev.yml`, and `application-prod.yml`, run `node src/index.js` and complete the TUI flow; verify the comparison output matches the old readline-based output for the same files
- [x] 9.2 From a directory with both `application.yml` and `application.yaml`, run the TUI flow and confirm the base-file ambiguity prompt appears and respects the user's choice
- [x] 9.3 From a directory with no `application.yml` and no `application.yaml`, run the TUI flow and confirm the "no base file" warning prints and the summary shows `(sin archivo base)`
- [x] 9.4 From a directory with no `*.yml` or `*.yaml` files, run the TUI flow, enter the file picker, and confirm only `← Volver` is offered; pick it and confirm the working-directory picker reappears
- [x] 9.5 On a TTY, confirm the banner is printed, pickers are styled, and the summary is coloured
- [x] 9.6 With `node src/index.js > out.txt` (non-TTY), confirm the banner and all messages contain no ANSI escape codes
- [x] 9.7 Run `node src/index.js -h` and confirm the help text lists the new flags and not the old ones
- [x] 9.8 Run `node src/index.js --profile-a-path /p/a.yml --profile-b-path /p/b.yml` (missing base flag) and confirm the comparison runs and the summary shows `(sin archivo base)`
- [x] 9.9 Run `node src/index.js --base-path /p/missing.yml --profile-a-path /p/a.yml --profile-b-path /p/b.yml` and confirm the warning prints and the comparison runs without a base
- [x] 9.10 Run `node src/index.js --base-path /p/a.yml` (no profile flags) and confirm the tool prints usage and exits with code 1

## 10. README follow-up

- [x] 10.1 Rewrite the "Uso interactivo" section of `README.md` to describe the TUI flow (banner, working-directory picker, file pickers, base auto-detection, summary, confirmation)
- [x] 10.2 Rewrite the "Uso con flags" section of `README.md` to document `--base-path`, `--profile-a-path`, `--profile-b-path`, `-y`, `-h`
- [x] 10.3 Update the flags table in `README.md` to match the new flag set
- [x] 10.4 Update the "Alcance y limitaciones" section to reflect that both `.yml` and `.yaml` are supported
- [x] 10.5 Bump the Node version requirement in the "Instalación" section to `>= 18`
