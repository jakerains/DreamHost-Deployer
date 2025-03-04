#!/usr/bin/env node

/**
 * DreamHost Deployer CLI
 * A command-line tool for deploying websites to DreamHost servers
 * Version 0.5.0 - Enhanced CLI with interactive menu and updated Node.js versions
 */

const path = require('path');
const { program } = require('commander');
const deploy = require('../deploy');
const setupSsh = require('../setup-ssh');
const setupNode = require('../src/commands/setup-node');
const fixSshKey = require('../fix-ssh-key');
const { checkServerEnvironment } = require('../src/utils/server-check');
const fs = require('fs');
const pkg = require('../package.json');
const inquirer = require('inquirer');
const chalk = require('chalk');

// Set up the CLI program
program
  .name('dreamhost-deployer')
  .description('Deploy websites to DreamHost servers via SSH')
  .version(pkg.version);

// Main menu command (default when no arguments provided)
program
  .command('menu', { isDefault: true })
  .description('Show interactive menu of available commands')
  .action(async () => {
    console.log(chalk.blue.bold(`\n🚀 DreamHost Deployer v${pkg.version}\n`));
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🔧 Initialize configuration', value: 'init' },
          { name: '🔑 Setup SSH connection', value: 'setup-ssh' },
          { name: '🔍 Check server environment', value: 'check-server' },
          { name: '📦 Setup Node.js on server', value: 'setup-node' },
          { name: '🚀 Deploy website', value: 'deploy' },
          { name: '🔄 Fix SSH key issues', value: 'fix-ssh-key' },
          { name: '❓ Show help', value: 'help' },
          { name: '❌ Exit', value: 'exit' }
        ]
      }
    ]);
    
    switch (action) {
      case 'init':
        setupSsh.initConfig();
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
      case 'deploy':
        deploy.deploy();
        break;
      case 'fix-ssh-key':
        fixSshKey.run();
        break;
      case 'help':
        program.outputHelp();
        break;
      case 'exit':
        console.log(chalk.green('Goodbye! 👋'));
        process.exit(0);
        break;
    }
  });

// Deploy command
program
  .command('deploy')
  .description('Deploy your website to DreamHost using native SSH/SCP')
  .action(() => {
    deploy.deploy();
  });

// Setup SSH command
program
  .command('setup-ssh')
  .description('Set up SSH configuration for deployment')
  .action(() => {
    setupSsh.run();
  });

// Initialize command
program
  .command('init')
  .description('Initialize a new deployment configuration')
  .action(() => {
    setupSsh.initConfig();
  });

// Setup Node.js command
program
  .command('setup-node')
  .description('Set up NVM and Node.js on your DreamHost server')
  .action(() => {
    setupNode.run();
  });

// Fix SSH Key command
program
  .command('fix-ssh-key')
  .description('Fix SSH key issues by switching to Ed25519 keys')
  .action(() => {
    fixSshKey.run();
  });

// Check server environment command
program
  .command('check-server')
  .description('Check if your DreamHost server has the required NVM and Node.js versions')
  .action(async () => {
    await checkServerCmd();
  });

// Helper function for check-server command
async function checkServerCmd() {
  try {
    // Load configuration
    const configPath = path.resolve(process.cwd(), 'deploy.config.json');
    
    if (!fs.existsSync(configPath)) {
      console.error(chalk.red('❌ Configuration file not found!'));
      console.log(chalk.yellow('Please run \'dreamhost-deployer init\' to create a configuration file.'));
      process.exit(1);
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log(chalk.blue.bold('\n🔍 Checking Server Environment\n'));
    console.log(chalk.cyan('Current configuration:'));
    console.log(chalk.cyan(`  • Host: ${chalk.white(config.host)}`));
    console.log(chalk.cyan(`  • Username: ${chalk.white(config.username)}`));
    console.log(chalk.cyan(`  • Web Server: ${chalk.white(config.webServer || 'Apache (default)')}\n`));
    
    console.log(chalk.yellow('This will check for:'));
    console.log(chalk.yellow('  • SSH connectivity'));
    console.log(chalk.yellow('  • NVM installation (recommended version: 0.40.1)'));
    console.log(chalk.yellow('  • Node.js installation (recommended version: 22.14.0 LTS)'));
    console.log(chalk.yellow('  • Server configuration for web hosting\n'));
    
    const setupNeeded = await checkServerEnvironment(config);
    
    if (!setupNeeded) {
      console.log(chalk.green.bold('\n✅ Your server environment is properly configured!\n'));
      
      // Ask if user wants to deploy now
      const { deployNow } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'deployNow',
          message: 'Would you like to deploy your website now?',
          default: true
        }
      ]);
      
      if (deployNow) {
        deploy.deploy();
      }
    } else {
      console.log(chalk.yellow.bold('\n⚠️ Your server environment needs setup.\n'));
      
      // Ask if user wants to set up Node.js now
      const { setupNow } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'setupNow',
          message: 'Would you like to set up NVM and Node.js on your server now?',
          default: true
        }
      ]);
      
      if (setupNow) {
        setupNode.run();
      } else {
        console.log(chalk.cyan('\nYou can run \'dreamhost-deployer setup-node\' later to set up NVM and Node.js.'));
      }
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error checking server environment: ${error.message}`));
    process.exit(1);
  }
}

// Parse command line arguments
program.parse(process.argv);

// If no arguments, show menu (handled by default command) 