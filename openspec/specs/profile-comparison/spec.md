## ADDED Requirements

### Requirement: Deep merge of base and profile files
The system SHALL produce a merged configuration object by applying a recursive deep merge where the profile file overrides the base file, and the merge MUST recurse into nested objects while treating arrays as opaque values that the profile replaces wholesale.

#### Scenario: Profile overrides scalar value
- **WHEN** the base file has `server.port: 8080` and the profile has `server.port: 9090`
- **THEN** the merged object has `server.port: 9090`

#### Scenario: Profile merges into nested object
- **WHEN** the base file has `spring.datasource: { url: jdbc:default, password: secret }` and the profile has `spring.datasource: { url: jdbc:dev }`
- **THEN** the merged object has `spring.datasource: { url: jdbc:dev, password: secret }`

#### Scenario: Profile replaces array wholesale
- **WHEN** the base file has `app.endpoints: [a, b, c]` and the profile has `app.endpoints: [x]`
- **THEN** the merged object has `app.endpoints: [x]`

#### Scenario: Profile introduces a new key not in base
- **WHEN** the base file has no `logging.level` key and the profile has `logging.level: { root: INFO }`
- **THEN** the merged object has `logging.level: { root: INFO }`

### Requirement: Flattening to dot-notation keys
The system SHALL flatten the merged configuration to a list of fully-qualified leaf keys using dot notation, traversing nested objects, indexing arrays numerically, and treating null as a terminal value.

#### Scenario: Nested object flattens with dots
- **WHEN** the merged object has `spring.datasource.url: jdbc:dev`
- **THEN** the flattened keys include `spring.datasource.url`

#### Scenario: Array flattens with numeric indices
- **WHEN** the merged object has `app.endpoints: [/a, /b]`
- **THEN** the flattened keys include `app.endpoints.0` and `app.endpoints.1`

#### Scenario: Null is a leaf
- **WHEN** the merged object has `spring.datasource.password: null`
- **THEN** the flattened keys include `spring.datasource.password`

### Requirement: Cross-profile key set comparison
The system SHALL compute, from the two flattened key sets, the keys present in profile A but missing in profile B, and the keys present in profile B but missing in profile A, and SHALL exit with code 0 only when both sets are empty.

#### Scenario: Identical structures
- **WHEN** the two flattened key sets are equal
- **THEN** the system prints a success message and exits with code 0

#### Scenario: Property missing in profile B
- **WHEN** profile A has key `logging.level.com.foo` and profile B does not
- **THEN** the system lists `logging.level.com.foo` under "missing in B" and exits with code 1

#### Scenario: Property missing in profile A
- **WHEN** profile B has key `spring.datasource.password` and profile A does not
- **THEN** the system lists `spring.datasource.password` under "missing in A" and exits with code 1

#### Scenario: Both sides have unique properties
- **WHEN** both diffs are non-empty
- **THEN** the system lists both groups and exits with code 1

### Requirement: Interactive mode prompts
The system SHALL, when invoked without flags, prompt the user sequentially for the base file path, optionally for "same folder" confirmation, for profile A and profile B names or paths, and SHALL show a final summary of resolved paths asking for confirmation before executing the comparison.

#### Scenario: Base file present, same folder
- **WHEN** the user provides a path to an existing `application.yml` and answers "yes" to "same folder"
- **THEN** the system prompts only for profile A and profile B names and resolves both profile paths as `<baseDir>/application-<name>.yml`

#### Scenario: Base file present, different folders
- **WHEN** the user provides a path to an existing `application.yml` and answers "no" to "same folder"
- **THEN** the system prompts for a folder and a name for profile A, and the same for profile B

#### Scenario: Base file absent
- **WHEN** the user provides a path to `application.yml` that does not exist (or hits Enter to skip)
- **THEN** the system shows a warning and prompts for the full file paths of profile A and profile B

#### Scenario: Final summary and confirmation
- **WHEN** all paths are resolved
- **THEN** the system prints a summary listing the three final paths in colored output and asks for confirmation before proceeding

### Requirement: Flag-based non-interactive mode
The system SHALL, when invoked with flags, skip all prompts and run the comparison directly, supporting `--base`, `--profile-a`, `--profile-b`, `--profile-a-path`, `--profile-b-path`, and `--yes` to skip the final confirmation.

#### Scenario: Full flags with base
- **WHEN** the user invokes with `--base /p/application.yml --profile-a dev --profile-b prod`
- **THEN** the system resolves profile A and B under `/p/` and runs the comparison without prompting

#### Scenario: Flags without base
- **WHEN** the user invokes with `--profile-a dev --profile-b prod --profile-a-path /p/dev/ --profile-b-path /p/prod/`
- **THEN** the system uses the explicit profile paths and skips the base file entirely

#### Scenario: Missing required flags
- **WHEN** the user invokes in flag mode without at least `--profile-a` and `--profile-b`
- **THEN** the system prints usage and exits with code 1

### Requirement: Strict file existence and parseability
The system SHALL abort with a non-zero exit code and a clear colored error message when any of the explicitly named files (base, profile A, profile B) does not exist, is not a regular file, or fails YAML parsing. The system SHALL NOT silently treat a missing file as an empty object once the user has confirmed its path.

#### Scenario: Profile file confirmed but missing
- **WHEN** the user confirms a path for profile A and that file does not exist at execution time
- **THEN** the system prints a red error message identifying the missing file and exits with code 1

#### Scenario: YAML syntax error
- **WHEN** any of the three files contains invalid YAML
- **THEN** the system prints a red error message with the file name and parser details and exits with code 1

### Requirement: Colored console output without emojis
The system SHALL print its output to the console using ANSI color codes for headings, paths, success, and error sections, and SHALL NOT use emoji characters in any output. The system SHALL disable colors automatically when stdout is not a TTY.

#### Scenario: TTY output is colored
- **WHEN** stdout is a TTY (e.g., VSCode integrated terminal, Windows Terminal, iTerm)
- **THEN** headings, the path summary, the missing-key lists, and the success message use color codes

#### Scenario: Non-TTY output is plain
- **WHEN** stdout is redirected or piped (e.g., `node script.js > out.txt`)
- **THEN** the output contains no ANSI escape codes

#### Scenario: No emojis in output
- **WHEN** the system prints any message, including success, error, prompts, and diff results
- **THEN** no emoji character (e.g., checkmarks, crosses, warning signs) appears in the output

### Requirement: Cross-platform portability
The system SHALL run unchanged on Windows, Linux, and macOS, given a compatible Node.js runtime (>= 16). The system SHALL NOT use shell-specific commands, absolute Unix paths, or POSIX-only file APIs.

#### Scenario: Runs on Windows
- **WHEN** the user runs the tool on Windows with Node.js >= 16 installed
- **THEN** the tool reads, merges, and compares the YAML files successfully

#### Scenario: Runs on Linux
- **WHEN** the user runs the tool on Linux with Node.js >= 16 installed
- **THEN** the tool reads, merges, and compares the YAML files successfully

#### Scenario: Runs on macOS
- **WHEN** the user runs the tool on macOS with Node.js >= 16 installed
- **THEN** the tool reads, merges, and compares the YAML files successfully
