# DreamHost Deployer - Project Map

## Project Overview

DreamHost Deployer is a CLI tool for deploying websites to DreamHost servers via SSH. It provides a streamlined deployment process with features for checking server environments, setting up Node.js, and handling SSH authentication.

## Version History

- **Current Version**: 0.5.4
- **Previous Versions**: 0.5.3, 0.5.2, 0.5.1, 0.5.0, 0.4.7, 0.4.6, 0.4.5, 0.4.4, 0.4.3, 0.4.1

## Core Components

### 1. Deployment System
- **Main Deploy Function** (`deploy.js`): Orchestrates the entire deployment process
- **SSH/SCP Implementation** (`deploy.js:deployWithNativeSSH`): Cross-platform file transfer
- **Build Integration** (`deploy.js`): Runs build process before deployment
  - Support for various frameworks including specialized Vite support
  - Build output directory deployment
  - Live build output streaming
  - Framework-specific error handling

### 2. Server Management
- **Server Checks** (`src/utils/server-check.js`): Validates server environment
- **SSH Key Setup** (`setup-ssh.js`): Simplifies SSH key authentication
- **SSH Key Repair** (`fix-ssh-key.js`): Fixes common SSH key issues

### 3. CLI Interface
- **Command Line Interface** (`bin/cli.js`): Provides easy-to-use commands
- **Interactive Menu** (`bin/cli.js`): User-friendly interface for all features
- **Project-specific Settings** (`bin/cli.js`): Framework-specific configurations

## Special Features

### 1. Vite Project Support (v0.5.6+)
- **Auto-detection**: Identifies Vite projects through configuration files and dependencies
- **Optimized Settings**: Uses Vite-specific defaults (dist directory, npm run build)
- **Specialized Exclusions**: Excludes source files and config files appropriately
- **Targeted Error Handling**: Provides Vite-specific solutions for common build issues

### 2. Target Directory Management
- **Clean Option**: Removes existing files before deployment
- **Update Option**: Preserves non-conflicting files during deployment

### 3. Connection Handling 
- **SSH2 Library Integration**: More reliable SSH connections
- **Batch File Transfers**: Improved stability and performance
- **Comprehensive Error Handling**: Better recovery from connection issues

## Configuration System
- **Config File Management** (`deploy.js:loadOrCreateConfig`): Loads or creates JSON configuration
- **Framework Detection**: Auto-detects project type and suggests appropriate settings
- **Interactive Configuration**: Guides users through setup process

## Documentation
- **Release Notes**: Version-specific details about features and changes
- **Changelog**: History of all updates and improvements
- **Project Map**: This document providing system overview

## Technical Decisions

### 1. Cross-Platform Compatibility
- **Native SSH/SCP**: Primary deployment method for Windows/macOS/Linux
- **Fallback Mechanisms**: Alternative methods if primary fails
- **Path Handling**: Consistent path normalization across platforms

### 2. Build Integration Design
- **Framework Agnostic**: Core support for any build system
- **Framework-Specific Optimizations**: Special handling for known frameworks
- **Error Recovery**: Options to continue deployment despite build issues

### 3. Vite-Specific Optimizations (v0.5.6+)
- **Default Directory**: Using "dist" instead of generic "build"
- **Source Exclusions**: Preventing unnecessary source files from being deployed
- **Output Verification**: Ensuring build output matches expected Vite structure

## Usage Flow

1. **Initial Setup**:
   - Run `dreamhost-deployer setup-ssh` to configure SSH connection
   - Optionally run `dreamhost-deployer setup-node` to set up Node.js on server

2. **Deployment**:
   - Run `dreamhost-deployer deploy` to start deployment
   - Tool checks target directory for existing files
   - User chooses to update, clean, or cancel
   - Tool creates directory structure and transfers files
   - Tool provides next steps based on web server type

3. **Troubleshooting**:
   - Run `dreamhost-deployer check-server` to verify server environment
   - Run `dreamhost-deployer fix-ssh-key` to resolve SSH key issues

## Future Development

- Add rollback functionality for failed deployments
- Implement differential deployments (only transfer changed files)
- Add support for custom deployment hooks (pre/post-deployment scripts)
- Enhance logging and reporting features

## Project Structure
- `bin/` - Contains the CLI entry point
  - `cli.js` - Main CLI entry point that handles command-line arguments using Commander.js
    - Includes interactive menu for better user experience
    - Provides color-coded output for better readability
    - Implements follow-up actions based on command results
- `src/` - Source code directory
  - `commands/` - Command implementations
    - `setup-node.js` - NVM and Node.js setup on DreamHost server
      - Supports latest Node.js LTS versions (22.14.0, 20.18.3, 18.20.6)
      - Uses NVM 0.40.1 for Node.js version management
  - `utils/` - Utility functions
    - `server-check.js` - Utility for checking server environment (NVM and Node.js versions)
      - Includes SSH connection verification and authentication diagnostics
      - Supports multiple authentication methods with fallbacks
      - Provides detailed troubleshooting guidance
      - Checks for latest recommended Node.js and NVM versions
- `templates/` - Configuration templates
  - `deploy.config.template.json` - Template for deployment configuration
- `docs/` - Documentation
  - `CHANGELOG.md` - Project changelog
  - `project-map.md` - This file, documenting the project structure
  - `npm-publishing-guide.md` - Guide for publishing the package to npm
  - `windows-deployment-guide.md` - Detailed guide for Windows users

## Dependencies
- `commander` - Command-line argument parsing
- `chalk` - Terminal text styling
- `fs-extra` - Enhanced file system operations
- `inquirer` - Interactive command-line user interfaces
- `ssh2` - SSH client for Node.js
- `minimatch` (v5.1.0) - Pattern matching for file paths 