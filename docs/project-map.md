# DreamHost Deployer - Project Map

This document provides an overview of the DreamHost Deployer codebase structure, architecture, and key components.

## Project Structure

```
DreamHost-Deployer/
├── bin/                     # CLI binaries
│   └── cli.js               # Main CLI entry point
├── docs/                    # Documentation
│   └── project-map.md       # This file
├── src/                     # Source code
│   ├── commands/            # Command implementations
│   │   ├── deploy-command.js   # Deploy command implementation
│   │   └── setup-node.js    # Setup Node.js command
│   └── utils/               # Utility modules
│       ├── build-integration.js # Build process utilities
│       ├── config-manager.js    # Configuration management
│       ├── deployment.js        # Deployment utilities
│       └── server-check.js      # Server environment checks
├── templates/               # Template files
│   └── deploy.config.template.json  # Configuration template
├── .gitignore              # Git ignore file
├── .npmignore              # npm ignore file
├── deploy.js               # Main deploy module (wrapper)
├── deploy.config.json      # Example configuration
├── fix-ssh-key.js          # SSH key fix utility
├── package.json            # Package definition
├── README.md               # Documentation
├── setup-ssh.js            # SSH setup utility
└── test.js                 # Tests
```

## Architecture

DreamHost Deployer follows a modular architecture with clear separation of concerns:

### 1. CLI Layer (`bin/cli.js`)

- Handles user interaction through command-line interface
- Parses command-line arguments and options
- Provides an interactive menu for easy access to features
- Delegates to appropriate command modules

```
dreamhost-deployer        # Main CLI entry point with interactive menu
dreamhost-deployer init   # Setup new project (config, SSH, server environment)
dreamhost-deployer deploy # Deploy website
```

### 2. Command Layer (`src/commands/`)

- Implements specific commands (deploy, setup-node, etc.)
- Handles command-specific logic and workflows
- Uses utility modules for shared functionality

### 3. Utility Layer (`src/utils/`)

- Provides reusable functionality across commands
- Implements core features like deployment, configuration management, etc.
- Handles low-level operations

### 4. Core Modules

- **deploy.js**: Entry point for deployment functionality
- **setup-ssh.js**: Handles SSH key setup and management
- **fix-ssh-key.js**: Fixes SSH key permissions

## Key Components

### Configuration Management (`src/utils/config-manager.js`)

- Loads configuration from file or environment variables
- Validates configuration for required settings
- Creates new configuration files interactively
- Detects project type for framework-specific settings

### Deployment (`src/utils/deployment.js`)

- Handles the actual deployment process
- Supports both rsync and SCP deployment methods
- Implements dry run mode to preview changes
- Provides rollback capability for failed deployments
- Shows progress bars for large deployments

### Build Integration (`src/utils/build-integration.js`)

- Manages build process for various JavaScript frameworks
- Automatically detects project type
- Runs build commands and validates output
- Provides framework-specific optimizations

### Server Checks (`src/utils/server-check.js`)

- Verifies server environment (SSH, Node.js, etc.)
- Helps set up required components on the server
- Provides diagnostic information for troubleshooting

## Workflow

1. **Configuration**: DreamHost Deployer first loads configuration (from file or environment variables)
2. **Validation**: Configuration is validated to ensure required settings are present
3. **Build** (if enabled): The project is built using the specified build command
4. **Deployment**: Files are transferred to the DreamHost server using rsync or SCP
5. **Rollback** (if needed): If deployment fails, the previous version can be restored

## Environment Variables

DreamHost Deployer supports configuration via environment variables, which is useful for CI/CD environments:

| Environment Variable | Description |
|---------------------|-------------|
| DREAMHOST_HOST | DreamHost server hostname |
| DREAMHOST_USERNAME | SSH username |
| DREAMHOST_REMOTE_PATH | Path on the server |
| DREAMHOST_LOCAL_PATH | Local path to deploy from |
| DREAMHOST_PASSWORD | SSH password (optional) |
| DREAMHOST_PRIVATE_KEY_PATH | Path to SSH private key |
| DREAMHOST_WEB_SERVER | Web server type (Apache/Nginx) |
| DREAMHOST_BUILD_INTEGRATION | Enable build integration |
| DREAMHOST_BUILD_COMMAND | Build command |
| DREAMHOST_BUILD_OUTPUT_DIR | Build output directory |
| DREAMHOST_EXCLUDE | Files/directories to exclude |

## Framework Support

DreamHost Deployer provides optimized support for various JavaScript frameworks:

- **Vite**: Automatically detects Vite projects and configures appropriate settings
- **Create React App**: Supports CRA projects with build integration
- **Next.js**: Supports Next.js static exports
- **Gatsby**: Supports Gatsby sites
- **Nuxt.js**: Supports Nuxt.js static sites
- **Vue CLI**: Supports Vue CLI projects
- **SvelteKit**: Supports SvelteKit projects
- **Angular**: Supports Angular projects

## Future Development

Planned features and improvements:

1. **Testing**: Comprehensive test suite for all components
2. **CI/CD Integration**: Better support for CI/CD pipelines
3. **Incremental Deployments**: Smart detection of changed files
4. **Multi-site Deployment**: Support for deploying to multiple sites
5. **Plugin System**: Extensibility through plugins 