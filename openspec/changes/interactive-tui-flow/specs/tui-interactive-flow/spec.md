## ADDED Requirements

### Requirement: TUI interactive flow
The system SHALL provide a TUI interactive flow that lets the user pick a working directory and two YAML files with arrow keys and Enter, auto-detects an optional base file in the working directory, shows a final summary, and runs the comparison after confirmation. The TUI flow SHALL be the default when no flag is provided. The TUI flow SHALL print an ASCII-art banner with the text "yaml profile comparator" and the credit "sgalan.dev" before the first picker.

#### Scenario: User reaches the file pickers after picking a directory
- **WHEN** the user confirms a working directory with the arrow-key picker
- **THEN** the system shows the flat file picker for profile A inside that working directory

#### Scenario: User cancels a file picker and goes back
- **WHEN** the user picks `← Volver` on a file picker
- **THEN** the system returns to the working-directory picker without losing prior work

#### Scenario: Summary appears before running the comparison
- **WHEN** the user confirms the file pickers
- **THEN** the system shows a summary of the three resolved files and asks for confirmation before running the comparison

### Requirement: Working-directory picker with level changes
The system SHALL, in the TUI flow, let the user choose a working directory from an arrow-key list that always offers `./` and `../` as the first two entries, followed by all non-hidden subdirectories sorted alphabetically. The picker SHALL start at `process.cwd()`. Selecting a subdirectory SHALL descend and re-render the list. Selecting `../` SHALL ascend and re-render. Selecting `./` SHALL confirm the current directory and move on.

#### Scenario: Default working directory equals the launch directory
- **WHEN** the user runs the tool from `/home/user/proj/src/main/resources`
- **THEN** the working-directory picker opens at that path

#### Scenario: Hidden subdirectories are filtered out
- **WHEN** the current directory contains `.git`, `node_modules`, and `config` as subdirectories
- **THEN** only `config/` appears in the picker alongside `./` and `../`

#### Scenario: Confirming the working directory
- **WHEN** the user picks `./`
- **THEN** the working directory is finalised and the file pickers begin

### Requirement: File picker with no level changes
The system SHALL, after the working directory is chosen, show a flat list of `*.yml` and `*.yaml` files in that directory, sorted case-insensitively. The picker SHALL always include `← Volver` as the first entry. The picker SHALL NOT offer navigation into subdirectories. The picker SHALL filter out files whose name starts with a dot.

#### Scenario: Profile A picker shows only YAML files
- **WHEN** the working directory contains `application-dev.yml`, `application-prod.yml`, `README.md`, and `Dockerfile`
- **THEN** the picker shows `← Volver`, `application-dev.yml`, and `application-prod.yml`

#### Scenario: Profile B picker has the same shape as profile A
- **WHEN** the user has selected profile A and the system moves to the profile B picker
- **THEN** the profile B picker shows the same `*.yml` and `*.yaml` files in the same working directory, plus `← Volver`

#### Scenario: Empty working directory
- **WHEN** the working directory contains no `*.yml` or `*.yaml` files
- **THEN** the file picker shows only `← Volver` and a message stating the directory has no YAML files

#### Scenario: Both .yml and .yaml extensions are listed
- **WHEN** the working directory contains `application-dev.yml` and `application-prod.yaml`
- **THEN** both files appear in the picker with their extensions preserved in the labels

### Requirement: Base-file auto-detection
The system SHALL, after the working directory is chosen, look for `application.yml` and `application.yaml` directly in that directory. If neither is present, the system SHALL print a warning and continue without a base file. If exactly one is present, the system SHALL use it silently. If both are present, the system SHALL present an arrow-key selector with both candidates and use the one the user picks.

#### Scenario: Single base file
- **WHEN** the working directory contains only `application.yml`
- **THEN** the base file is `application.yml` and the user is not prompted

#### Scenario: No base file
- **WHEN** the working directory contains no `application.yml` or `application.yaml`
- **THEN** the system prints a warning and continues without a base file

#### Scenario: Ambiguous base
- **WHEN** the working directory contains both `application.yml` and `application.yaml`
- **THEN** the system shows an arrow-key selector listing both files and uses the user's choice

#### Scenario: Non-recursive search
- **WHEN** the working directory contains `application.yml` and a subdirectory `config/` containing `application.yaml`
- **THEN** only the `application.yml` in the working directory is considered; the one in `config/` is ignored

### Requirement: Final summary and confirmation
The system SHALL, after the three files are resolved, print a final summary listing the base file path (or `(sin archivo base)`), the profile A path, and the profile B path, each prefixed by the display name (basename without extension, with the basename `application` rendered as `base`). The system SHALL ask for confirmation with the default answer being "yes" before running the comparison. The `-y` / `--yes` flag SHALL skip the confirmation.

#### Scenario: Summary lists three paths
- **WHEN** the three files are resolved
- **THEN** the summary shows the base path, profile A path, and profile B path with their display names

#### Scenario: No base case
- **WHEN** no base file is detected
- **THEN** the summary shows `base -> (sin archivo base)` for that line

#### Scenario: User confirms
- **WHEN** the user presses Enter on the confirmation prompt
- **THEN** the comparison runs and the result is printed

#### Scenario: User cancels
- **WHEN** the user types `n` on the confirmation prompt
- **THEN** the system prints a "Cancelado por el usuario" message and exits with code 0

#### Scenario: -y skips the prompt
- **WHEN** the user runs the tool with `-y` and no other flags
- **THEN** the confirmation prompt is skipped and the comparison runs immediately after the summary

### Requirement: ASCII-art startup banner
The system SHALL print, at the very start of every TUI interactive run, a multi-line ASCII-art banner. The banner SHALL include the text "yaml profile comparator" and the credit "sgalan.dev". The banner SHALL NOT use any emoji characters. The banner SHALL be printed in plain ASCII (no ANSI codes) so it renders correctly in any environment.

#### Scenario: Banner is the first output
- **WHEN** the user launches the tool with no flags
- **THEN** the banner is the first text printed, before any picker or message

#### Scenario: No emojis anywhere in the banner
- **WHEN** the banner is printed in any environment
- **THEN** no emoji character is present in the banner
