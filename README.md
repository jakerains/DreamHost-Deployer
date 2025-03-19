# DreamHost Deployer

<div align="center">
  
  <!-- Logo placeholder - Replace with actual logo when available -->
  <img src="https://via.placeholder.com/150x150/396afc/ffffff?text=DH" alt="DreamHost Deployer Logo" width="150" height="150" />
  
  ![Version](https://img.shields.io/badge/version-0.6.2-blue.svg?style=flat-square)
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
- 🔑 **SSH Key Management** - Simple SSH key setup and permissions fixing
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

## 📸 Screenshots

<div align="center">
  <h3>Interactive Terminal Menu</h3>
  <p>Choose from a variety of deployment and configuration options</p>
  <img src="screenshots/main-menu.png" alt="DreamHost Deployer Terminal Menu" width="700">
  
  <h3>Deployment Process</h3>
  <p>Clear progress tracking and visual feedback</p>
  <img src="screenshots/deployment.png" alt="DreamHost Deployer Deployment" width="700">
  
  <h3>SSH Key Setup</h3>
  <p>Easy SSH key management with step-by-step instructions</p>
  <img src="screenshots/ssh-setup.png" alt="DreamHost Deployer SSH Setup" width="700">
</div>

**Note:** To see these beautiful terminal interfaces yourself, install the package and run `dreamhost-deployer`!

## 📋 Command Reference

| Command | Description |
|---------|-------------|
| `dreamhost-deployer` | Launch interactive menu |
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

## ⚙️ Configuration

DreamHost Deployer uses a `deploy.config.json` file to store your deployment settings. You can create this file manually or use the interactive setup to generate it.

### Sample Configuration

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
  "createBackup": true
}
```

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
```

## 🧩 Framework Support

DreamHost Deployer automatically detects your project type and provides optimized settings:

| Framework | Detected Features |
|-----------|------------------|
| Vite      | Build command, output dir, environment variables |
| React (CRA) | Build command, output dir, router settings |
| Next.js   | Static export, build options, image optimization |
| Gatsby    | Build command, output dir, asset prefixing |
| Vue CLI   | Build command, output dir, router settings |
| Nuxt.js   | Static generation, build options |
| SvelteKit | Adapter detection, build configuration |
| Angular   | Build command, output dir, environment handling |

## 🌐 .htaccess Templates

The tool includes pre-configured .htaccess templates for:

- **SPA Applications** (React, Vue, Angular, etc.)
- **PHP Applications**
- **WordPress Sites**
- **Static Sites**

Each template includes:
- Proper URL rewriting
- Caching configuration
- Compression settings
- Security headers
- Performance optimizations

## 🔧 Troubleshooting

### SSH Connection Issues

If you're having trouble connecting to your DreamHost server:

1. Run `dreamhost-deployer fix-ssh-key` to fix common permission issues
2. Verify your SSH key is correctly added to your DreamHost panel
3. Check that your hostname and username are correct
4. Ensure your firewall isn't blocking SSH connections

### Deployment Failures

If deployment fails:

1. Try a dry run first: `dreamhost-deployer deploy --dry-run`
2. Check file permissions on your DreamHost server
3. Verify your build process completes successfully
4. Ensure your DreamHost account has sufficient disk space

## 📦 Requirements

- Node.js 14 or higher
- SSH access to your DreamHost server
- rsync (recommended, but not required)

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