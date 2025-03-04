# Changelog

All notable changes to the DreamHost Deployer project will be documented in this file.

## [Unreleased]

### Fixed
- Fixed issue with multiple characters appearing when typing in the URL input field
  - Replaced Node.js readline interface with inquirer library for more reliable input handling
  - Implemented proper prompt handling with inquirer's input type
  - Added confirmation prompts using inquirer's confirm type
  - Removed manual input event handling that was causing double keystrokes 