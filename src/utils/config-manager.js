const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const os = require('os');

/**
 * Configuration manager for DreamHost Deployer
 * Handles loading, creating, validating, and saving configuration
 */

// Load configuration from file or environment variables
function loadConfig(configPath) {
  const config = {};
  
  // First check for environment variables
  if (process.env.DREAMHOST_HOST && 
      process.env.DREAMHOST_USERNAME && 
      process.env.DREAMHOST_REMOTE_PATH) {
    
    console.log(chalk.blue('📋 Using configuration from environment variables'));
    
    config.host = process.env.DREAMHOST_HOST;
    config.username = process.env.DREAMHOST_USERNAME;
    config.remotePath = process.env.DREAMHOST_REMOTE_PATH;
    config.localPath = process.env.DREAMHOST_LOCAL_PATH || process.cwd();
    
    // Authentication
    if (process.env.DREAMHOST_PASSWORD) {
      config.password = process.env.DREAMHOST_PASSWORD;
    } else if (process.env.DREAMHOST_PRIVATE_KEY_PATH) {
      config.privateKeyPath = process.env.DREAMHOST_PRIVATE_KEY_PATH;
    } else {
      // Default to ~/.ssh/id_rsa if no auth method specified
      const homeDir = os.homedir();
      config.privateKeyPath = path.join(homeDir, '.ssh', 'id_rsa');
    }
    
    // Other settings
    config.webServer = process.env.DREAMHOST_WEB_SERVER || 'Apache';
    config.buildIntegration = process.env.DREAMHOST_BUILD_INTEGRATION === 'true';
    config.buildCommand = process.env.DREAMHOST_BUILD_COMMAND;
    config.buildOutputDir = process.env.DREAMHOST_BUILD_OUTPUT_DIR;
    
    // Parse exclude list if present
    if (process.env.DREAMHOST_EXCLUDE) {
      try {
        config.exclude = JSON.parse(process.env.DREAMHOST_EXCLUDE);
      } catch (err) {
        console.log(chalk.yellow('⚠️ Failed to parse DREAMHOST_EXCLUDE environment variable. Using default exclusions.'));
        config.exclude = ['node_modules', '.git', '.env', '.DS_Store'];
      }
    }
    
    return config;
  }
  
  // Then check for config file
  if (fs.existsSync(configPath)) {
    try {
      Object.assign(config, JSON.parse(fs.readFileSync(configPath, 'utf8')));
      console.log(chalk.green(`✅ Loaded configuration from ${configPath}`));
      return config;
    } catch (err) {
      console.log(chalk.red(`❌ Error loading configuration from ${configPath}: ${err.message}`));
      throw new Error(`Failed to load configuration: ${err.message}`);
    }
  }
  
  console.log(chalk.yellow(`⚠️ No configuration found at ${configPath} or in environment variables`));
  return null;
}

// Validate configuration and return validation errors if any
function validateConfig(config) {
  const errors = [];
  
  if (!config) {
    errors.push('Configuration is empty');
    return errors;
  }
  
  // Required fields
  if (!config.host) errors.push('Missing host (DreamHost hostname)');
  if (!config.username) errors.push('Missing username (SSH username)');
  if (!config.remotePath) errors.push('Missing remotePath (path on DreamHost server)');
  
  // Check that we have either password or privateKeyPath
  if (!config.password && !config.privateKeyPath) {
    errors.push('Missing authentication method (password or privateKeyPath)');
  }
  
  // If privateKeyPath is specified, check that it exists
  if (config.privateKeyPath && !fs.existsSync(path.resolve(config.privateKeyPath))) {
    errors.push(`Private key not found at ${config.privateKeyPath}`);
  }
  
  // If localPath is specified, check that it exists
  if (config.localPath && !fs.existsSync(path.resolve(config.localPath))) {
    errors.push(`Local path not found: ${config.localPath}`);
  }
  
  // Validate build integration settings if enabled
  if (config.buildIntegration) {
    if (!config.buildCommand) errors.push('Build integration enabled but no buildCommand specified');
    if (!config.buildOutputDir) errors.push('Build integration enabled but no buildOutputDir specified');
  }
  
  return errors;
}

// Save configuration to file
function saveConfig(config, configPath) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green(`✅ Configuration saved to ${configPath}`));
    return true;
  } catch (err) {
    console.log(chalk.red(`❌ Error saving configuration to ${configPath}: ${err.message}`));
    return false;
  }
}

// Interactive configuration creator
async function createConfig(configPath, isVite = false, projectInfo = null) {
  const config = {};
  
  console.log(chalk.blue('Let\'s set up your DreamHost deployment configuration...'));
  
  // Get user input for configuration
  config.host = await prompt('DreamHost hostname (e.g., example.com):');
  config.username = await prompt('SSH username:');
  
  // Detect whether to use password or key authentication
  const authType = await prompt('Authentication type (password/key) [key]:') || 'key';
  
  if (authType.toLowerCase() === 'password') {
    config.password = await prompt('SSH password:');
  } else {
    // Default to ~/.ssh/id_rsa, but allow custom path
    const homeDir = os.homedir();
    const defaultKeyPath = path.join(homeDir, '.ssh', 'id_rsa');
    config.privateKeyPath = await prompt(`Path to private key [${defaultKeyPath}]:`) || defaultKeyPath;
  }
  
  config.remotePath = await prompt('Remote path on DreamHost (e.g., /home/username/example.com):');
  config.localPath = await prompt(`Local path to deploy from [${process.cwd()}]:`) || process.cwd();
  
  // Use project info if available, otherwise ask about build integration
  if (projectInfo) {
    console.log(chalk.green(`✅ Applying detected ${projectInfo.type} project settings`));
    config.buildIntegration = true;
    config.buildCommand = projectInfo.buildCommand;
    config.buildOutputDir = projectInfo.outputDir;
    config.exclude = projectInfo.exclude || ['node_modules', '.git', '.env', '.DS_Store'];
    
    // Show detected settings
    console.log(chalk.cyan(`ℹ️ Build command: ${config.buildCommand}`));
    console.log(chalk.cyan(`ℹ️ Output directory: ${config.buildOutputDir}`));
  } else {
    // Ask about build integration
    const enableBuildIntegration = (await prompt('Enable build integration? (y/n) [y]:') || 'y').toLowerCase();
    
    if (enableBuildIntegration === 'y') {
      config.buildIntegration = true;
      
      // Use Vite defaults if it's a Vite project
      const defaultBuildCmd = isVite ? 'npm run build' : 'npm run build';
      const defaultOutputDir = isVite ? 'dist' : 'build';
      
      config.buildCommand = await prompt(`Build command [${defaultBuildCmd}]:`) || defaultBuildCmd;
      config.buildOutputDir = await prompt(`Output directory [${defaultOutputDir}]:`) || defaultOutputDir;
      
      // For Vite projects, add additional guidance
      if (isVite) {
        console.log(chalk.cyan('ℹ️ For Vite projects, common build commands include:'));
        console.log(chalk.cyan('   - npm run build (package.json script)'));
        console.log(chalk.cyan('   - yarn build (if using Yarn)'));
        console.log(chalk.cyan('   - npx vite build (direct vite command)'));
        console.log(chalk.cyan('The standard output directory for Vite is "dist"'));
      }
    }
    
    // Set default exclusions
    config.exclude = ['node_modules', '.git', '.env', '.DS_Store'];
  }
  
  // Ask for web server type
  const { webServer } = await inquirer.prompt([
    {
      type: 'list',
      name: 'webServer',
      message: 'Select your DreamHost web server type:',
      choices: [
        { name: 'Apache (Default)', value: 'Apache' },
        { name: 'Nginx', value: 'Nginx' }
      ],
      default: 'Apache'
    }
  ]);
  
  config.webServer = webServer;
  
  // Save the configuration
  saveConfig(config, configPath);
  
  return config;
}

// Helper function for prompting
async function prompt(message) {
  const { answer } = await inquirer.prompt([
    {
      type: 'input',
      name: 'answer',
      message
    }
  ]);
  return answer;
}

// Check if the project is a Vite project
function detectViteProject() {
  const isViteConfig = fs.existsSync(path.join(process.cwd(), 'vite.config.js')) || 
                     fs.existsSync(path.join(process.cwd(), 'vite.config.ts'));
  
  // Also check package.json for vite dependency
  let hasViteDependency = false;
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      hasViteDependency = (packageJson.dependencies && packageJson.dependencies.vite) || 
                         (packageJson.devDependencies && packageJson.devDependencies.vite);
    }
  } catch (err) {
    // Silently ignore package.json parsing errors
  }
  
  return isViteConfig || hasViteDependency;
}

module.exports = {
  loadConfig,
  validateConfig,
  saveConfig,
  createConfig,
  detectViteProject
}; 