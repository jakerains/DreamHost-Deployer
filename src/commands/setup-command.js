/**
 * DreamHost Deployer
 * Version 0.6.0
 * 
 * Setup command implementation with enhanced UI
 */

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const ui = require('../utils/ui');
const configManager = require('../utils/config-manager');
const buildIntegration = require('../utils/build-integration');

// Default config path
const DEFAULT_CONFIG_PATH = path.join(process.cwd(), 'deploy.config.json');

/**
 * Run the interactive setup process
 */
async function runSetup(options = {}) {
  ui.sectionHeader('CONFIGURATION SETUP');
  
  try {
    const configPath = options.configPath || DEFAULT_CONFIG_PATH;
    
    // Check if config exists
    const loadSpinner = ui.spinner('Checking for existing configuration...');
    loadSpinner.start();
    
    const existingConfig = configManager.loadConfig(configPath);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    loadSpinner.stop();
    
    if (existingConfig) {
      console.log(ui.warning(`Found existing configuration at: ${configPath}`));
      
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Do you want to modify this configuration?',
          default: true
        }
      ]);
      
      if (!overwrite) {
        console.log(ui.info('Setup canceled. Using existing configuration.'));
        return existingConfig;
      }
    }
    
    // Detect project type for better defaults
    const detectSpinner = ui.spinner('Detecting project type...');
    detectSpinner.start();
    
    // Try to auto-detect project type
    let projectType = 'unknown';
    let buildCommand = '';
    let buildOutputDir = '';
    let localPath = '';
    
    const projectInfo = buildIntegration.detectProjectType();
    projectType = projectInfo.type;
    
    await new Promise(resolve => setTimeout(resolve, 1200));
    detectSpinner.stop();
    
    if (projectType !== 'unknown') {
      console.log(ui.success(`Detected ${projectInfo.type} project!`));
      console.log(ui.info(projectInfo.details));
      console.log(ui.projectTypeBadge(projectType));
      
      buildCommand = projectInfo.buildCommand;
      buildOutputDir = projectInfo.outputDir;
      
      if (buildOutputDir) {
        localPath = path.join(process.cwd(), buildOutputDir);
      }
    } else {
      console.log(ui.info('Could not automatically detect project type. Will use generic defaults.'));
      localPath = process.cwd();
    }
    
    // Create prompts array for inquirer
    // Use existing config values as defaults if they exist
    const prompts = [
      {
        type: 'input',
        name: 'host',
        message: 'DreamHost server hostname:',
        default: existingConfig?.host || 'example.dreamhost.com',
        validate: input => input ? true : 'Server hostname is required'
      },
      {
        type: 'input',
        name: 'username',
        message: 'DreamHost SSH username:',
        default: existingConfig?.username || '',
        validate: input => input ? true : 'Username is required'
      },
      {
        type: 'input',
        name: 'remotePath',
        message: 'Remote path on server:',
        default: existingConfig?.remotePath || '/home/username/example.com',
        validate: input => input.startsWith('/') ? true : 'Path must be absolute (start with /)'
      },
      {
        type: 'input',
        name: 'localPath',
        message: 'Local path to deploy:',
        default: existingConfig?.localPath || localPath || process.cwd(),
        validate: input => input ? true : 'Local path is required'
      },
      {
        type: 'list',
        name: 'authType',
        message: 'Authentication method:',
        default: existingConfig?.privateKeyPath ? 'key' : 'password',
        choices: [
          { name: 'SSH Key (recommended)', value: 'key' },
          { name: 'Password', value: 'password' }
        ]
      }
    ];
    
    // Add SSH key path question if SSH key is selected
    const initialAnswers = await inquirer.prompt(prompts);
    
    let answers = { ...initialAnswers };
    
    if (answers.authType === 'key') {
      const keyPrompt = await inquirer.prompt([
        {
          type: 'input',
          name: 'privateKeyPath',
          message: 'Path to SSH private key:',
          default: existingConfig?.privateKeyPath || path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'id_rsa')
        }
      ]);
      
      answers.privateKeyPath = keyPrompt.privateKeyPath;
    }
    
    // Add build integration questions
    console.log('');
    ui.subsectionHeader('Build Integration');
    
    const buildPrompt = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'buildIntegration',
        message: 'Enable build integration?',
        default: !!existingConfig?.buildIntegration || projectType !== 'unknown'
      }
    ]);
    
    answers.buildIntegration = buildPrompt.buildIntegration;
    
    if (answers.buildIntegration) {
      const buildAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'buildCommand',
          message: 'Build command:',
          default: existingConfig?.buildCommand || buildCommand || 'npm run build',
          validate: input => input ? true : 'Build command is required'
        },
        {
          type: 'input',
          name: 'buildOutputDir',
          message: 'Build output directory (relative to project root):',
          default: existingConfig?.buildOutputDir || buildOutputDir || 'dist',
          validate: input => input ? true : 'Output directory is required'
        }
      ]);
      
      answers = { ...answers, ...buildAnswers };
      
      // Ask if they want to use the build output as the local path
      const { useBuildOutput } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useBuildOutput',
          message: 'Use build output directory as the local path to deploy?',
          default: true
        }
      ]);
      
      if (useBuildOutput) {
        answers.localPath = path.join(process.cwd(), answers.buildOutputDir);
        console.log(ui.info(`Local path updated to: ${answers.localPath}`));
      }
    }
    
    // Add advanced configuration
    console.log('');
    ui.subsectionHeader('Advanced Options');
    
    const { configureAdvanced } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'configureAdvanced',
        message: 'Configure advanced options?',
        default: false
      }
    ]);
    
    if (configureAdvanced) {
      const advancedPrompt = await inquirer.prompt([
        {
          type: 'list',
          name: 'webServer',
          message: 'Web server type:',
          default: existingConfig?.webServer || 'apache',
          choices: [
            { name: 'Apache', value: 'apache' },
            { name: 'Nginx', value: 'nginx' },
            { name: 'Other', value: 'other' }
          ]
        },
        {
          type: 'input',
          name: 'excludePatterns',
          message: 'File patterns to exclude (comma separated):',
          default: existingConfig?.excludePatterns?.join(',') || '.git,.DS_Store,node_modules'
        },
        {
          type: 'confirm',
          name: 'createBackup',
          message: 'Create backup before deployment?',
          default: existingConfig?.createBackup !== false
        }
      ]);
      
      answers = { 
        ...answers, 
        ...advancedPrompt,
        excludePatterns: advancedPrompt.excludePatterns.split(',').map(p => p.trim()).filter(p => p)
      };
    } else {
      // Set defaults for advanced options
      answers.webServer = existingConfig?.webServer || 'apache';
      answers.excludePatterns = existingConfig?.excludePatterns || ['.git', '.DS_Store', 'node_modules'];
      answers.createBackup = existingConfig?.createBackup !== false;
    }
    
    // Create and save the config
    const saveSpinner = ui.spinner('Saving configuration...');
    saveSpinner.start();
    
    const config = {
      host: answers.host,
      username: answers.username,
      remotePath: answers.remotePath,
      localPath: answers.localPath,
      webServer: answers.webServer,
      excludePatterns: answers.excludePatterns,
      createBackup: answers.createBackup,
      buildIntegration: answers.buildIntegration
    };
    
    // Add conditional properties
    if (answers.privateKeyPath) {
      config.privateKeyPath = answers.privateKeyPath;
    }
    
    if (answers.buildIntegration) {
      config.buildCommand = answers.buildCommand;
      config.buildOutputDir = answers.buildOutputDir;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    saveSpinner.stop();
    
    // Save the config
    configManager.saveConfig(config, configPath);
    
    // Display the saved configuration
    console.log(ui.success(`Configuration saved to: ${configPath}`));
    
    // Show summary of configuration
    console.log('');
    ui.subsectionHeader('Configuration Summary');
    
    const configTable = ui.createTable(['Setting', 'Value']);
    
    configTable.push(
      ['Host', config.host],
      ['Username', config.username],
      ['Remote Path', config.remotePath],
      ['Local Path', config.localPath],
      ['Authentication', config.privateKeyPath ? `SSH Key (${config.privateKeyPath})` : 'Password']
    );
    
    if (config.buildIntegration) {
      configTable.push(
        ['Build Integration', ui.badge('Enabled', 'success')],
        ['Build Command', config.buildCommand],
        ['Build Output', config.buildOutputDir]
      );
    } else {
      configTable.push(['Build Integration', ui.badge('Disabled', 'normal')]);
    }
    
    console.log(configTable.toString());
    
    // Validate the config
    const validationErrors = configManager.validateConfig(config);
    
    if (validationErrors.length === 0) {
      console.log(ui.success('Configuration validation: All settings are valid'));
    } else {
      console.log(ui.warning('Configuration validation: Issues detected'));
      validationErrors.forEach(error => console.log(ui.warning(`  • ${error}`)));
    }
    
    // Show next steps
    console.log('');
    ui.subsectionHeader('Next Steps');
    
    const nextStepsText = `
To deploy your website:
${ui.command('dreamhost deploy')}

To test deployment without uploading files:
${ui.command('dreamhost deploy --dry-run')}

To set up SSH key authentication:
${ui.command('dreamhost ssh-setup')}`;

    const nextStepsBox = ui.box(nextStepsText, { title: 'What\'s Next', padding: 1 });
    console.log(nextStepsBox);
    
    return config;
  } catch (error) {
    console.error(ui.error(`Setup error: ${error.message}`));
    throw error;
  }
}

module.exports = {
  runSetup
}; 