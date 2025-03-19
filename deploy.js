/**
 * DreamHost Deployer
 * Version 0.5.9
 * 
 * This file is now a wrapper for the modular implementation.
 * All core functionality has been moved to the src/commands and src/utils directories.
 */

const deployCommand = require('./src/commands/deploy-command');

// Maintain the same exports for backward compatibility
module.exports = {
  deploy: deployCommand.deploy,
  runBuildOnly: deployCommand.runBuildOnly
}; 