## ADDED Requirements

### Requirement: ASCII-art startup banner
The system SHALL print, at the very start of every interactive run, a multi-line ASCII-art banner whose top half is the literal text "yaml profile comparator" and whose bottom half is the credit "sgalan.dev". The banner SHALL contain no emoji characters. The banner SHALL be printed even when stdout is not a TTY, in plain ASCII without ANSI colour codes.

#### Scenario: Interactive run starts with banner
- **WHEN** the user launches the tool with no flags and stdout is a TTY
- **THEN** the first thing printed is the banner, and only after the banner is the first interactive prompt shown

#### Scenario: Banner is plain ASCII when piped
- **WHEN** the user launches the tool with no flags and stdout is redirected to a file
- **THEN** the banner is still printed but contains no ANSI escape codes

#### Scenario: No emojis in banner
- **WHEN** the banner is printed in any environment
- **THEN** no emoji character appears anywhere in the banner

### Requirement: Working-directory picker
The system SHALL, in interactive mode, let the user pick the working directory with an arrow-key selector before any file is chosen. The selector SHALL start in `process.cwd()`. The selector MUST always include `./` and `../` as the first two entries, in that order. `./` means "stay in this directory and confirm". `../` means "go up one level" and re-render the list at the parent directory. The selector MUST list all non-hidden subdirectories of the current directory, sorted alphabetically. Selecting a subdirectory navigates into it and re-renders the list.

#### Scenario: Default working directory is process.cwd()
- **WHEN** the user runs the tool from `/home/user/proj/src/main/resources` with no flags
- **THEN** the working-directory picker opens in `/home/user/proj/src/main/resources` and shows `./`, `../`, and any subdirectories of that path

#### Scenario: Selecting a subdirectory descends
- **WHEN** the picker shows `./`, `../`, `./config/`, `./static/`, `./templates/` and the user picks `./config/`
- **THEN** the picker re-renders with `./`, `../`, and the subdirectories of `config/`

#### Scenario: Selecting .. ascends
- **WHEN** the picker is in a non-root directory and the user picks `../`
- **THEN** the picker re-renders with `./`, `../`, and the subdirectories of the parent

#### Scenario: At the filesystem root, .. stays at root
- **WHEN** the picker is at the filesystem root and the user picks `../`
- **THEN** the picker stays at the filesystem root and re-renders the same list

#### Scenario: Hidden directories are excluded
- **WHEN** the current directory contains `.git`, `node_modules`, and `config` as subdirectories
- **THEN** the picker shows only `./`, `../`, and `config/`, and not `.git/` or `node_modules/`

#### Scenario: Confirming the working directory
- **WHEN** the user picks `./` from the working-directory picker
- **THEN** the working directory is finalised and the tool moves on to the profile A file picker

### Requirement: Flat YAML file picker
The system SHALL, in interactive mode, present a flat list of files matching the patterns `*.yml` and `*.yaml` inside the chosen working directory, sorted case-insensitively. The picker MUST NOT offer navigation into subdirectories. The picker MUST always include a `← Volver` entry as the first item. Selecting `← Volver` MUST return the user to the working-directory picker. The picker MUST filter out files whose name starts with a dot. If the directory contains no `*.yml` or `*.yaml` files, the picker MUST show only `← Volver` and MUST include a message stating that the directory contains no YAML files.

#### Scenario: Picking a profile file
- **WHEN** the working directory contains `application-dev.yml`, `application-local.yml`, and `application-prod.yml`
- **THEN** the profile A picker shows `← Volver`, `application-dev.yml`, `application-local.yml`, `application-prod.yml`

#### Scenario: Volver returns to working-directory picker
- **WHEN** the user is on the profile A picker and picks `← Volver`
- **THEN** the working-directory picker is shown again, and the previously chosen working directory is the one currently displayed

#### Scenario: Empty directory has no candidates
- **WHEN** the chosen working directory contains zero `*.yml` or `*.yaml` files
- **THEN** the profile A picker shows only `← Volver` plus a message indicating the directory has no YAML files, and selecting `← Volver` is the only meaningful action

#### Scenario: Both .yml and .yaml extensions are listed
- **WHEN** the working directory contains `application-dev.yml` and `application-prod.yaml`
- **THEN** both files appear in the picker, each with its own extension preserved in the label

#### Scenario: Hidden files are excluded
- **WHEN** the working directory contains `.draft.yml` and `application-dev.yml`
- **THEN** the picker shows only `← Volver` and `application-dev.yml`

### Requirement: Base-file auto-detection
The system SHALL, after the working directory is chosen, look for `application.yml` and `application.yaml` directly in that directory (no recursion). If neither exists, the system MUST print a warning that no base file was found and MUST proceed without a base file. If exactly one exists, the system MUST use it silently. If both exist, the system MUST present an arrow-key selector listing both candidates and MUST use whichever the user picks.

#### Scenario: No base file in working directory
- **WHEN** the working directory contains only `application-dev.yml` and `application-prod.yml`
- **THEN** the system prints a warning that no `application.yml` or `application.yaml` was found, and continues without a base file

#### Scenario: Single base file is taken silently
- **WHEN** the working directory contains `application.yml` and `application-dev.yml`
- **THEN** the base file is `application.yml` and the user is not prompted about it

#### Scenario: Ambiguity is resolved with a picker
- **WHEN** the working directory contains both `application.yml` and `application.yaml`
- **THEN** the system shows an arrow-key selector with both candidates and uses the one the user picks

#### Scenario: Detection is non-recursive
- **WHEN** the working directory contains `application.yml` and a subdirectory `config/` containing `application.yaml`
- **THEN** the base file is `application.yml` from the working directory; the `application.yaml` inside `config/` is ignored

### Requirement: Final summary and confirmation
The system SHALL, after all three files are resolved, print a final summary listing the base file path (or `(sin archivo base)` if absent) and the two profile file paths, with the display name being the file basename without extension. The system SHALL then ask for confirmation before running the comparison. The default answer MUST be "yes". The `-y` / `--yes` flag MUST skip this prompt.

#### Scenario: Summary lists three paths
- **WHEN** all three files are resolved
- **THEN** the summary shows the base path, profile A path, and profile B path, each prefixed by their display name

#### Scenario: No base is shown as such
- **WHEN** no base file was detected
- **THEN** the summary shows `base -> (sin archivo base)` for that line

#### Scenario: User confirms and the comparison runs
- **WHEN** the user presses Enter on the confirmation prompt
- **THEN** the comparison runs and the result is printed

#### Scenario: User cancels
- **WHEN** the user types `n` on the confirmation prompt
- **THEN** the system prints a "Cancelado por el usuario" info line and exits with code 0

#### Scenario: --yes skips the prompt
- **WHEN** the user runs the tool with `-y` and no other flags
- **THEN** the confirmation prompt is not shown and the comparison runs immediately after the summary

## MODIFIED Requirements

### Requirement: Interactive mode prompts
The system SHALL, when invoked without flags, run a TUI flow that (1) prints the ASCII-art banner, (2) shows the working-directory picker, (3) shows the flat file picker for profile A, (4) shows the flat file picker for profile B, (5) auto-detects or resolves the base file in the working directory, (6) shows a final summary and asks for confirmation, and (7) runs the comparison. The system SHALL NOT use free-text input for any of the steps above.

#### Scenario: User completes the interactive flow
- **WHEN** the user starts the tool with no flags and answers all pickers and the confirmation
- **THEN** the comparison runs against the three files they selected

#### Scenario: No free-text prompts in interactive mode
- **WHEN** the user runs the tool with no flags
- **THEN** at no point is the user asked to type a path or a profile name with the keyboard

### Requirement: Flag-based non-interactive mode
The system SHALL, when invoked with flags, skip all prompts and run the comparison directly. The system SHALL accept exactly these flags: `--base-path <abs>` (optional; missing or non-existent file means "no base"), `--profile-a-path <abs>` (required), `--profile-b-path <abs>` (required), `-y` / `--yes` (skip the final confirmation; the confirmation is also skipped in flag mode unless the user opts into a future interactive-flag combo, which is out of scope), and `-h` / `--help` (print usage). Each path flag's value MUST be used as the file path itself; the system MUST NOT build filenames by combining a "profile name" with the path.

#### Scenario: All three path flags given
- **WHEN** the user runs `--base-path /p/application.yml --profile-a-path /p/application-dev.yml --profile-b-path /p/application-prod.yml`
- **THEN** the system uses those three exact paths and runs the comparison without prompting

#### Scenario: --base-path omitted
- **WHEN** the user runs `--profile-a-path /p/a.yml --profile-b-path /p/b.yml` without `--base-path`
- **THEN** the system runs the comparison without a base file and the summary shows `base -> (sin archivo base)`

#### Scenario: --base-path points to a non-existent file
- **WHEN** the user runs `--base-path /p/missing.yml --profile-a-path /p/a.yml --profile-b-path /p/b.yml`
- **THEN** the system prints a warning that the base file was not found, runs the comparison without a base file, and the summary shows `base -> (sin archivo base)`

#### Scenario: Required flag missing
- **WHEN** the user runs in flag mode without `--profile-a-path` or without `--profile-b-path`
- **THEN** the system prints usage and exits with code 1

#### Scenario: Flag values are absolute paths
- **WHEN** the user runs with `--profile-a-path relative/dir/application-dev.yml`
- **THEN** the system resolves that path against `process.cwd()` and uses the resolved absolute path

### Requirement: Strict file existence and parseability
The system SHALL abort with a non-zero exit code and a clear coloured error message when any of the three files (base, profile A, profile B) does not exist, is not a regular file, or fails YAML parsing. The check applies to `*.yml` and `*.yaml` files. The system SHALL NOT silently treat a missing file as an empty object once the user has confirmed its path.

#### Scenario: Profile file confirmed but missing
- **WHEN** the user confirms a path for profile A in interactive mode (or passes it via flag) and that file does not exist at execution time
- **THEN** the system prints a red error message identifying the missing file and exits with code 1

#### Scenario: YAML syntax error
- **WHEN** any of the three files contains invalid YAML
- **THEN** the system prints a red error message with the file name and parser details and exits with code 1

#### Scenario: Base file flagged but missing at execution
- **WHEN** the user passes `--base-path /p/missing.yml` in flag mode
- **THEN** the system prints a warning that the base file was not found and continues without a base file (does not abort)

#### Scenario: .yaml extension is valid
- **WHEN** the user picks `application-prod.yaml` as profile B
- **THEN** the file is validated, parsed, and included in the comparison the same way `application-prod.yml` would be
