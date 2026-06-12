## 1. Project scaffolding

- [x] 1.1 Create the project structure: `yaml-profile-comparator/` with `src/` and `package.json` at the root
- [x] 1.2 Add `js-yaml` as a dependency in `package.json` and document Node >= 16 in `engines`
- [x] 1.3 Create the `src/` directory and the empty modules: `index.js`, `interactive.js`, `merge.js`, `flatten.js`, `diff.js`, `render.js`, `colors.js`
- [x] 1.4 Add a `README.md` with usage examples (interactive and flags), installation, and explicit scope/limitations

## 2. Core utilities

- [x] 2.1 Implement `colors.js` with TTY detection and `red`, `green`, `yellow`, `blue`, `bold`, `dim` helpers
- [x] 2.2 Implement `merge.js` with `mergeDeep(base, override)` using the rules from design (recursion on plain objects, array replacement, null as terminal)
- [x] 2.3 Implement `flatten.js` with `flatten(obj, prefix)` returning an array of dot-notation leaf keys (numeric indices for arrays, null counted as leaf)
- [x] 2.4 Implement `diff.js` with `diffKeys(keysA, keysB)` returning `{ missingInB, missingInA }` arrays
- [x] 2.5 Implement `render.js` with `renderSummary`, `renderDiff`, `renderSuccess`, `renderError` using the color palette from design

## 3. File loading and validation

- [x] 3.1 Implement file loading that reads a `.yml` file, parses it with `js-yaml.load`, and returns `{}` only when the file does not exist
- [x] 3.2 Add a strict validator that, given a list of resolved file paths (post-confirmation), checks existence, regular file type, and parseability, aborting with a colored error and exit code 1 on any failure
- [x] 3.3 Wire the strict validator to fire after user confirmation in interactive mode and immediately in flag mode

## 4. Flag parsing

- [x] 4.1 Implement minimal argv parsing for `--base`, `--profile-a`, `--profile-b`, `--profile-a-path`, `--profile-b-path`, `--yes`/`-y`, `--help`/`-h` (no third-party library)
- [x] 4.2 Implement `--help` output listing all flags and a short description
- [x] 4.3 Implement flag-mode entry: detect presence of any flag and skip the readline flow entirely
- [x] 4.4 Implement path resolution in flag mode: with base → derive profile dirs from base dir if explicit ones not given; without base → require explicit profile dirs; abort with usage on missing required flags

## 5. Interactive flow

- [x] 5.1 Implement `interactive.js` using `readline` with sequential questions: base path, same-folder y/n, profile A name (and path if needed), profile B name (and path if needed)
- [x] 5.2 Implement "Enter to skip base" handling, with warning shown when the path is empty or the file does not exist
- [x] 5.3 Implement the final summary rendering (three colored lines for the resolved paths) and the final y/n confirmation
- [x] 5.4 Implement `--yes` bypass for the final confirmation in interactive mode (still prompts for the input fields themselves)

## 6. Entry point orchestration

- [x] 6.1 In `index.js`, decide interactive vs flag mode based on argv
- [x] 6.2 In flag mode: parse args → resolve paths → run validator → load + merge + flatten + diff → render result → exit with 0 or 1
- [x] 6.3 In interactive mode: ask → confirm → run validator → load + merge + flatten + diff → render result → exit with 0 or 1
- [x] 6.4 Wrap any uncaught error in a colored message and exit code 1, never a stack trace leak to the user

## 7. Manual test cases

- [x] 7.1 Case: identical structures → success message + exit 0
- [x] 7.2 Case: profile B missing a key from A → red list + exit 1
- [x] 7.3 Case: profile A missing a key from B → yellow list + exit 1
- [x] 7.4 Case: nested object merge works (base + profile partial override)
- [x] 7.5 Case: array is replaced, not merged
- [x] 7.6 Case: no base file, both profiles given with full paths
- [x] 7.7 Case: profile file confirmed but missing at execution → red error + exit 1
- [x] 7.8 Case: malformed YAML → red error with file name + exit 1
- [x] 7.9 Case: flag mode with all flags → no prompts, direct execution
- [x] 7.10 Case: stdout redirected to file → no ANSI codes in output
- [x] 7.11 Case: any visible message contains no emoji characters
