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
    - `server-check.js` - Utility for checking server environment (NVM and Node.js versions)
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
- `fix-ssh-key.js` - Tool to fix SSH key issues and migrate to Ed25519
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
- Simplified cross-platform deployment using native SSH/SCP commands
  - Standardized on SCP/SFTP for all platforms (Windows, macOS, Linux)
  - Eliminated dependency on rsync for better cross-platform compatibility
  - Leveraged built-in SSH client available on modern platforms (Windows 10+, macOS, Linux)
  - Improved file transfer reliability with native commands
  - Robust file exclusion pattern handling with minimatch v5.1.0
  - Fallback mechanisms for pattern matching to ensure reliability
  - Detailed error reporting for SSH and SCP operations
  - Graceful failure handling with informative error messages
- Cross-platform compatibility with Windows, macOS, and Linux
  - Unified deployment approach across all platforms
  - No special handling required for different operating systems
  - Clear guidance on running the tool in the appropriate environment

### Authentication Methods
- Simplified authentication with focus on password-based authentication
  - Password authentication as the recommended method for all platforms
  - Interactive password prompts with masked input
  - Option to save password in configuration (not recommended for security)
  - SSH key authentication still available for advanced users
  - SSH key generation and configuration (Ed25519 preferred)
  - Detailed guidance for manual SSH key installation on server
  - Connection testing during setup
  - Secure handling of credentials

### Configuration Management
- JSON-based configuration for easy editing and parsing
- Template-based initialization for consistent configuration
- Support for custom configuration paths
- Web server type selection (Apache or Nginx)

### Server Environment Setup
- Automatic server environment check before deployment
  - Verification of NVM and Node.js versions
  - Comparison against recommended versions (NVM 0.40.1, Node.js 20.18.0)
  - Interactive prompt to set up or update if needed
- NVM and Node.js installation on DreamHost server
  - Support for custom Node.js versions
  - Automatic configuration of environment variables
  - Server-specific configuration for Apache and Nginx
  - Support for both SSH key and password authentication

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
- `minimatch` (v5.1.0) - Pattern matching for file paths 