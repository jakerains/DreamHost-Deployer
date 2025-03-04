# DreamHost Deployer

A command-line tool for deploying websites to DreamHost servers via SSH.

## Features

- Easy deployment to DreamHost servers
- SSH key setup and management
- Configuration file for storing deployment settings
- Exclude specific files and directories from deployment
- Web server type selection (Apache or Nginx)
- NVM and Node.js setup on DreamHost server (using DreamHost recommended versions)
- User-friendly CLI with clear instructions and visual cues
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

3. (Optional) Set up NVM and Node.js on your DreamHost server:

```bash
dreamhost-deployer setup-node
```

4. Deploy your website:

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
  "webServer": "Apache",
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
- `webServer`: The web server type (Apache or Nginx)
- `exclude`: Array of files/directories to exclude from deployment

## Commands

### Initialize Configuration

```bash
dreamhost-deployer init
```

Creates a new `deploy.config.json` file with your deployment settings. You'll be prompted to select your web server type (Apache or Nginx) and provide other necessary configuration details.

### Setup SSH

```bash
dreamhost-deployer setup-ssh
```

Helps you set up SSH keys for passwordless deployment. The tool will generate an SSH key pair if needed and provide instructions for adding the public key to your DreamHost account.

### Setup Node.js

```bash
dreamhost-deployer setup-node
```

Sets up NVM and Node.js on your DreamHost server according to the [DreamHost documentation](https://help.dreamhost.com/hc/en-us/articles/360029083351-Installing-a-custom-version-of-NVM-and-Node-js). 

Features:
- Installs NVM v0.40.1 (latest recommended by DreamHost)
- Installs Node.js v20.18.0 (latest recommended by DreamHost)
- Configures both .bashrc and .bash_profile
- Handles special requirements for Dedicated servers
- Creates server-specific configuration files (Apache .htaccess or Nginx config)
- Provides detailed next steps for setting up your Node.js application

### Deploy

```bash
dreamhost-deployer deploy
```

Deploys your website to the DreamHost server using rsync over SSH.

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