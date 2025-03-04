/**
 * Server environment check utility
 * Checks if the DreamHost server has the required NVM and Node.js versions
 */

const { execSync } = require('child_process');
const chalk = require('chalk');
const inquirer = require('inquirer');
const setupNode = require('../commands/setup-node');

// Recommended versions
const RECOMMENDED_NVM_VERSION = '0.40.1';
const RECOMMENDED_NODE_VERSION = '20.18.0';

/**
 * Check if NVM and Node.js are installed on the server
 * @param {Object} config - Configuration object with SSH details
 * @returns {Promise<boolean>} - True if setup is needed, false if everything is OK
 */
async function checkServerEnvironment(config) {
    console.log(chalk.blue('\n🔍 Checking server environment...'));
    
    try {
        // Build SSH command base
        const sshBase = `ssh ${config.username}@${config.host}`;
        
        // Check if NVM is installed
        console.log(chalk.cyan('Checking for NVM installation...'));
        let nvmInstalled = false;
        let nvmVersion = '';
        
        try {
            const nvmOutput = execSync(`${sshBase} "source ~/.nvm/nvm.sh && nvm --version"`, { stdio: 'pipe' }).toString().trim();
            nvmInstalled = true;
            nvmVersion = nvmOutput;
            console.log(chalk.green(`✅ NVM is installed (version ${nvmVersion})`));
        } catch (error) {
            console.log(chalk.yellow('⚠️ NVM is not installed or not properly configured'));
            return true; // Setup needed
        }
        
        // Check if Node.js is installed
        console.log(chalk.cyan('Checking for Node.js installation...'));
        let nodeInstalled = false;
        let nodeVersion = '';
        
        try {
            const nodeOutput = execSync(`${sshBase} "source ~/.nvm/nvm.sh && node --version"`, { stdio: 'pipe' }).toString().trim();
            nodeInstalled = true;
            nodeVersion = nodeOutput.replace('v', '');
            console.log(chalk.green(`✅ Node.js is installed (version ${nodeOutput})`));
        } catch (error) {
            console.log(chalk.yellow('⚠️ Node.js is not installed or not properly configured'));
            return true; // Setup needed
        }
        
        // Check if versions meet recommendations
        const nvmNeedsUpdate = compareVersions(nvmVersion, RECOMMENDED_NVM_VERSION) < 0;
        const nodeNeedsUpdate = compareVersions(nodeVersion, RECOMMENDED_NODE_VERSION) < 0;
        
        if (nvmNeedsUpdate) {
            console.log(chalk.yellow(`⚠️ NVM version ${nvmVersion} is older than recommended version ${RECOMMENDED_NVM_VERSION}`));
        }
        
        if (nodeNeedsUpdate) {
            console.log(chalk.yellow(`⚠️ Node.js version ${nodeVersion} is older than recommended version ${RECOMMENDED_NODE_VERSION}`));
        }
        
        // If either needs update, suggest setup
        if (nvmNeedsUpdate || nodeNeedsUpdate) {
            return true; // Setup needed
        }
        
        console.log(chalk.green('✅ Server environment is properly configured'));
        return false; // No setup needed
        
    } catch (error) {
        console.error(chalk.red(`❌ Error checking server environment: ${error.message}`));
        return true; // Assume setup is needed due to error
    }
}

/**
 * Compare two version strings
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} - -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1Part = v1Parts[i] || 0;
        const v2Part = v2Parts[i] || 0;
        
        if (v1Part < v2Part) return -1;
        if (v1Part > v2Part) return 1;
    }
    
    return 0;
}

/**
 * Check server environment and offer to set up if needed
 * @param {Object} config - Configuration object with SSH details
 */
async function checkAndSetupServerIfNeeded(config) {
    const setupNeeded = await checkServerEnvironment(config);
    
    if (setupNeeded) {
        const { shouldSetup } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'shouldSetup',
                message: 'Would you like to set up NVM and Node.js on your DreamHost server now?',
                default: true
            }
        ]);
        
        if (shouldSetup) {
            await setupNode.run(config);
        } else {
            console.log(chalk.yellow('\n⚠️ Skipping server setup. You can run it later with:'));
            console.log(chalk.cyan('dreamhost-deployer setup-node'));
        }
    }
}

module.exports = {
    checkServerEnvironment,
    checkAndSetupServerIfNeeded,
    RECOMMENDED_NVM_VERSION,
    RECOMMENDED_NODE_VERSION
}; 