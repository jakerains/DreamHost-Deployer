#!/usr/bin/env node

/**
 * DreamHost Deployer
 * Version 0.6.2
 * 
 * Command-line interface with a stylish interactive UI
 * 
 * Features:
 * - Stylish interactive terminal interface
 * - Simple deployment to DreamHost via SSH/SCP
 * - Server environment checks
 * - Build integration for modern frameworks
 * - Dry run mode to preview deployments
 * - Automatic rollback for failed deployments
 * - Progress bars for large deployments
 */

const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const pkg = require('../package.json');

// Custom version display function
function displayVersion() {
  // Simple ASCII art using border characters
  const border = '━'.repeat(40);
  const emptyLine = '┃' + ' '.repeat(38) + '┃';
  
  // Create version box with manual ASCII art
  console.log(chalk.cyan('┏' + border + '┓'));
  console.log(chalk.cyan('┃' + ' '.repeat(38) + '┃'));
  console.log(chalk.cyan('┃') + chalk.bold.cyan(`   DreamHost Deployer v${pkg.version}`) + ' '.repeat(15 - pkg.version.length) + chalk.cyan('┃'));
  console.log(chalk.cyan('┃' + ' '.repeat(38) + '┃'));
  console.log(chalk.cyan('┗' + border + '┛'));
  console.log();
  
  // ASCII art of bear character holding sign
  console.log('       \\');
  console.log('        \\');
  console.log('         \\');
  console.log('  ' + chalk.green('ʕ•ᴥ•ʔ') + '   ' + chalk.bold.blue('~ DreamHost Deployer ~'));
  console.log('  ' + chalk.blue('|') + ' ' + chalk.yellow('\\o/'));
  console.log('  ' + chalk.blue('|') + '  ' + chalk.yellow('|'));
  console.log(' ' + chalk.blue('/') + ' ' + chalk.blue('\\') + ' ' + chalk.yellow('/') + ' ' + chalk.yellow('\\'));
  console.log();
  
  // Additional info
  console.log(chalk.blue('✧ A stylish CLI tool for deploying websites to DreamHost ✧'));
  console.log(chalk.underline.blue('https://github.com/jakerains/dreamhost-deployer'));
  
  process.exit(0);
}

// Check if version flag is passed
if (process.argv.includes('-v') || process.argv.includes('--version') || process.argv.includes('version')) {
  displayVersion();
}

// Import remaining modules after version check
const deploy = require('../deploy');
const setupSsh = require('../setup-ssh');
const setupNode = require('../src/commands/setup-node');
const fixSshKey = require('../fix-ssh-key');
const { checkServerEnvironment } = require('../src/utils/server-check');
const buildIntegration = require('../src/utils/build-integration');
const ui = require('../src/utils/ui');
const inquirer = require('inquirer');

// Set up the CLI program
program
  .name('dreamhost-deployer')
  .description('Deploy websites to DreamHost servers via SSH')
  .version(pkg.version, '-v, --version', 'Display fancy version information');

// Add dedicated version command that uses our fancy version display
program
  .command('version')
  .description('Display fancy version information')
  .action(displayVersion);
  
// Initialize command - sets up project for deployment
program
  .command('init')
  .description('Initialize project for DreamHost deployment')
  .action(() => {
    const initCommand = require('../src/commands/init-command');
    initCommand.run();
  });

// Main menu command (default when no arguments provided)
program
  .command('menu', { isDefault: true })
  .description('Show interactive menu of available commands')
  .action(async () => {
    ui.showAppHeader();
    
    // Create emoji-filled, categorized menu
    const choices = [
      {
        name: 'DEPLOYMENT',
        type: 'separator'
      },
      {
        name: '🚀 Deploy website to DreamHost',
        value: 'deploy',
        description: 'Deploy your website files to DreamHost server'
      },
      {
        name: '🔍 Dry run (preview deployment)',
        value: 'dry-run',
        description: 'Preview what files would be deployed without making changes'
      },
      {
        name: '🔨 Run build process only',
        value: 'build',
        description: 'Build your project without deploying'
      },
      {
        name: 'CONFIGURATION',
        type: 'separator'
      },
      {
        name: '🚀 Initialize project',
        value: 'init',
        description: 'Set up a new project for DreamHost deployment'
      },
      {
        name: '📋 Project-specific settings',
        value: 'project-settings',
        description: 'Configure build settings for various frameworks'
      },
      {
        name: 'SERVER SETUP',
        type: 'separator'
      },
      {
        name: '🔑 Setup SSH key authentication',
        value: 'setup-ssh',
        description: 'Generate and upload SSH keys to DreamHost'
      },
      {
        name: '🔧 Fix SSH key permissions',
        value: 'fix-ssh-key',
        description: 'Fix common SSH key permission issues'
      },
      {
        name: '🔍 Check server environment',
        value: 'check-server',
        description: 'Check Node.js and NVM on your DreamHost server'
      },
      {
        name: '📦 Setup Node.js on server',
        value: 'setup-node',
        description: 'Install Node.js and NVM on your DreamHost server'
      },
      {
        name: 'INFORMATION',
        type: 'separator'
      },
      {
        name: '❓ About DreamHost Deployer',
        value: 'about',
        description: 'Show information about this tool'
      },
      {
        name: '📑 Show documentation',
        value: 'docs',
        description: 'Display helpful documentation and links'
      },
      {
        name: '❌ Exit',
        value: 'exit',
        description: 'Exit the program'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        loop: false,
        pageSize: choices.length,
        choices: choices.map(choice => {
          if (choice.type === 'separator') {
            return new inquirer.Separator(`\n${choice.name}\n`);
          }
          return {
            name: `${choice.name.padEnd(35)} ${choice.description}`,
            value: choice.value
          };
        })
      }
    ]);
    
    // Add a short delay for visual effect
    const actionSpinner = ui.spinner('Loading action...');
    actionSpinner.start();
    await new Promise(resolve => setTimeout(resolve, 800));
    actionSpinner.stop();
    
    switch (action) {
      case 'deploy':
        deploy.deploy({ dryRun: false, rollbackEnabled: true });
        break;
      case 'dry-run':
        deploy.deploy({ dryRun: true, rollbackEnabled: false });
        break;
      case 'build':
        try {
          const buildSpinner = ui.spinner('Preparing build process...');
          buildSpinner.start();
          await new Promise(resolve => setTimeout(resolve, 1000));
          buildSpinner.stop();
          
          console.log(ui.info('Running build process...'));
          await deploy.runBuildOnly();
        } catch (error) {
          console.error(ui.error(`Build failed: ${error.message}`));
        }
        break;
      case 'init':
        const initCommand = require('../src/commands/init-command');
        await initCommand.run();
        break;
      case 'setup-ssh':
        setupSsh.run();
        break;
      case 'check-server':
        await checkServerCmd();
        break;
      case 'setup-node':
        setupNode.run();
        break;
      case 'fix-ssh-key':
        fixSshKey.run();
        break;
      case 'about':
        showAbout();
        break;
      case 'docs':
        showDocs();
        break;
      case 'project-settings':
        await showProjectSettings();
        break;
      case 'exit':
        const exitSpinner = ui.spinner('Exiting...');
        exitSpinner.start();
        await new Promise(resolve => setTimeout(resolve, 1000));
        exitSpinner.stop();
        console.log(ui.success('Thanks for using DreamHost Deployer! 👋'));
        process.exit(0);
        break;
    }
  });

// Deploy command
program
  .command('deploy')
  .description('Deploy your website to DreamHost')
  .option('-c, --config <path>', 'Path to config file')
  .option('-d, --dry-run', 'Perform a dry run (preview deployment)')
  .option('--no-rollback', 'Disable automatic rollback on failure')
  .action((options) => {
    deploy.deploy({
      configPath: options.config,
      dryRun: options.dryRun || false,
      rollbackEnabled: options.rollback !== false
    });
  });

// Build only command
program
  .command('build')
  .description('Run the build process without deploying')
  .action(async () => {
    try {
      console.log(ui.info('Running build process...'));
      await deploy.runBuildOnly();
    } catch (error) {
      console.error(ui.error(`Build failed: ${error.message}`));
    }
  });

// Setup SSH command
program
  .command('setup-ssh')
  .description('Setup SSH key authentication for DreamHost')
  .action(() => {
    setupSsh.run();
  });

// Fix SSH key command
program
  .command('fix-ssh-key')
  .description('Fix SSH key permissions')
  .action(() => {
    fixSshKey.run();
  });

// Server check command
program
  .command('check-server')
  .description('Check Node.js environment on DreamHost server')
  .action(async () => {
    await checkServerCmd();
  });

// Setup Node command
program
  .command('setup-node')
  .description('Setup Node.js on DreamHost server')
  .action(() => {
    setupNode.run();
  });

// Project settings command
program
  .command('project-settings')
  .description('Configure project-specific settings')
  .action(async () => {
    await showProjectSettings();
  });

// Helper function for check server command
async function checkServerCmd() {
  ui.sectionHeader('SERVER ENVIRONMENT CHECK');
  
  // Load config to get server details
  const configPath = path.join(process.cwd(), 'deploy.config.json');
  
  if (!fs.existsSync(configPath)) {
    console.log(ui.warning('No configuration file found. Please create one first.'));
    return;
  }
  
  try {
    const checkSpinner = ui.spinner('Checking server environment...');
    checkSpinner.start();
    await new Promise(resolve => setTimeout(resolve, 1000));
    checkSpinner.stop();
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    await checkServerEnvironment(config);
  } catch (error) {
    console.error(ui.error(`Error checking server: ${error.message}`));
  }
}

// Helper function to show project settings menu
async function showProjectSettings() {
  ui.sectionHeader('PROJECT SETTINGS');
  
  try {
    const detectSpinner = ui.spinner('Detecting project type...');
    detectSpinner.start();
    await new Promise(resolve => setTimeout(resolve, 1500));
    detectSpinner.stop();
    
    const projectInfo = buildIntegration.detectProjectType();
    
    if (projectInfo.type !== 'unknown') {
      console.log('\n' + ui.info(`${projectInfo.details}`));
      console.log(ui.projectTypeBadge(projectInfo.type));
      
      // Create a table for settings
      const table = ui.createTable(['Setting', 'Value']);
      table.push(
        ['Build Command', projectInfo.buildCommand || 'N/A'],
        ['Output Directory', projectInfo.outputDir || 'N/A']
      );
      console.log('\n' + table.toString());
      
      // Show exclusions
      if (projectInfo.exclude && projectInfo.exclude.length > 0) {
        console.log('\n' + ui.collapsibleSection('Excluded Files/Directories', 
          projectInfo.exclude.map(item => `• ${item}`).join('\n')));
      }
      
      // Show optimization tips
      const suggestions = buildIntegration.suggestOptimizations(projectInfo.type);
      console.log('\n' + ui.collapsibleSection('Optimization Tips', 
        suggestions.join('\n')));
      
      const { applySettings } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'applySettings',
          message: 'Would you like to apply these settings to your configuration?',
          default: true
        }
      ]);
      
      if (applySettings) {
        const configSpinner = ui.spinner('Applying configuration settings...');
        configSpinner.start();
        await new Promise(resolve => setTimeout(resolve, 1000));
        configSpinner.stop();
        
        // Load or create config
        const configManager = require('../src/utils/config-manager');
        const configPath = path.join(process.cwd(), 'deploy.config.json');
        let config = configManager.loadConfig(configPath);
        
        if (!config) {
          console.log(ui.info('Creating new configuration file...'));
          config = await configManager.createConfig(configPath, projectInfo.type === 'vite');
        }
        
        // Update with detected settings
        config.buildIntegration = true;
        config.buildCommand = projectInfo.buildCommand;
        config.buildOutputDir = projectInfo.outputDir;
        config.exclude = projectInfo.exclude;
        
        // Save updated config
        configManager.saveConfig(config, configPath);
        console.log(ui.success('Configuration updated with project-specific settings'));
      }
    } else {
      console.log(ui.warning('Could not automatically detect project type.'));
      console.log(ui.info('Please configure your build settings manually.'));
      
      // Prompt for manual configuration
      const { setupManually } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'setupManually',
          message: 'Would you like to set up build integration manually?',
          default: true
        }
      ]);
      
      if (setupManually) {
        const configManager = require('../src/utils/config-manager');
        const configPath = path.join(process.cwd(), 'deploy.config.json');
        await configManager.createConfig(configPath, false);
      }
    }
  } catch (error) {
    console.error(ui.error(`Error: ${error.message}`));
  }
}

// Helper function to show about information
function showAbout() {
  ui.sectionHeader('ABOUT DREAMHOST DEPLOYER');
  
  console.log(ui.info(`Version: ${pkg.version}`));
  console.log(ui.info('A stylish CLI tool for deploying websites to DreamHost servers via SSH'));
  console.log(ui.link('GitHub Repository', 'https://github.com/jakerains/dreamhost-deployer'));
  console.log(ui.info('Author: jakerains'));
  console.log(ui.info('License: MIT'));
  
  // Create feature table
  const featureTable = ui.createTable(['Feature', 'Description']);
  featureTable.push(
    ['Easy Deployment', 'Deploy to DreamHost with a single command'],
    ['SSH Key Management', 'Set up and manage SSH keys for secure deployments'],
    ['Build Integration', 'Automatic build process for modern frameworks'],
    ['Dry Run Mode', 'Preview deployments without making changes'],
    ['Automatic Rollback', 'Revert to previous version if deployment fails'],
    ['Progress Tracking', 'Visual progress bars for large deployments'],
    ['Server Configuration', 'Set up Node.js and other requirements on your server'],
    ['Framework Detection', 'Automatically detect and optimize for your project type']
  );
  
  console.log('\n' + featureTable.toString());
  
  // Show supported frameworks
  console.log('\n' + ui.collapsibleSection('Supported Frameworks', [
    ui.projectTypeBadge('vite') + ' Vite (React, Vue, Svelte, etc.)',
    ui.projectTypeBadge('react') + ' Create React App',
    ui.projectTypeBadge('nextjs') + ' Next.js',
    ui.projectTypeBadge('gatsby') + ' Gatsby',
    ui.projectTypeBadge('nuxt') + ' Nuxt.js',
    ui.projectTypeBadge('vue-cli') + ' Vue CLI',
    ui.projectTypeBadge('svelte') + ' SvelteKit',
    ui.projectTypeBadge('angular') + ' Angular'
  ].join('\n')));
}

// Helper function to show documentation
function showDocs() {
  ui.sectionHeader('DOCUMENTATION');
  
  // Quick start guide
  console.log(ui.collapsibleSection('Quick Start', `
1. Initialize project (sets up config and tests connection):
   ${ui.codeBlock('dreamhost-deployer init')}

2. If SSH setup wasn't completed during init:
   ${ui.codeBlock('dreamhost-deployer setup-ssh')}

3. Deploy your website:
   ${ui.codeBlock('dreamhost-deployer deploy')}
  `));
  
  // Common commands
  console.log(ui.collapsibleSection('Common Commands', `
• Initialize project:
  ${ui.codeBlock('dreamhost-deployer init')}

• Deploy website:
  ${ui.codeBlock('dreamhost-deployer deploy')}

• Preview deployment (dry run):
  ${ui.codeBlock('dreamhost-deployer deploy --dry-run')}

• Build without deploying:
  ${ui.codeBlock('dreamhost-deployer build')}

• Configure project settings:
  ${ui.codeBlock('dreamhost-deployer project-settings')}
  `));
  
  // Helpful links
  console.log(ui.collapsibleSection('Helpful Links', [
    ui.link('DreamHost SSH Guide', 'https://help.dreamhost.com/hc/en-us/articles/216041267-SSH-overview'),
    ui.link('DreamHost Node.js Guide', 'https://help.dreamhost.com/hc/en-us/articles/360029083351-Installing-a-custom-version-of-NVM-and-Node-js'),
    ui.link('Deployer Documentation', 'https://github.com/jakerains/dreamhost-deployer/blob/main/README.md')
  ].join('\n')));
}

// Parse command line arguments
program.parse(process.argv); 