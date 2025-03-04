#!/usr/bin/env node

const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

console.log(chalk.green('DreamHost Deployer - Test'));
console.log(chalk.blue('Checking package configuration...'));

// Check if package.json exists
if (fs.existsSync(path.join(__dirname, 'package.json'))) {
    console.log(chalk.green('✓ package.json found'));
} else {
    console.log(chalk.red('✗ package.json not found'));
}

// Check if bin directory exists
if (fs.existsSync(path.join(__dirname, 'bin'))) {
    console.log(chalk.green('✓ bin directory found'));
} else {
    console.log(chalk.red('✗ bin directory not found'));
}

// Check if CLI file exists
if (fs.existsSync(path.join(__dirname, 'bin', 'cli.js'))) {
    console.log(chalk.green('✓ CLI file found'));
} else {
    console.log(chalk.red('✗ CLI file not found'));
}

// Check if templates directory exists
if (fs.existsSync(path.join(__dirname, 'templates'))) {
    console.log(chalk.green('✓ templates directory found'));
} else {
    console.log(chalk.red('✗ templates directory not found'));
}

// Check if template file exists
if (fs.existsSync(path.join(__dirname, 'templates', 'deploy.config.template.json'))) {
    console.log(chalk.green('✓ template file found'));
} else {
    console.log(chalk.red('✗ template file not found'));
}

console.log(chalk.blue('All tests completed.')); 