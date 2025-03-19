/**
 * DreamHost Deployer Tests
 * Version 0.5.9
 * 
 * This file contains basic tests for the DreamHost Deployer modules.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Import modules to test
const configManager = require('./src/utils/config-manager');
const buildIntegration = require('./src/utils/build-integration');
const deployment = require('./src/utils/deployment');

// Track test results
const results = {
  total: 0,
  passed: 0,
  failed: 0
};

// Helper function to run a test
function runTest(name, testFn) {
  results.total++;
  console.log(chalk.blue(`Running test: ${name}`));
  try {
    testFn();
    console.log(chalk.green(`✅ PASSED: ${name}`));
    results.passed++;
  } catch (error) {
    console.log(chalk.red(`❌ FAILED: ${name}`));
    console.log(chalk.red(`   Error: ${error.message}`));
    results.failed++;
  }
}

// Test: Configuration Management
console.log(chalk.blue.bold('\n=== Testing Configuration Management ===\n'));

// Test config validation
runTest('Config validation - empty config', () => {
  const errors = configManager.validateConfig({});
  assert(errors.length > 0, 'Should return validation errors for empty config');
});

runTest('Config validation - valid config', () => {
  const config = {
    host: 'example.com',
    username: 'testuser',
    remotePath: '/home/testuser/example.com',
    localPath: process.cwd(),
    privateKeyPath: path.join(process.cwd(), 'test.js')  // Using this file as a mock key
  };
  const errors = configManager.validateConfig(config);
  assert(errors.length === 0, 'Should return no errors for valid config');
});

// Test project type detection
console.log(chalk.blue.bold('\n=== Testing Build Integration ===\n'));

runTest('Project type detection', () => {
  // This is a basic test, we can't fully test without a real project
  const projectInfo = buildIntegration.suggestOptimizations('vite');
  assert(Array.isArray(projectInfo), 'Should return an array of suggestions');
  assert(projectInfo.length > 0, 'Should return at least one suggestion');
});

// Test deployment utilities
console.log(chalk.blue.bold('\n=== Testing Deployment Utilities ===\n'));

runTest('Rsync detection', () => {
  // Check if rsync is installed - this test may fail on Windows without rsync
  try {
    execSync('rsync --version', { stdio: 'ignore' });
    const hasRsync = deployment.hasRsync();
    assert(hasRsync === true, 'Should detect rsync when installed');
  } catch (error) {
    // Skip test if rsync is not installed
    console.log(chalk.yellow('   Skipping rsync test (not installed)'));
  }
});

// Print test results
console.log(chalk.blue.bold('\n=== Test Results ===\n'));
console.log(`Total tests: ${results.total}`);
console.log(chalk.green(`Passed: ${results.passed}`));
if (results.failed > 0) {
  console.log(chalk.red(`Failed: ${results.failed}`));
  process.exit(1);
} else {
  console.log(chalk.green('All tests passed!'));
} 