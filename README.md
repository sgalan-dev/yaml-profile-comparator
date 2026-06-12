# yaml-profile-comparator

Command-line utility that compares two Spring Boot YAML files (`application-<profile>.yml` or `application-<profile>.yaml`) to detect keys that are present in one profile and missing in the other.

It is a developer tool, **not a Spring project dependency**. It lives in its own folder and is launched from the terminal.

- [Installation](#installation)
- [Quick start](#quick-start)
- [Workflow](#workflow)
  - [Interactive mode (TUI)](#interactive-mode-tui)
  - [Non-interactive mode (flags)](#non-interactive-mode-flags)
- [How the comparison works](#how-the-comparison-works)
- [Internationalization](#internationalization)
- [Exit codes](#exit-codes)
- [Flags reference](#flags-reference)
- [Process details](#process-details)
  - [Project layout](#project-layout)
  - [Pipeline](#pipeline)
  - [Internationalization pipeline](#internationalization-pipeline)
  - [Color and TTY handling](#color-and-tty-handling)
  - [Error handling](#error-handling)
- [Scope and limitations](#scope-and-limitations)

## Installation

```bash
git clone <repo> yaml-profile-comparator
cd yaml-profile-comparator
npm install
```

Requires Node.js >= 18.

## Quick start

```bash
# Interactive: walk through the prompts
node src/index.js

# Non-interactive: pass the paths explicitly
node src/index.js -y \
  --base-path    ./src/main/resources/application.yml \
  --profile-a-path ./src/main/resources/application-dev.yml \
  --profile-b-path ./src/main/resources/application-prod.yml
```

## Workflow

### Interactive mode (TUI)

When launched without flags, the tool opens a TUI driven by arrow keys and Enter. The first screen is the ASCII banner, followed by a language picker. The rest of the flow looks like this:

0. **ASCII banner** with the title "profile comparator" and the credit `sgalan.dev`.
1. **Language picker**: the first question is "Which language do you want to use?" with options `English` and `Español`. The default is `English`. Every other prompt, summary, diff, success, warning and Ctrl-C message is then rendered in the chosen language. The choice is not persisted between runs.
2. **Working directory selector**: starts at `process.cwd()`. The first two choices are always `./` (confirm) and `../` (go up one level). The rest are the non-hidden subdirectories, sorted alphabetically.
3. **Profile A selector**: flat list of `*.yml` and `*.yaml` files in the chosen directory, with `<- Back` as the first option to return to the directory selector.
4. **Profile B selector**: same shape as A.
5. **Base file auto-detection**: if `application.yml` or `application.yaml` exists in the directory, it is taken silently. If both exist, the user is asked which to use. If neither exists, a warning is printed and the comparison continues without a base.
6. **Final summary** with the three resolved paths (or `(no base file)` if applicable) and a readable name derived from the file name.
7. **Confirmation** "Continue with the comparison?" with default "yes". With `-y` / `--yes` it is skipped.

### Non-interactive mode (flags)

```bash
# With a base file and two profiles
node src/index.js -y \
  --base-path     /path/to/your-app/src/main/resources/application.yml \
  --profile-a-path /path/to/your-app/src/main/resources/application-dev.yml \
  --profile-b-path /path/to/your-app/src/main/resources/application-prod.yml

# Without a base file
node src/index.js -y \
  --profile-a-path /path/to/application-dev.yml \
  --profile-b-path /path/to/application-prod.yml

# Relative paths (resolved against process.cwd())
node src/index.js -y \
  --profile-a-path ./application-dev.yml \
  --profile-b-path ./application-prod.yml
```

If any flag is present, the tool skips the TUI entirely and runs in batch mode. All paths are resolved against `process.cwd()` if relative.

## How the comparison works

1. **Validate** that the three files exist and parse as valid YAML.
2. **Load** each file with `js-yaml` into a plain JavaScript object. A missing file (only allowed for the optional base) becomes `null`/`{}`.
3. **Deep-merge** each profile on top of the base when a base is provided. Merging rules:
   - Plain objects are merged recursively.
   - Arrays are replaced in block (never concatenated), matching Spring Boot's `spring.config` behavior.
4. **Flatten** the merged object to a sorted list of dotted keys, e.g. `server.port`, `spring.datasource.url`.
5. **Diff** the two key sets. Keys present in A but not in B are listed as "missing in B", and vice versa.
6. **Render** the diff with color and an `OK` line when the two sets are equal.

Only key **presence** is compared, not values or types: `port: "8080"` and `port: 8080` count as matching.

## Internationalization

The TUI is available in English and Spanish. The choice is made on every run, at the first prompt. Default is English.

Strings live in two dictionaries under `src/locales/`:

- `es.js` — Spanish translations.
- `en.js` — English translations.

Both expose the same key tree, e.g. `language.question`, `workingDir.message`, `summary.title`, `diff.missingInB(a, b)`, `success.ok(a, b)`. They are consumed through the `t(key, params)` function exported by `src/i18n.js`, which:

- Resolves dotted paths against the current locale.
- Supports interpolation with `{name}` placeholders supplied via the `params` object.
- Supports function values (e.g. `t('diff.missingInB', { a, b })`).
- Falls back to the key string if a translation is missing.
- Refuses any locale other than `es` or `en` in `setLocale(code)`.

Only TUI-facing strings are translated. Help text (`-h`/`--help`) and the messages of the flag mode (validation errors, uncaught exceptions) remain in their original wording. The ASCII banner is language-neutral and is the same in both modes.

## Exit codes

- `0` — the two structures match.
- `1` — there are divergences, the file was not found, the YAML is invalid, or an unexpected error occurred.
- `130` — interrupted by the user (Ctrl-C / SIGINT).
- `143` — terminated by the system (SIGTERM).

## Flags reference

| Flag | Description |
|---|---|
| `--base-path <abs>` | Path to the base `application.yml` or `application.yaml`. Optional. If omitted or the file does not exist, the profiles are compared without a base (and a warning is printed). |
| `--profile-a-path <abs>` | Path to profile A. Required in flag mode. |
| `--profile-b-path <abs>` | Path to profile B. Required in flag mode. |
| `-y`, `--yes` | Skip the final confirmation in the TUI summary. |
| `-h`, `--help` | Show help. |

**BREAKING** since version 0.1: the legacy flags `--base`, `--profile-a`, `--profile-b` no longer exist. The variants with the `-path` suffix take the full file path, not a profile name.

## Process details

This section is for contributors and reviewers who want to know how the tool is wired internally.

### Project layout

```
src/
├── args.js        # CLI flag parsing and help text
├── banner.js      # ASCII art banner (TTY vs pipe variants)
├── colors.js      # Tiny color wrapper that respects isTTY
├── diff.js        # Set-based diff of two key lists
├── flatten.js     # Object/array walker that emits dotted keys
├── index.js       # Entry point: parse flags, dispatch TUI or batch, run comparison
├── interactive.js # TUI: language picker, directory picker, file pickers, summary, confirm
├── loader.js      # File existence checks and YAML loading/validation
├── merge.js       # Deep merge with array replacement
├── render.js      # All formatted output (summary, diff, success, error, warning)
├── theme.js       # @inquirer/prompts theme (TTY vs plain)
├── i18n.js        # Locale registry and t() function
└── locales/
    ├── es.js      # Spanish dictionary
    └── en.js      # English dictionary
```

### Pipeline

```
process.argv
  │
  ▼
parseArgs() ──────────────► flags
  │
  ▼
hasAnyFlag ? resolveFromFlags() : runInteractive()
  │                              │
  │                              └─► pickLanguage() → setLocale() → renderBanner()
  │                                  → pickWorkingDirectory() loop
  │                                  → findBaseCandidates() / pickBaseCandidate()
  │                                  → pickYamlFile() x2
  │                                  → renderSummary() → confirm()?
  │
  └──────► { basePath, profileAPath, profileBPath, profileAName, profileBName }
              │
              ▼
          runComparison()
            1. validateFile() x3      (file exists, YAML parses)
            2. loadYamlOptional() x3  (parse to plain object)
            3. mergeDeep(base, A)     (only if base present)
            4. mergeDeep(base, B)
            5. flatten(A) and flatten(B), then sort
            6. diffKeys(A, B)         (set difference in both directions)
            7. renderDiff()           (returns true on divergences)
            8. renderSuccess()        (only if no divergences)
              │
              ▼
          process.exit(0 | 1)
```

### Internationalization pipeline

```
src/i18n.js
  ├── LOCALES = { es: esDict, en: enDict }
  ├── currentLocale = 'en'  (default; first prompt can switch it)
  ├── setLocale(code)       (validates 'es' | 'en')
  └── t(key, params)        (dotted path → function or string)

call sites:
  src/interactive.js
    - pickLanguage()        uses t('language.question', t('language.optionEs'), t('language.optionEn'))
    - pickWorkingDirectory  uses t('workingDir.message', { dir })
    - pickYamlFile          uses t('yamlFile.back'), t('yamlFile.empty')
    - pickBaseCandidate     uses t('basePicker.message')
    - runInteractive        uses t('baseMissingWarning', { dir }), t('profileA.label'),
                            t('profileB.label'), t('confirm.continue'), t('confirm.cancelled')
  src/render.js
    - renderSummary         uses t('summary.title'), t('summary.noBase')
    - renderDiff            uses t('diff.title'), t('diff.missingInB', { a, b }),
                            t('diff.missingInA', { a, b })
    - renderSuccess         uses t('success.ok', { a, b })
    - renderError           uses t('error.prefix')
    - renderWarning         uses t('warning.prefix')
  src/index.js
    - SIGINT / SIGTERM      uses t('interrupted')
```

The `--help` text in `args.js` is intentionally not translated. The uncaught-exception and unhandled-rejection handlers in `index.js` use fixed Spanish strings because they are reached only outside the TUI (in flag mode or in startup errors before the language picker).

### Color and TTY handling

Two layers cooperate to make the output look right in a terminal and remain clean in a pipe:

- `src/colors.js` exports tiny wrappers around ANSI codes. Each one is a no-op when `process.stdout.isTTY` is false, so logs piped to a file or a CI runner stay free of escape sequences.
- `src/theme.js` defines a `promptTheme` for `@inquirer/prompts` that uses `chalk` colors in a TTY and identity functions in a pipe. The choice is made once at import time.
- `src/banner.js` has two art variants: a block-letter one for TTYs and an ASCII one for pipes. Gradients and the lila-tinged credit are skipped when the output is not a TTY.

### Error handling

Three layers:

1. **Validation errors** (file not found, invalid YAML, missing flag in batch mode) are printed via `renderError` and exit with code `1`. They happen in `loader.js` and in `resolveFromFlags` in `index.js`.
2. **User cancellation**: if the user answers "no" to the final confirm, the TUI exits with code `0` and the message "Cancelled by user." / "Cancelado por el usuario.".
3. **Process signals**:
   - `SIGINT` and `SIGTERM` print the localized "Interrupted by user." / "Interrumpido por el usuario." message and exit with `130` or `143`.
   - `uncaughtException` and `unhandledRejection` print a Spanish-prefixed error and exit with `1`. The rejection handler ignores `AbortError` / `User force closed` / SIGINT-shaped messages, since they are not real failures.

## Scope and limitations

- **Only key presence is compared**, not values or types. `port: "8080"` and `port: 8080` count as matching.
- **Deep merge** profile-over-base with arrays replaced in block (never concatenated). This matches Spring Boot's default behavior.
- **`.yml` and `.yaml` are supported** in any combination (auto-detection, validation, listing in the TUI).
- **Does not support** `spring.profiles.include`, `spring.config.activate.on-profile`, or `spring.config.import`. Only the explicitly named files are read.
- **No runtime validation** against `@ConfigurationProperties`. This is a declarative coverage check between files.
- **The TUI requires a TTY.** In pipes or CI, use flag mode (`--profile-a-path`, `--profile-b-path`, etc.).
- **Not distributed as a binary or as an npm package.** It is a local developer project.
