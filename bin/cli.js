#!/usr/bin/env node

/**
 * DreamHost Deployer CLI
 * Version 0.5.6 - Enhanced for Vite projects with build integration
 * 
 * Features:
 * - Simple deployment to DreamHost via SSH/SCP
 * - Interactive CLI menu
 * - Server environment checks
 * - Build integration for modern frameworks
 * - Optimized for Vite projects
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
    
    const choices = [
      {
        name: '🚀 Deploy website to DreamHost',
        value: 'deploy',
        description: 'Deploy your website files to DreamHost server'
      },
      {
        name: '🔨 Run build process only',
        value: 'build',
        description: 'Build your project without deploying'
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
        name: '❓ About DreamHost Deployer',
        value: 'about',
        description: 'Show information about this tool'
      },
      {
        name: '📋 Project-specific settings',
        value: 'project-settings',
        description: 'Configure build settings for Vite and other frameworks'
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
        choices: choices.map(choice => ({
          name: `${choice.name} - ${choice.description}`,
          value: choice.value
        }))
      }
    ]);
    
    switch (action) {
      case 'deploy':
        deploy.deploy();
        break;
      case 'build':
        try {
          console.log(chalk.blue('🔨 Running build process...'));
          await deploy.runBuildOnly();
        } catch (error) {
          console.error(chalk.red(`Error: ${error.message}`));
        }
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
      case 'project-settings':
        try {
          // Show project-specific settings menu
          const { projectType } = await inquirer.prompt([
            {
              type: 'list',
              name: 'projectType',
              message: 'What type of project are you working with?',
              choices: [
                { name: 'Vite (React, Vue, Svelte, etc.)', value: 'vite' },
                { name: 'Create React App (CRA)', value: 'cra' },
                { name: 'Next.js', value: 'nextjs' },
                { name: 'Other/Manual configuration', value: 'other' }
              ]
            }
          ]);
          
          // Handle different project types
          switch (projectType) {
            case 'vite':
              console.log(chalk.green('\n📦 Vite Project Settings'));
              console.log(chalk.cyan('For Vite projects, the deployer will:'));
              console.log(chalk.cyan('- Use "dist" as the default build output directory'));
              console.log(chalk.cyan('- Run "npm run build" as the default build command'));
              console.log(chalk.cyan('- Add Vite-specific exclusions for source files'));
              console.log(chalk.cyan('- Provide optimized error handling for Vite builds'));
              
              console.log(chalk.blue('\nℹ️ This will be applied when you run deploy.'));
              break;
              
            case 'cra':
            case 'nextjs':
            case 'other':
              console.log(chalk.yellow('\nℹ️ Configuration for this project type will be done during deployment.'));
              break;
          }
        } catch (error) {
          console.error(chalk.red(`Error: ${error.message}`));
        }
        break;
      case 'about':
        console.log(chalk.green('\n📦 DreamHost Deployer'));
        console.log(chalk.blue('Version: 0.5.6'));
        console.log(chalk.blue('A tool for deploying websites to DreamHost shared hosting.'));
        console.log(chalk.blue('Features:'));
        console.log(chalk.blue('- Simple deployment to DreamHost via SSH/SCP'));
        console.log(chalk.blue('- Interactive CLI menu'));
        console.log(chalk.blue('- Server environment checks'));
        console.log(chalk.blue('- Build integration for modern frameworks'));
        console.log(chalk.blue('- Special optimizations for Vite projects'));
        console.log(chalk.blue('- Target directory management'));
        console.log(chalk.blue('- SSH key setup and management'));
        break;
      case 'exit':
        console.log(chalk.blue('Goodbye! 👋'));
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