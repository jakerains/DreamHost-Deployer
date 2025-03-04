# Changelog

All notable changes to the DreamHost Deployer project will be documented in this file.

## [Unreleased]

### Added
- Added Windows compatibility improvements
  - Detect when rsync is not available on Windows systems
  - Added alternative SCP-based deployment method for Windows
  - Added WSL installation guidance for Windows users
  - Added clarification about running from within WSL vs Windows shell
  - Multiple deployment paths depending on environment (Windows/WSL/Linux/Mac)
  - Automatic platform detection to choose appropriate deployment method
  - Detailed user prompts for handling Windows-specific deployment options
- Added support for setting up NVM and Node.js on DreamHost server
  - New `setup-node` command to install NVM and Node.js
  - Support for custom Node.js versions
  - Based on DreamHost documentation: https://help.dreamhost.com/hc/en-us/articles/360029083351
  - Updated to use NVM v0.40.1 and Node.js v20.18.0 as recommended by DreamHost
  - Added special handling for Dedicated servers (setfattr command)
  - Added .bash_profile configuration as per DreamHost docs
- Added web server type selection (Apache or Nginx)
  - Configuration option to specify web server type
  - Interactive prompt to choose between Apache and Nginx
  - Server-specific configuration files for both Apache and Nginx
  - Detailed next steps instructions for each server type
- Added comprehensive npm publishing guide
  - Step-by-step instructions for publishing to npm
  - Version management and update procedures
  - Handling beta and release candidates
  - Common issues and solutions

### Improved
- Enhanced user interface with better formatting and clearer instructions
  - Added emoji icons for better visual cues
  - Improved command output formatting with chalk
  - Added progress indicators for multi-step processes
  - Added configuration summaries for better visibility
  - Improved error messages and handling
  - Added detailed next steps after each operation

### Fixed
- Fixed issue with multiple characters appearing when typing in the URL input field
  - Replaced Node.js readline interface with inquirer library for more reliable input handling
  - Implemented proper prompt handling with inquirer's input type
  - Added confirmation prompts using inquirer's confirm type
  - Removed manual input event handling that was causing double keystrokes 