# DreamHost Deployer

A command-line tool for deploying websites to DreamHost servers via SSH.

## Features

- Easy deployment to DreamHost servers
- SSH key setup and management
- Configuration file for storing deployment settings
- Exclude specific files and directories from deployment
- Cross-platform support (Windows, macOS, Linux)

## Installation

```bash
# Install globally
npm install -g dreamhost-deployer

# Or install locally in your project
npm install --save-dev dreamhost-deployer
```

## Quick Start

1. Initialize a new configuration:

```bash
dreamhost-deployer init
```

2. Set up SSH:

```bash
dreamhost-deployer setup-ssh
```

3. Deploy your website:

```bash
dreamhost-deployer deploy
```

## Configuration

The tool uses a `deploy.config.json` file to store your deployment settings. You can create this file manually or use the `init` command to generate it interactively.

Example configuration:

```json
{
  "host": "example.com",
  "username": "your-username",
  "remotePath": "/home/your-username/example.com",
  "localPath": "./dist",
  "privateKeyPath": "~/.ssh/id_rsa",
  "targetFolder": "example.com",
  "exclude": [
    "node_modules",
    ".git",
    ".env",
    ".DS_Store"
  ]
}
```

### Configuration Options

- `host`: Your DreamHost server hostname
- `username`: Your DreamHost username
- `remotePath`: The path on the server where files will be deployed
- `localPath`: The local path to the files you want to deploy
- `privateKeyPath`: Path to your SSH private key
- `targetFolder`: The target folder/domain on the server
- `exclude`: Array of files/directories to exclude from deployment

## Commands

### Initialize Configuration

```bash
dreamhost-deployer init
```

Creates a new `deploy.config.json` file with your deployment settings.

### Setup SSH

```bash
dreamhost-deployer setup-ssh
```

Helps you set up SSH keys for passwordless deployment.

### Deploy

```bash
dreamhost-deployer deploy
```

Deploys your website to the DreamHost server.

You can specify a custom configuration file:

```bash
dreamhost-deployer deploy --config path/to/config.json
```

## Requirements

- Node.js 14 or higher
- SSH access to your DreamHost server
- rsync (recommended, but not required)

## License

MIT

## Author

[jakerains](https://github.com/jakerains)