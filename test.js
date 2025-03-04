#!/usr/bin/env node

/**
 * DreamHost Deployer Test Script
 * This script verifies that the package is correctly set up
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.bold.blue('\n🧪 DreamHost Deployer Test Script\n'));

// Check for required files
const requiredFiles = [
    'deploy.js',
    'setup-ssh.js',
    'fix-ssh-key.js',
    'bin/cli.js',
    'package.json'
];

let allFilesExist = true;

console.log(chalk.cyan('Checking for required files:'));
for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
        console.log(chalk.green(`✅ ${file} exists`));
    } else {
        console.log(chalk.red(`❌ ${file} does not exist`));
        allFilesExist = false;
    }
}

// Check package.json
const pkg = require('./package.json');
console.log(chalk.cyan('\nPackage information:'));
console.log(chalk.cyan(`  • Name: ${chalk.white(pkg.name)}`));
console.log(chalk.cyan(`  • Version: ${chalk.white(pkg.version)}`));
console.log(chalk.cyan(`  • Description: ${chalk.white(pkg.description)}`));

// Check dependencies
console.log(chalk.cyan('\nChecking dependencies:'));
const requiredDeps = ['chalk', 'commander', 'inquirer', 'minimatch', 'ssh2'];
let allDepsExist = true;

for (const dep of requiredDeps) {
    if (pkg.dependencies && pkg.dependencies[dep]) {
        console.log(chalk.green(`✅ ${dep} (${pkg.dependencies[dep]})`));
    } else {
        console.log(chalk.red(`❌ ${dep} is missing`));
        allDepsExist = false;
    }
}

// Check bin entry
console.log(chalk.cyan('\nChecking bin entry:'));
if (pkg.bin && pkg.bin['dreamhost-deployer']) {
    console.log(chalk.green(`✅ bin entry exists: ${pkg.bin['dreamhost-deployer']}`));
} else {
    console.log(chalk.red('❌ bin entry is missing'));
}

// Final result
console.log('\n');
if (allFilesExist && allDepsExist && pkg.bin && pkg.bin['dreamhost-deployer']) {
    console.log(chalk.green.bold('✅ All tests passed! The package is ready for publishing.'));
} else {
    console.log(chalk.red.bold('❌ Some tests failed. Please fix the issues before publishing.'));
}
console.log('\n'); 