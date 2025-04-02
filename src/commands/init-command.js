/**
 * Initialize command for DreamHost Deployer
 * Sets up project config, SSH connection, and verifies server environment
 */

const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const inquirer = require('inquirer');
const configManager = require('../utils/config-manager');
const serverCheck = require('../utils/server-check');
const ui = require('../utils/ui');
const buildIntegration = require('../utils/build-integration');

/**
 * Run the initialization process
 * - Create configuration file
 * - Test SSH connection
 * - Check server environment
 */
async function run() {
  ui.sectionHeader('DREAMHOST DEPLOYER INITIALIZATION');

  // Show welcome message - explain what init does differently than the default command
  console.log(chalk.blue('Welcome to DreamHost Deployer initialization!'));
  console.log(chalk.blue('This command will set up your project for deployment to DreamHost by:'));
  console.log(chalk.blue('  • Creating a configuration file with your server details'));
  console.log(chalk.blue('  • Detecting your project type and optimizing settings'));
  console.log(chalk.blue('  • Verifying SSH connection to your DreamHost server'));
  console.log(chalk.blue('  • Checking server environment and setting up dependencies'));
  console.log();

  // Step 1: Detect project type
  console.log(chalk.blue('🔍 Detecting project type...'));
  const isViteProject = configManager.detectViteProject();
  const projectInfo = buildIntegration.detectProjectType();
  
  if (projectInfo.type !== 'unknown') {
    console.log(chalk.green(`✅ Detected ${projectInfo.type} project`));
    console.log(chalk.blue(projectInfo.details));
  } else {
    console.log(chalk.yellow('⚠️ Could not automatically detect project type.'));
    console.log(chalk.blue('Will proceed with manual configuration.'));
  }
  
  // Step 2: Create configuration file
  console.log(chalk.blue('\n📝 Setting up configuration...'));
  const configPath = path.join(process.cwd(), 'deploy.config.json');
  
  // Check if config already exists
  if (fs.existsSync(configPath)) {
    const { overwriteConfig } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwriteConfig',
        message: 'A configuration file already exists. Do you want to overwrite it?',
        default: false
      }
    ]);
    
    if (!overwriteConfig) {
      console.log(chalk.yellow('⚠️ Using existing configuration file.'));
      const config = configManager.loadConfig(configPath);
      return await continueWithExistingConfig(config, configPath);
    }
  }
  
  // Create new configuration
  const config = await configManager.createConfig(
    configPath, 
    isViteProject,
    projectInfo.type !== 'unknown' ? projectInfo : null
  );
  
  // Apply detected project settings if available
  if (projectInfo.type !== 'unknown') {
    config.buildIntegration = true;
    config.buildCommand = projectInfo.buildCommand || config.buildCommand;
    config.buildOutputDir = projectInfo.outputDir || config.buildOutputDir;
    config.exclude = projectInfo.exclude || config.exclude;
    configManager.saveConfig(config, configPath);
  }
  
  // Step 3: Verify SSH connection
  await verifySshAndServerEnvironment(config, configPath);
  
  // Final success message
  ui.successBox([
    'Initialization complete! 🎉',
    '',
    'Your project is now configured for deployment to DreamHost.',
    'To deploy your website, run:',
    '  dreamhost-deployer deploy'
  ]);
  
  return config;
}

/**
 * Continue initialization with existing config
 */
async function continueWithExistingConfig(config, configPath) {
  // Validate the configuration
  const errors = configManager.validateConfig(config);
  
  if (errors.length > 0) {
    console.log(chalk.yellow('⚠️ There are issues with your configuration:'));
    errors.forEach(error => console.log(chalk.yellow(`  - ${error}`)));
    
    const { fixConfig } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'fixConfig',
        message: 'Would you like to fix these issues now?',
        default: true
      }
    ]);
    
    if (fixConfig) {
      config = await configManager.createConfig(configPath, configManager.detectViteProject());
    } else {
      console.log(chalk.yellow('⚠️ Continuing with problematic configuration. This may cause issues during deployment.'));
    }
  }
  
  // Verify SSH connection and server environment
  await verifySshAndServerEnvironment(config, configPath);
  
  return config;
}

/**
 * Verify SSH connection and server environment
 */
async function verifySshAndServerEnvironment(config, configPath) {
  console.log(chalk.blue('\n🔑 Verifying SSH connection...'));
  
  // Test SSH connection with a timeout to prevent hanging
  try {
    // Create a timeout promise that rejects after 30 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('SSH connection verification timed out after 30 seconds')), 30000)
    );
    
    // Race the actual SSH verification against the timeout
    const connSuccess = await Promise.race([
      serverCheck.verifySSHConnection(config),
      timeoutPromise
    ]);
    
    if (connSuccess) {
      console.log(chalk.green('✅ SSH connection successful!'));
      
      // Check server environment with a timeout
      console.log(chalk.blue('\n🖥️ Checking server environment...'));
      
      try {
        // Create another timeout for server environment check
        const envCheckPromise = serverCheck.checkServerEnvironment(config);
        const envTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Server environment check timed out after 45 seconds')), 45000)
        );
        
        const setupNeeded = await Promise.race([envCheckPromise, envTimeoutPromise]);
        
        if (setupNeeded) {
          const { shouldSetup } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'shouldSetup',
              message: 'Would you like to set up Node.js on your DreamHost server now?',
              default: true
            }
          ]);
          
          if (shouldSetup) {
            const setupNode = require('./setup-node');
            await setupNode.run(config);
          } else {
            console.log(chalk.yellow('⚠️ Server environment setup skipped. You can run it later with:'));
            console.log(chalk.cyan('dreamhost-deployer setup-node'));
          }
        } else {
          console.log(chalk.green('✅ Server environment is properly configured'));
        }
      } catch (error) {
        console.log(chalk.red(`❌ Server environment check failed: ${error.message}`));
        console.log(chalk.yellow('⚠️ You can set up the server environment later with:'));
        console.log(chalk.cyan('dreamhost-deployer setup-node'));
      }
      
      // Save the updated config (in case password was added)
      configManager.saveConfig(config, configPath);
    } else {
      console.log(chalk.red('❌ Could not establish SSH connection.'));
      console.log(chalk.yellow('⚠️ You can setup SSH key authentication later with:'));
      console.log(chalk.cyan('dreamhost-deployer setup-ssh'));
    }
  } catch (error) {
    console.log(chalk.red(`❌ SSH connection error: ${error.message}`));
    console.log(chalk.yellow('⚠️ You can setup SSH key authentication later with:'));
    console.log(chalk.cyan('dreamhost-deployer setup-ssh'));
  }
}

module.exports = {
  run
};