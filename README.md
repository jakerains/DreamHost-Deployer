# DreamHost Deployer

<div align="center">
  
  <!-- Logo created with SVG -->
  <img src="assets/images/logo.png" alt="DreamHost Deployer Logo" width="150" height="150" />
  
  ![Version](https://img.shields.io/badge/version-0.7.1-blue.svg?style=flat-square)
  ![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)
  ![Node](https://img.shields.io/badge/node-%3E=14.0.0-brightgreen.svg?style=flat-square)
  
  <h3>A stylish, interactive CLI tool for deploying websites to DreamHost</h3>
</div>

DreamHost Deployer is a powerful command-line tool that makes deploying websites to DreamHost shared hosting simple, reliable, and visually appealing. With its interactive menus, progress indicators, and smart project detection, it streamlines the deployment process for developers of all experience levels.

## ✨ Features

- 🚀 **One-Command Deployment** - Deploy your site with a single command
- 🎭 **Stylish Interactive Interface** - Beautiful terminal UI with colors and animations
- 🔍 **Dry Run Mode** - Preview deployment changes without modifying the server
- 🛠️ **Framework Auto-Detection** - Automatically detects Vite, React, Next.js, and more
- 🔄 **Build Integration** - Runs your build process before deployment
- 🔙 **Automatic Rollback** - Instantly revert to previous version if deployment fails
- 🔑 **Password Authentication** - Simple SSH password authentication setup
- 📊 **Progress Tracking** - Visual progress bars for large deployments
- 📋 **Project Templates** - Pre-configured settings for popular frameworks
- 🔧 **Server Environment Setup** - Easily install Node.js on your DreamHost server

## 🚀 Quick Start

### Installation

```bash
# Install globally
npm install -g dreamhost-deployer

# Or install locally in your project
npm install --save-dev dreamhost-deployer
```

### Basic Usage

```bash
# Start the interactive menu
dreamhost-deployer

# Or deploy directly
dreamhost-deployer deploy
```

### Step-by-Step Guide

1. **Initial Setup**
   ```bash
   # Install the package
   npm install -g dreamhost-deployer
   
   # Run the initialization command to set up your project
   dreamhost-deployer init
   
   # Or use the interactive menu
   dreamhost-deployer
   # Select "Initialize project" from the menu
   ```

2. **SSH Authentication Setup**
   ```bash
   # Set up password authentication for your DreamHost server
   dreamhost-deployer setup-ssh
   ```
   
   Follow the prompts to set up and test your password authentication for your DreamHost server.

3. **Server Environment Setup**
   ```bash
   # Check and configure Node.js on your DreamHost server
   dreamhost-deployer setup-node
   ```
   
   This will guide you through installing NVM and Node.js on your DreamHost server, which is useful for running Node.js applications or build processes on the server.

4. **Project Configuration**
   ```bash
   # Configure project build settings
   dreamhost-deployer
   # Select "Configure project settings" from the menu
   ```
   
   This will detect your project type (Vite, React, Next.js, etc.) and configure optimal build settings automatically.

5. **Deploy Your Website**
   ```bash
   # Run a dry-run deployment first (recommended)
   dreamhost-deployer deploy --dry-run
   
   # Deploy your website
   dreamhost-deployer deploy
   ```

## 📸 Terminal Interface

The screenshots below are mockups representing the actual terminal interface you'll experience when using DreamHost Deployer.

<div align="center">
  <h3>Interactive Terminal Menu</h3>
  <p>Choose from a variety of deployment and configuration options</p>
  <img src="assets/images/main-menu.png" alt="DreamHost Deployer Terminal Menu" width="700">
  
  <h3>Deployment Process</h3>
  <p>Clear progress tracking and visual feedback</p>
  <img src="assets/images/deployment.png" alt="DreamHost Deployer Deployment" width="700">
  
  <h3>SSH Key Setup</h3>
  <p>Easy SSH key management with step-by-step instructions</p>
  <img src="assets/images/ssh-setup.png" alt="DreamHost Deployer SSH Setup" width="700">
</div>

**Note:** To see these beautiful terminal interfaces yourself, install the package and run `dreamhost-deployer`!

## 📋 Command Reference

| Command | Description |
|---------|-------------|
| `dreamhost-deployer` | Launch interactive menu |
| `dreamhost-deployer init` | Set up project for DreamHost deployment (config, SSH, server) |
| `dreamhost-deployer deploy` | Deploy website to DreamHost |
| `dreamhost-deployer deploy --dry-run` | Preview deployment without making changes |
| `dreamhost-deployer build` | Run build process without deploying |
| `dreamhost-deployer setup-ssh` | Set up SSH key authentication |
| `dreamhost-deployer ssh-setup` | Set up SSH key authentication (alias) |
| `dreamhost-deployer fix-ssh-key` | Fix SSH key permissions |
| `dreamhost-deployer check-server` | Check Node.js environment on server |
| `dreamhost-deployer setup-node` | Install Node.js on DreamHost server |
| `dreamhost-deployer project-settings` | Configure project-specific settings |
| `dreamhost-deployer htaccess` | Configure and deploy .htaccess file |
| `dreamhost-deployer info` | Display deployment information |
| `dreamhost-deployer info --server` | Include server information |
| `dreamhost-deployer version` | Display version number |

### Deployment Command Options

The `deploy` command supports several options to customize your deployment:

```bash
# Basic deployment
dreamhost-deployer deploy

# Preview changes without deploying
dreamhost-deployer deploy --dry-run

# Deploy without creating a backup
dreamhost-deployer deploy --no-backup

# Force deployment even if checks fail
dreamhost-deployer deploy --force

# Deploy with verbose logging
dreamhost-deployer deploy --verbose

# Deploy a specific directory
dreamhost-deployer deploy --path ./dist

# Deploy to a specific remote path
dreamhost-deployer deploy --remote /home/username/example.com
```

### Build Integration Options

When using the build integration feature:

```bash
# Run build process only
dreamhost-deployer build

# Run build with a specific command
dreamhost-deployer build --command "npm run build:prod"

# Specify output directory
dreamhost-deployer build --output-dir "./build"

# Build with environment variables
dreamhost-deployer build --env production
```

## ⚙️ Configuration

DreamHost Deployer uses a `deploy.config.json` file to store your deployment settings. You can create this file manually or use the interactive setup to generate it.

### Interactive Configuration

The easiest way to create your configuration is through the interactive setup:

```bash
dreamhost-deployer
```

This will launch a step-by-step wizard that guides you through:
1. Setting up your DreamHost server connection details
2. Configuring SSH authentication (password or key-based)
3. Specifying local and remote paths for deployment
4. Setting up build integration for your specific framework
5. Configuring exclusion patterns for files you don't want to deploy

### Sample Configuration

Here's a complete example of the `deploy.config.json` file:

```json
{
  "host": "example.dreamhost.com",
  "username": "your-username",
  "remotePath": "/home/your-username/example.com",
  "localPath": "./dist",
  "privateKeyPath": "~/.ssh/id_rsa",
  "webServer": "apache",
  "buildIntegration": true,
  "buildCommand": "npm run build",
  "buildOutputDir": "dist",
  "excludePatterns": [
    "node_modules",
    ".git",
    ".env",
    ".DS_Store"
  ],
  "createBackup": true,
  "rollbackOnFailure": true,
  "deploymentMethod": "auto",
  "compressAssets": true,
  "timeout": 300000,
  "verboseLogging": false
}
```

### Configuration Options Explained

| Option | Description | Default |
|--------|-------------|---------|
| `host` | DreamHost server hostname | N/A (required) |
| `username` | SSH username for DreamHost | N/A (required) |
| `remotePath` | Path on DreamHost server | N/A (required) |
| `localPath` | Local directory to deploy | Current directory |
| `privateKeyPath` | Path to SSH private key | `~/.ssh/id_rsa` |
| `password` | SSH password (not recommended) | N/A |
| `webServer` | Server type (apache/nginx) | `apache` |
| `buildIntegration` | Enable build before deploy | `false` |
| `buildCommand` | Command to build project | Varies by framework |
| `buildOutputDir` | Directory with built files | Varies by framework |
| `excludePatterns` | Files to exclude from deploy | `["node_modules", ".git"]` |
| `createBackup` | Create backup before deploy | `true` |
| `rollbackOnFailure` | Revert to backup on fail | `true` |
| `deploymentMethod` | Deploy method (rsync/scp/auto) | `auto` |
| `compressAssets` | Compress files during transfer | `true` |
| `timeout` | Timeout for operations (ms) | `300000` |
| `verboseLogging` | Enable detailed logging | `false` |

### Environment Variables

For CI/CD pipelines, you can use environment variables instead:

```
DREAMHOST_HOST=example.dreamhost.com
DREAMHOST_USERNAME=your-username
DREAMHOST_REMOTE_PATH=/home/your-username/example.com
DREAMHOST_LOCAL_PATH=./dist
DREAMHOST_PRIVATE_KEY_PATH=~/.ssh/id_rsa
DREAMHOST_WEB_SERVER=apache
DREAMHOST_BUILD_INTEGRATION=true
DREAMHOST_BUILD_COMMAND=npm run build
DREAMHOST_BUILD_OUTPUT_DIR=dist
DREAMHOST_EXCLUDE=node_modules,.git,.env,.DS_Store
DREAMHOST_CREATE_BACKUP=true
DREAMHOST_ROLLBACK_ON_FAILURE=true
DREAMHOST_DEPLOYMENT_METHOD=auto
DREAMHOST_COMPRESS_ASSETS=true
DREAMHOST_TIMEOUT=300000
DREAMHOST_VERBOSE_LOGGING=false
```

You can mix and match environment variables and config file settings. Environment variables take precedence over the configuration file.

## 🔑 SSH Authentication Setup

Proper SSH authentication setup is crucial for secure and smooth deployments. DreamHost Deployer provides simple tools for setting up password-based authentication.

### Setting Up SSH Authentication

```bash
# Run the SSH setup wizard
dreamhost-deployer setup-ssh
```

This interactive wizard will:
1. Set up password authentication for your DreamHost server
2. Test the connection to verify it works
3. Provide an option to save your password for non-interactive deployments (not recommended for security reasons)
4. Guide you through fixing common connection issues

### SSH Authentication Best Practices

- **Use strong passwords** - Complex passwords provide better security
- **Don't save passwords in configuration files** - Enter your password during deployment instead
- **Consider a password manager** - Store your credentials securely
- **Update passwords regularly** - Change your DreamHost password periodically

## 🏗️ Build Integration

DreamHost Deployer can automatically build your project before deployment, making it easy to deploy modern JavaScript frameworks.

### Automatic Framework Detection

The tool automatically identifies your project type by examining your dependencies and configuration files:

```bash
# Check what type of project was detected
dreamhost-deployer info
```

### Build Configuration

You can configure build settings through the interactive menu or by editing `deploy.config.json`:

```bash
# Configure build settings
dreamhost-deployer
# Select "Configure project settings"
```

### Build-Only Mode

You can run the build process without deploying to test it:

```bash
# Run build process only
dreamhost-deployer build
```

### Environment-Specific Builds

For different environments:

```bash
# Build with staging environment variables
dreamhost-deployer build --env staging

# Build with production environment variables
dreamhost-deployer build --env production
```

## 🧩 Framework Support

DreamHost Deployer automatically detects your project type and provides optimized settings:

| Framework | Detected Features | Build Command | Output Directory |
|-----------|------------------|---------------|------------------|
| Vite      | Environment vars, asset handling | `npm run build` | `dist` |
| React (CRA) | Router settings, static optimization | `npm run build` | `build` |
| Next.js   | Static export, image optimization | `npm run build && npm run export` | `out` |
| Gatsby    | Asset prefixing, SEO optimization | `npm run build` | `public` |
| Vue CLI   | Router settings, compression | `npm run build` | `dist` |
| Nuxt.js   | Static generation, SSR detection | `npm run generate` | `dist` |
| SvelteKit | Adapter configuration | `npm run build` | `build` |
| Angular   | Environment handling, optimization | `ng build --prod` | `dist` |

### Framework-Specific Optimizations

The tool automatically applies optimizations for each framework:

**Vite Projects**
- Configures proper base paths for deployments
- Sets up environment variables for production
- Optimizes asset handling for DreamHost

**React Projects**
- Configures proper homepage in package.json
- Sets up router for history API fallback
- Optimizes caching for static assets

**Next.js Projects**
- Configures for static exports when possible
- Sets up image optimization
- Handles API routes with proper redirects

## 🚀 Detailed Deployment Process

DreamHost Deployer's deployment process is designed to be reliable, efficient, and safe.

### Deployment Workflow

When you run `dreamhost-deployer deploy`, the following steps occur:

1. **Configuration Loading**
   - Loads settings from `deploy.config.json` or environment variables
   - Validates all required settings are present

2. **Pre-Deployment Checks**
   - Verifies SSH connection to DreamHost
   - Checks for sufficient disk space on server
   - Validates all paths exist

3. **Build Process** (if enabled)
   - Runs your project's build command
   - Verifies build output exists
   - Prepares optimizations for your framework

4. **Backup Creation**
   - Creates a timestamped backup of your current site
   - Stores backup path for potential rollback

5. **File Transfer**
   - Uses rsync (if available) or SCP for optimal transfer
   - Excludes unnecessary files (node_modules, .git, etc.)
   - Shows progress bar during transfer

6. **Post-Deployment Verification**
   - Checks that all files were transferred correctly
   - Verifies file permissions on the server

### Deployment Methods

DreamHost Deployer supports multiple transfer methods:

**Rsync Method** (recommended)
- Faster due to differential transfers (only changed files)
- More efficient with large sites
- Better handling of permissions
- Requires rsync to be installed locally

**SCP Method** (fallback)
- Works on all platforms without additional software
- More reliable in some network environments
- Transfers entire files, even if only small changes made

### Rollback Capability

If something goes wrong during deployment, DreamHost Deployer can automatically roll back:

```bash
# Enable automatic rollback
dreamhost-deployer deploy --rollback

# Manual rollback to a specific backup
dreamhost-deployer rollback --backup /path/to/backup_2023-04-01
```

## 🌐 .htaccess Templates and Web Server Configuration

DreamHost Deployer includes pre-configured server settings for different application types.

### .htaccess Templates

The tool includes templates for:

```bash
# Generate an .htaccess file for a Single Page Application
dreamhost-deployer htaccess --type spa

# Generate an .htaccess file for a PHP application
dreamhost-deployer htaccess --type php

# Generate an .htaccess file for WordPress
dreamhost-deployer htaccess --type wordpress

# Generate an .htaccess file for a static site
dreamhost-deployer htaccess --type static
```

Each template includes:
- **URL Rewriting** - Proper rules for your application type
- **Caching Configuration** - Optimal cache headers for different file types
- **Compression Settings** - GZIP/Brotli compression for faster loading
- **Security Headers** - Protection against common vulnerabilities
- **Performance Optimizations** - Browser hinting, connection settings

### Sample SPA .htaccess

For Single Page Applications (React, Vue, Angular):

```apache
# Redirect all requests to index.html for SPA routing
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  # Rewrite everything else to index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Caching rules for static assets
<IfModule mod_expires.c>
  ExpiresActive On
  # Cache CSS, JS and media files for 1 year
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  # Cache fonts for 1 year
  ExpiresByType application/font-woff "access plus 1 year"
  ExpiresByType application/font-woff2 "access plus 1 year"
  # Disable caching for HTML files
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json
  AddOutputFilterByType DEFLATE application/font-woff application/font-woff2 image/svg+xml
</IfModule>

# Security headers
<IfModule mod_headers.c>
  # Prevent clickjacking
  Header set X-Frame-Options "SAMEORIGIN"
  # XSS Protection
  Header set X-XSS-Protection "1; mode=block"
  # Prevent MIME-sniffing
  Header set X-Content-Type-Options "nosniff"
</IfModule>
```

### Nginx Configuration

For Nginx servers, DreamHost Deployer can generate appropriate configurations:

```bash
# Generate Nginx configuration
dreamhost-deployer server-config --type nginx
```

## 🔧 Troubleshooting

### SSH Connection Issues

If you're having trouble connecting to your DreamHost server:

1. **Run SSH Fix Tool**
   ```bash
   dreamhost-deployer fix-ssh-key
   ```

2. **Verify SSH Key in DreamHost Panel**
   - Log into DreamHost control panel
   - Go to Users → Manage Users → SSH Keys
   - Verify your public key is listed

3. **Check Common SSH Issues**
   - SSH key permissions should be 600 for private key
   - .ssh directory permissions should be 700
   - Correct hostname and username in config
   - Firewall not blocking SSH (port 22)

4. **Verbose SSH Connection for Debugging**
   ```bash
   ssh -vvv username@example.dreamhost.com
   ```

### Deployment Failures

If deployment fails:

1. **Run Dry Run Mode First**
   ```bash
   dreamhost-deployer deploy --dry-run
   ```

2. **Check Server Permissions**
   - Ensure your user has write access to the target directory
   - Check for any "Permission denied" errors in logs

3. **Verify Build Process**
   ```bash
   # Test build without deploying
   dreamhost-deployer build
   ```

4. **Check Server Disk Space**
   ```bash
   # Get server info including disk space
   dreamhost-deployer info --server
   ```

5. **Check Log Files**
   - DreamHost Deployer creates logs in the `logs/` directory
   - Review error messages for specific issues

### Log File Location

DreamHost Deployer creates detailed logs in the following location:
```
logs/dreamhost-deployer-YYYY-MM-DD.log
```

These logs contain detailed information about what went wrong during deployment.

## 📦 Requirements

- **Node.js**: 14.0.0 or higher
- **SSH Access**: SSH account on your DreamHost server
- **Rsync**: Recommended but not required (falls back to SCP)
- **Operating Systems**: Fully cross-platform, works on macOS, Linux, and Windows
- **Disk Space**: Minimal; requires about 10MB plus dependencies
- **Permissions**: Write access to your DreamHost web directory

### Optional Requirements

- **Git**: For version control features (not required for basic deployment)
- **Build Tools**: If using build integration, requirements depend on your project
- **Terminal**: Any modern terminal with color support for best experience

## 🔄 Upcoming Features

- [ ] Continuous deployment via GitHub Actions
- [ ] Multi-site deployment profile management
- [ ] Database backup and migration tools
- [ ] Post-deployment testing
- [ ] Site performance analysis
- [ ] Enhanced logging and deployment history

## 📜 License

MIT © [jakerains](https://github.com/jakerains)

## 🧑‍💻 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

Please see our [contributing guidelines](CONTRIBUTING.md) for more details.

## 🙏 Credits

- **Developer**: [jakerains](https://github.com/jakerains)
- **UI Components**: Built with [chalk](https://github.com/chalk/chalk), [ora](https://github.com/sindresorhus/ora), [inquirer](https://github.com/SBoudrias/Inquirer.js), and other excellent libraries
- **Inspiration**: DreamHost's commitment to simplicity and developer-friendliness

---

<div align="center">
  <p><strong>DreamHost Deployer</strong> - Making website deployment a dream!</p>
</div>