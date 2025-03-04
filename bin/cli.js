#!/usr/bin/env node

/**
 * DreamHost Deployer CLI
 * A command-line tool for deploying websites to DreamHost servers
 */

const path = require('path');
const { program } = require('commander');
const deploy = require('../deploy');
const setupSsh = require('../setup-ssh');
const pkg = require('../package.json');

// Set up the CLI program
program
  .name('dreamhost-deployer')
  .description('Deploy websites to DreamHost servers via SSH')
  .version(pkg.version);

// Deploy command
program
  .command('deploy')
  .description('Deploy your website to DreamHost')
  .option('-c, --config <path>', 'Path to config file', 'deploy.config.json')
  .action((options) => {
    const configPath = path.resolve(process.cwd(), options.config);
    deploy.runDeploy(configPath);
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

// Parse command line arguments
program.parse(process.argv);

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 