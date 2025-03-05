/**
 * Server environment check utility
 * Checks if the DreamHost server has the required NVM and Node.js versions
 */

const { execSync } = require('child_process');
const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2'); // Add ssh2 client for cross-platform compatibility

// Recommended versions
const RECOMMENDED_NVM_VERSION = '0.40.1';
const RECOMMENDED_NODE_VERSION = '22.14.0';

/**
 * Check if NVM and Node.js are installed on the server
 * @param {Object} config - Configuration object with SSH details
 * @returns {Promise<boolean>} - True if setup is needed, false if everything is OK
 */
async function checkServerEnvironment(config) {
    console.log(chalk.blue('\n🔍 Checking server environment...'));
    
    try {
        // Verify SSH connectivity first
        if (!await verifySSHConnection(config)) {
            console.log(chalk.yellow('⚠️ Cannot proceed with server environment check due to SSH connection issues.'));
            return true; // Setup needed, but will be handled by verifySSHConnection
        }
        
        // Create SSH connection for all checks
        const conn = new Client();
        
        // Set up authentication
        let authConfig = {
            host: config.host,
            username: config.username,
            readyTimeout: 30000
        };
        
        // Add password if available
        if (config.password) {
            authConfig.password = config.password;
        }
        // Add private key if available
        else if (config.privateKeyPath && fs.existsSync(config.privateKeyPath)) {
            try {
                authConfig.privateKey = fs.readFileSync(config.privateKeyPath);
            } catch (err) {
                console.log(chalk.yellow(`⚠️ Could not read private key: ${err.message}`));
                return true; // Setup needed due to authentication issues
            }
        }
        
        // Connect to the server
        try {
            await new Promise((resolve, reject) => {
                conn.on('ready', () => {
                    resolve();
                }).on('error', (err) => {
                    reject(err);
                }).connect(authConfig);
            });
        } catch (error) {
            console.error(chalk.red(`❌ Failed to connect to server: ${error.message}`));
            return true; // Setup needed due to connection issues
        }
        
        // Helper function to execute commands over SSH
        const executeCommand = async (command) => {
            return new Promise((resolve, reject) => {
                conn.exec(command, (err, stream) => {
                    if (err) return reject(err);
                    
                    let output = '';
                    stream.on('close', () => {
                        resolve(output);
                    }).on('data', (data) => {
                        output += data.toString();
                    }).stderr.on('data', (data) => {
                        output += data.toString();
                    });
                });
            });
        };
        
        // Check if NVM is installed
        console.log(chalk.cyan('Checking for NVM installation...'));
        let nvmInstalled = false;
        let nvmVersion = '';
        
        try {
            const nvmOutput = await executeCommand('source ~/.nvm/nvm.sh 2>/dev/null && nvm --version');
            nvmVersion = nvmOutput.trim();
            if (nvmVersion) {
                nvmInstalled = true;
                console.log(chalk.green(`✅ NVM is installed (version ${nvmVersion})`));
            } else {
                console.log(chalk.yellow('⚠️ NVM is not installed or not properly configured'));
                conn.end(); // Close the connection
                return true; // Setup needed
            }
        } catch (error) {
            console.log(chalk.yellow('⚠️ NVM is not installed or not properly configured'));
            conn.end(); // Close the connection
            return true; // Setup needed
        }
        
        // Check if Node.js is installed
        console.log(chalk.cyan('Checking for Node.js installation...'));
        let nodeInstalled = false;
        let nodeVersion = '';
        
        try {
            const nodeOutput = await executeCommand('source ~/.nvm/nvm.sh 2>/dev/null && node --version');
            const trimmedOutput = nodeOutput.trim();
            if (trimmedOutput) {
                nodeInstalled = true;
                nodeVersion = trimmedOutput.replace('v', '');
                console.log(chalk.green(`✅ Node.js is installed (version ${trimmedOutput})`));
            } else {
                console.log(chalk.yellow('⚠️ Node.js is not installed or not properly configured'));
                conn.end(); // Close the connection
                return true; // Setup needed
            }
        } catch (error) {
            console.log(chalk.yellow('⚠️ Node.js is not installed or not properly configured'));
            conn.end(); // Close the connection
            return true; // Setup needed
        }
        
        // Close the SSH connection
        conn.end();
        
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
 * Verify SSH connection to the server
 * @param {Object} config - Configuration object with SSH details
 * @returns {Promise<boolean>} - True if connection is successful, false otherwise
 */
async function verifySSHConnection(config) {
    console.log(chalk.cyan('Verifying SSH connection...'));
    
    // Check if we have a password or need to ask for one
    let password = config.password;
    
    // Try SSH key authentication first using ssh2 library instead of command line
    try {
        console.log(chalk.cyan('Attempting SSH key authentication...'));
        
        // Try to connect using SSH key
        await new Promise((resolve, reject) => {
            const conn = new Client();
            
            let authConfig = {
                host: config.host,
                username: config.username,
                readyTimeout: 30000
            };
            
            // Add private key if available
            if (config.privateKeyPath && fs.existsSync(config.privateKeyPath)) {
                try {
                    authConfig.privateKey = fs.readFileSync(config.privateKeyPath);
                } catch (err) {
                    // If we can't read the key, just continue without it
                    console.log(chalk.yellow(`⚠️ Could not read private key: ${err.message}`));
                }
            }
            
            conn.on('ready', () => {
                console.log(chalk.green('✅ SSH key authentication successful'));
                conn.end();
                resolve(true);
            }).on('error', (err) => {
                reject(err);
            }).connect(authConfig);
        });
        
        return true;
    } catch (error) {
        console.log(chalk.yellow('⚠️ SSH key authentication failed. Trying password authentication...'));
        
        // If we don't have a password, ask for one
        if (!password) {
            const { sshPassword } = await inquirer.prompt([
                {
                    type: 'password',
                    name: 'sshPassword',
                    message: 'Enter your SSH password:',
                    mask: '*'
                }
            ]);
            password = sshPassword;
            
            // Ask if user wants to save the password
            const { savePassword } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'savePassword',
                    message: 'Would you like to save your password for future operations? (Not recommended for security reasons)',
                    default: false
                }
            ]);
            
            if (savePassword) {
                config.password = password;
                const configPath = path.resolve(process.cwd(), 'deploy.config.json');
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                console.log(chalk.green('✅ Password saved to configuration.'));
            }
        }
        
        // Try password authentication using ssh2 library
        try {
            console.log(chalk.cyan('Attempting password authentication...'));
            
            await new Promise((resolve, reject) => {
                const conn = new Client();
                
                conn.on('ready', () => {
                    console.log(chalk.green('✅ Password authentication successful'));
                    conn.end();
                    resolve(true);
                }).on('error', (err) => {
                    reject(err);
                }).connect({
                    host: config.host,
                    username: config.username,
                    password: password,
                    readyTimeout: 30000
                });
            });
            
            return true;
        } catch (error) {
            console.error(chalk.red(`❌ Password authentication failed: ${error.message}`));
            
            // Provide troubleshooting guidance
            console.log(chalk.yellow('\n⚠️ SSH Authentication Troubleshooting:'));
            console.log(chalk.cyan('1. Verify your username and host are correct'));
            console.log(chalk.cyan('2. Check if password authentication is enabled on the server'));
            console.log(chalk.cyan('3. Ensure your SSH key permissions are correct (if using key authentication)'));
            console.log(chalk.cyan('   - ~/.ssh directory: 700 (drwx------)'));
            console.log(chalk.cyan('   - SSH private key: 600 (-rw-------)'));
            console.log(chalk.cyan('   - SSH public key: 644 (-rw-r--r--)'));
            console.log(chalk.cyan('   - authorized_keys: 600 (-rw-------)'));
            console.log(chalk.cyan('4. Try connecting manually with verbose output:'));
            console.log(chalk.cyan(`   ssh -v ${config.username}@${config.host}`));
            
            return false;
        }
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
    // First verify SSH connection
    if (!await verifySSHConnection(config)) {
        console.log(chalk.yellow('\n⚠️ Cannot proceed with server environment check due to SSH connection issues.'));
        console.log(chalk.yellow('⚠️ Please fix SSH connection issues before continuing.'));
        return;
    }
    
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
            // Use dynamic require to avoid circular dependency
            const setupNode = require('../commands/setup-node');
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
    verifySSHConnection,
    RECOMMENDED_NVM_VERSION,
    RECOMMENDED_NODE_VERSION
}; 