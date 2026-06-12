## ADDED Requirements

### Requirement: Flag-based non-interactive mode with absolute paths
The system SHALL, when invoked with flags, skip all prompts and run the comparison directly. The system SHALL accept `--base-path <abs>`, `--profile-a-path <abs>`, `--profile-b-path <abs>`, `-y` / `--yes`, and `-h` / `--help`. Each path flag's value SHALL be used as the file path itself; the system SHALL NOT derive filenames by combining a "profile name" with the path.

#### Scenario: All three path flags given
- **WHEN** the user runs `--base-path /p/application.yml --profile-a-path /p/application-dev.yml --profile-b-path /p/application-prod.yml`
- **THEN** the system uses those three exact paths and runs the comparison without prompting

#### Scenario: --base-path omitted
- **WHEN** the user runs `--profile-a-path /p/a.yml --profile-b-path /p/b.yml` without `--base-path`
- **THEN** the system runs the comparison without a base file

#### Scenario: --base-path points to a non-existent file
- **WHEN** the user runs `--base-path /p/missing.yml --profile-a-path /p/a.yml --profile-b-path /p/b.yml`
- **THEN** the system prints a warning that the base file was not found and runs the comparison without a base file

#### Scenario: Required flag missing
- **WHEN** the user runs in flag mode without `--profile-a-path` or without `--profile-b-path`
- **THEN** the system prints usage and exits with code 1

#### Scenario: Relative path is resolved against process.cwd()
- **WHEN** the user runs `--profile-a-path relative/dir/application-dev.yml`
- **THEN** the system resolves the path against `process.cwd()` and uses the resolved absolute path

#### Scenario: -y skips the confirmation
- **WHEN** the user runs the tool with `-y` and the other required flags
- **THEN** no confirmation prompt is shown and the comparison runs immediately

#### Scenario: -h prints usage
- **WHEN** the user runs the tool with `-h` or `--help`
- **THEN** the system prints usage information and exits with code 0
