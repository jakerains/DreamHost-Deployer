# DreamHost Deployer Project Map

## Project Overview
DreamHost Deployer is a CLI tool for deploying websites to DreamHost servers via SSH. It provides a simple interface for configuring and deploying websites to DreamHost hosting.

## Project Structure
- `bin/` - Contains the CLI entry point
  - `cli.js` - Main CLI entry point that handles command-line arguments using Commander.js
- `src/` - Source code directory
  - `commands/` - Command implementations
    - `setup-node.js` - NVM and Node.js setup on DreamHost server
  - `utils/` - Utility functions
- `templates/` - Configuration templates
  - `deploy.config.template.json` - Template for deployment configuration
- `docs/` - Documentation
  - `CHANGELOG.md` - Project changelog
  - `project-map.md` - This file, documenting the project structure
  - `npm-publishing-guide.md` - Guide for publishing the package to npm
  - `windows-deployment-guide.md` - Detailed guide for Windows users

## Core Files
- `deploy.js` - Main deployment logic
- `setup-ssh.js` - SSH setup and configuration logic
- `test.js` - Basic test script to verify package configuration
- `package.json` - Project metadata and dependencies
- `deploy.config.json` - User configuration file for deployment settings

## Technical Decisions

### Input Handling
- Using the `inquirer` library for handling user input
- Interactive prompts with proper input validation
- Support for different prompt types (input, confirm)
- Reliable input handling without keystroke duplication issues

### Deployment Method
- Using `rsync` over SSH for efficient file transfers on Unix/Linux/macOS
- Alternative SCP-based deployment for Windows systems without rsync
- Cross-platform compatibility with Windows, macOS, and Linux
- Windows-specific detection and handling
- WSL integration approaches:
  - Option to run directly from WSL terminal (recommended for best performance)
  - Fallback to SCP when running from Windows CMD/PowerShell even with WSL installed
  - Clear guidance on running the tool in the appropriate environment
- Supporting exclude patterns to skip unnecessary files
- Automatic SSH key generation and configuration

### Configuration Management
- JSON-based configuration for easy editing and parsing
- Template-based initialization for consistent configuration
- Support for custom configuration paths
- Web server type selection (Apache or Nginx)

### Server Environment Setup
- NVM and Node.js installation on DreamHost server
- Support for custom Node.js versions
- Automatic configuration of environment variables
- Server-specific configuration for Apache and Nginx

### User Interface
- User-friendly CLI with clear instructions
- Visual cues using emoji icons
- Colored output for better readability
- Progress indicators for multi-step processes
- Detailed next steps after each operation

## Dependencies
- `commander` - Command-line argument parsing
- `chalk` - Terminal text styling
- `fs-extra` - Enhanced file system operations
- `inquirer` - Interactive command-line user interfaces
- `ssh2` - SSH client for Node.js
- `minimatch` - Pattern matching for file paths 