# Changelog

All notable changes to the DreamHost Deployer project will be documented in this file.

## [0.7.1] - 2025-04-02

### Fixed
- Fixed syntax error in setup-ssh.js causing "Missing catch or finally after try" error
  - Properly structured try-catch block to handle configuration loading and SSH setup
  - Fixed indentation issues that were causing syntax errors
  - Removed references to deprecated generateSSHKey function from exports
  - Enhanced code structure for better maintainability

## [0.7.0] - 2025-04-02

### Changed
- Removed SSH key functionality to simplify authentication
  - Switched to password-based authentication only for better cross-platform compatibility
  - Streamlined the configuration process for easier setup
  - Improved password handling during deployment
  - Added option to mask password input during configuration

## [0.6.6] - 2025-04-02

### Fixed
- Fixed init command hanging issues
  - Added explicit timeouts for SSH connection verification (15s for individual attempts, 30s overall)
  - Added 45-second timeout for server environment checks
  - Implemented proper error handling for connection timeouts
  - Added clearer error messages when connections time out
  - Ensured proper resource cleanup when timeouts occur
  - Improved the initialization process to continue even if SSH checks fail
  
### Improved
- Enhanced init command to clearly differentiate it from the main menu
  - Added detailed welcome message explaining what the init command does
  - Improved documentation to clarify init command's purpose
  - Updated CLI help text to better describe the initialization process
  - Enhanced project initialization workflow for a smoother setup experience

## [0.6.4] - 2025-04-01

### Improved
- Enhanced cross-platform compatibility for Windows, macOS, and Linux
  - Improved path handling with proper normalization for all operating systems
  - Better SSH key path resolution with platform-specific path separators
  - Enhanced rsync detection on Windows systems (checks multiple installation locations)
  - Fixed log file handling with proper encoding for cross-platform line endings
  - Added platform-specific checks using `process.platform` for better Windows support
- Updated package.json to explicitly declare OS compatibility
- Enhanced deployment process for better cross-platform operation
  - Normalized paths before SSH key operations
  - Fixed path separators in remote path handling
  - Improved file path matching for consistent pattern matching across platforms
- Updated documentation to emphasize cross-platform support

## [0.5.6] - 2025-03-14

### Added
- Added build integration for deployment
  - Option to run build command before deployment
  - Deploy only the build output directory instead of the entire project
  - Configurable build command and output directory
  - Automatic detection of build failure with option to continue deployment
  - Better separation between source code and deployment artifacts
- Enhanced deployment process
  - Improved fallback mechanism between deployment methods
  - Better error handling for deployment failures
  - More reliable file transfer with directory creation
  - Cleaner progress reporting during deployment
- **Enhanced Vite Project Support**: Added special detection and optimization for Vite-based projects
  - Auto-detection of Vite projects by checking for vite.config.js/ts or vite dependencies
  - Default output directory set to "dist" for Vite projects (standard Vite output folder)
  - Vite-specific file exclusions when deploying without build integration
  - Improved error handling and guidance for Vite build issues

### Improved
- **Build Process Enhancements**:
  - Live output streaming during build process
  - More detailed error reporting with framework-specific solutions
  - Better detection of successful builds even when exit codes are non-zero
  - Added option to deploy from source directory if build fails
- **CLI Interface**:
  - Added project-specific settings menu with framework configuration options
  - Enhanced "About" section with more detailed feature information
  - Improved menu organization with descriptions for each option

### Fixed
- Fixed syntax error in loadOrCreateConfig function that caused an "Unexpected token 'catch'" error
  - Properly structured try-catch block to handle configuration loading
  - Added better error handling for configuration file operations
  - Improved configuration initialization and loading process
- Fixed timeout issues when creating directories on remote server
  - Implemented sequential directory creation to prevent overwhelming the server
  - Added proper error handling for directory creation failures
  - Improved connection stability with longer timeouts and keepalive packets
- Enhanced file transfer reliability
  - Added batch processing with pauses between batches
  - Improved error handling during file transfers
  - Better password authentication handling for SCP operations
- Fixed issues with default build configuration detection
- Improved error handling for build process failures

## [0.5.5] - 2025-03-13

### Fixed
- Enhanced directory cleaning process
  - Added timeout handling to prevent hanging during directory cleaning
  - Improved progress reporting with detailed status messages
  - Added fallback timeout mechanism for very large directories
  - Better error handling with more descriptive messages
- Improved target directory check
  - Added timeout handling for directory check operations
  - Enhanced error messages for common connection issues
  - Added file count to directory status report
  - More robust error handling throughout the process

## [0.5.4] - 2025-03-12

### Added
- Added target directory check before deployment
  - Automatically detects if the target directory contains existing files
  - Provides options to update existing files or clean the directory before deployment
  - Allows canceling deployment if needed
- Improved SSH connection handling
  - Replaced command-line SSH with SSH2 library for directory creation
  - Added batch processing for file transfers to prevent server overload
  - Implemented connection timeout handling and retry mechanisms
  - Added keepalive packets to prevent connection drops during long operations

### Fixed
- Fixed timeout issues when creating directories on remote server
  - Implemented sequential directory creation to prevent overwhelming the server
  - Added proper error handling for directory creation failures
  - Improved connection stability with longer timeouts and keepalive packets
- Enhanced file transfer reliability
  - Added batch processing with pauses between batches
  - Improved error handling during file transfers
  - Better password authentication handling for SCP operations

## [0.5.3] - 2025-03-11

### Fixed
- Fixed password reuse issue in server environment checks
  - Eliminated repeated password prompts when checking NVM and Node.js
  - Reused saved password from configuration for all SSH operations
  - Replaced command-line SSH checks with SSH2 library for consistency
  - Single SSH connection used for all server environment checks

## [0.5.2] - 2025-03-10

### Fixed
- Improved Windows compatibility for SSH connections
  - Replaced command-line SSH tools with native Node.js ssh2 library
  - Removed dependency on expect and sshpass commands
  - Fixed "verifySSHConnection is not a function" error
  - Enhanced SSH authentication to work reliably on Windows
- Enhanced error handling for SSH connections
  - Better error messages for connection failures
  - More reliable key and password authentication
  - Improved troubleshooting guidance

## [0.5.1] - 2025-03-09

### Fixed
- Fixed circular dependency warning between server-check.js and setup-node.js modules
- Resolved "Accessing non-existent property 'verifySSHConnection'" warning in the interactive CLI menu
- Improved module structure to prevent circular references
- Enhanced code organization for better maintainability

## [0.5.0] - 2025-03-08

### Added
- Added interactive CLI menu for better user experience
  - Main menu with all available commands
  - Emoji icons for better visual cues
  - Improved command flow with follow-up prompts
- Enhanced check-server command
  - More detailed output with color-coded information
  - Option to deploy or setup Node.js after checking
  - Improved user guidance throughout the process
- Updated Node.js and NVM versions
  - Added support for Node.js 22.14.0 LTS (Jod)
  - Updated to NVM 0.40.1
  - Better version selection in setup-node command

### Improved
- Better user interface with chalk for colored output
- More intuitive command flow with follow-up actions
- Clearer error messages and troubleshooting guidance
- Simplified CLI usage with default interactive menu

## [0.4.6] - 2025-03-07

### Added
- Added robust SSH authentication diagnostics
  - Automatic detection of available authentication methods
  - Detailed troubleshooting guidance for SSH connection issues
  - Support for multiple authentication fallback methods
  - New `check-server` command to verify server environment independently
  - Comprehensive error handling for SSH connection failures

### Improved
- Enhanced server environment check feature
  - Better error handling for SSH connection issues
  - More reliable detection of NVM and Node.js installations
  - Improved password handling with option to save for future operations
  - Clearer user guidance throughout the verification process
  - Suppressed unnecessary error messages from server commands

## [0.4.5] - 2025-03-06

### Added
- Added server environment check feature
  - Automatically checks for NVM and Node.js on the server
  - Verifies versions against recommended versions (NVM 0.40.1, Node.js 20.18.0)
  - Offers to set up or update NVM and Node.js if needed
  - Seamless integration with the deployment process

### Improved
- Enhanced setup-node.js command
  - Added support for password authentication
  - Better error handling for SSH connection issues
  - Improved version comparison logic
  - More detailed progress reporting

## [0.4.4] - 2025-03-05

### Added
- Added simplified cross-platform deployment method using native SSH/SCP commands
  - Standardized on SCP/SFTP for all platforms (Windows, macOS, Linux)
  - Eliminated dependency on rsync for better cross-platform compatibility
  - Leveraged built-in SSH client available on modern platforms (Windows 10+, macOS, Linux)
  - Simplified authentication with focus on password-based authentication
  - Improved file transfer reliability with native commands

### Improved
- Streamlined SSH setup process
  - Simplified authentication options with clear recommendations
  - Enhanced password authentication as the primary method
  - Improved SSH key setup instructions for advanced users
  - Better testing of SSH connections during setup
  - Clearer guidance for manual SSH key installation on server
- Enhanced deployment process
  - More reliable file transfers using native commands
  - Better error handling during file transfers
  - Improved progress reporting during deployment
  - Simplified configuration with sensible defaults

## [0.4.3] - 2025-03-04

### Added
- Added password authentication support for SSH and SCP operations
  - Interactive password prompt during deployment
  - Option to save password in configuration (not recommended)
  - Automatic fallback to password authentication if key authentication fails
  - Support for both sshpass and expect-based password handling
  - Password testing during SSH setup

### Improved
- Enhanced error handling for SSH authentication issues
  - Better error messages for authentication failures
  - Automatic retry with password if key authentication fails
  - Detailed guidance for troubleshooting connection issues

## [0.4.1] - 2025-03-04

### Added
- Switched from RSA to Ed25519 SSH keys for better security and compatibility
  - Ed25519 keys are more modern and widely supported by hosting providers
  - Smaller key size with equivalent or better security than RSA
  - Better performance for SSH operations
- Added Windows compatibility improvements
  - Detect when rsync is not available on Windows systems
  - Added alternative SCP-based deployment method for Windows
  - Added WSL installation guidance for Windows users
  - Added clarification about running from within WSL vs Windows shell
  - Multiple deployment paths depending on environment (Windows/WSL/Linux/Mac)
  - Automatic platform detection to choose appropriate deployment method
  - Detailed user prompts for handling Windows-specific deployment options
- Added new `fix-ssh-key` command to resolve SSH key issues
  - Interactive tool to diagnose and fix SSH key problems
  - Options to generate new Ed25519 keys or use existing ones
  - Automatic configuration update to use the correct key type
  - Detailed guidance for adding keys to DreamHost panel
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
- Fixed "minimatch is not a function" error during SCP deployment on Windows
  - Updated minimatch package to version 5.1.0
  - Improved error handling in file exclusion logic
  - Added fallback to simple string comparison if minimatch fails
  - Enhanced robustness of the SCP deployment method
- Fixed SSH key compatibility issues with DreamHost
  - Added automatic detection of Ed25519 keys
  - Improved error handling for SSH and SCP commands
  - Added detailed error messages for failed directory creation and file transfers
  - Prioritized Ed25519 keys over RSA keys when available 