# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test Commands
- Run all tests: `npm test`
- Run SSH setup: `npm run setup-ssh`
- Fix SSH key permissions: `npm run fix-ssh-key`

## Code Style Guidelines
- **Format**: CommonJS modules with `require()` statements
- **Error Handling**: Use try/catch blocks with descriptive error messages
- **Logging**: Use chalk for colored console output (blue for info, green for success, red for errors)
- **Imports**: Group imports by type - Node built-ins first, then npm packages, then local modules
- **Naming**: camelCase for variables/functions, use descriptive names
- **Documentation**: Each file should have a description comment at the top
- **File Structure**: Keep related functionality in separate modules under src/commands/ or src/utils/
- **Async**: Use async/await pattern for asynchronous code
- **Progress Reporting**: Use cliProgress for file transfer operations
- **User Input**: Use inquirer for interactive prompts
- **Security**: Avoid logging sensitive information like passwords or SSH keys