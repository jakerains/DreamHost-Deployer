#!/usr/bin/env node

/**
 * DreamHost Deployer CLI
 * A command-line tool for deploying websites to DreamHost servers
 * Version 0.4.4 - Simplified cross-platform deployment
 */

const path = require('path');
const { program } = require('commander');
const deploy = require('../deploy');
const setupSsh = require('../setup-ssh');
const setupNode = require('../src/commands/setup-node');
const fixSshKey = require('../fix-ssh-key');
const pkg = require('../package.json');

// Set up the CLI program
program
  .name('dreamhost-deployer')
  .description('Deploy websites to DreamHost servers via SSH')
  .version(pkg.version);

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

// Parse command line arguments
program.parse(process.argv);

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 