/**
 * Server environment check utility
 * Checks if the DreamHost server has the required NVM and Node.js versions
 */

const { execSync } = require('child_process');
const chalk = require('chalk');
const inquirer = require('inquirer');
const setupNode = require('../commands/setup-node');
const fs = require('fs');
const path = require('path');

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
        
        // Build SSH command base
        const sshBase = `ssh ${config.username}@${config.host}`;
        
        // Check if NVM is installed
        console.log(chalk.cyan('Checking for NVM installation...'));
        let nvmInstalled = false;
        let nvmVersion = '';
        
        try {
            const nvmOutput = execSync(`${sshBase} "source ~/.nvm/nvm.sh 2>/dev/null && nvm --version"`, { stdio: 'pipe' }).toString().trim();
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
            const nodeOutput = execSync(`${sshBase} "source ~/.nvm/nvm.sh 2>/dev/null && node --version"`, { stdio: 'pipe' }).toString().trim();
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
 * Verify SSH connection to the server
 * @param {Object} config - Configuration object with SSH details
 * @returns {Promise<boolean>} - True if connection is successful, false otherwise
 */
async function verifySSHConnection(config) {
    console.log(chalk.cyan('Verifying SSH connection...'));
    
    // Check if we have a password or need to ask for one
    let password = config.password;
    let usePassword = false;
    
    // Try SSH key authentication first
    try {
        console.log(chalk.cyan('Attempting SSH key authentication...'));
        execSync(`ssh -o BatchMode=yes -o ConnectTimeout=10 ${config.username}@${config.host} "echo 'Connection successful'"`, { stdio: 'pipe' });
        console.log(chalk.green('✅ SSH key authentication successful'));
        return true;
    } catch (error) {
        console.log(chalk.yellow('⚠️ SSH key authentication failed. Checking available authentication methods...'));
        
        // Check available authentication methods
        try {
            const authOutput = execSync(`ssh -v ${config.username}@${config.host} 2>&1 || true`, { stdio: 'pipe' }).toString();
            
            if (authOutput.includes('Authentications that can continue: publickey,password') || 
                authOutput.includes('Authentications that can continue: password,publickey')) {
                console.log(chalk.cyan('Server supports both key and password authentication.'));
                usePassword = true;
            } else if (authOutput.includes('Authentications that can continue: publickey')) {
                console.log(chalk.yellow('⚠️ Server only supports key authentication. Password authentication is disabled.'));
                console.log(chalk.yellow('⚠️ Please set up SSH keys for this server.'));
                
                // Ask if user wants to try setting up SSH keys
                const { setupKeys } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'setupKeys',
                        message: 'Would you like to set up SSH keys for this server?',
                        default: true
                    }
                ]);
                
                if (setupKeys) {
                    console.log(chalk.cyan('Please run "dreamhost-deployer setup-ssh" to set up SSH keys.'));
                }
                
                return false;
            } else if (authOutput.includes('Authentications that can continue: password')) {
                console.log(chalk.cyan('Server only supports password authentication.'));
                usePassword = true;
            } else {
                console.log(chalk.yellow('⚠️ Could not determine available authentication methods.'));
                usePassword = true; // Try password as a fallback
            }
        } catch (error) {
            console.log(chalk.yellow('⚠️ Could not determine available authentication methods.'));
            usePassword = true; // Try password as a fallback
        }
    }
    
    // Try password authentication if needed
    if (usePassword) {
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
        
        try {
            console.log(chalk.cyan('Attempting password authentication...'));
            
            // Create a temporary expect script for password authentication
            const expectScript = `
            spawn ssh -o ConnectTimeout=10 ${config.username}@${config.host} "echo 'Connection successful'"
            expect {
                "password:" {
                    send "${password}\\r"
                    expect {
                        "Connection successful" {
                            exit 0
                        }
                        "Permission denied" {
                            exit 1
                        }
                        timeout {
                            exit 2
                        }
                    }
                }
                "Permission denied" {
                    exit 1
                }
                timeout {
                    exit 2
                }
            }
            `;
            
            const expectScriptPath = path.join(require('os').tmpdir(), 'ssh_expect_test.exp');
            fs.writeFileSync(expectScriptPath, expectScript);
            fs.chmodSync(expectScriptPath, '700');
            
            try {
                execSync(`expect ${expectScriptPath}`, { stdio: 'pipe' });
                console.log(chalk.green('✅ Password authentication successful'));
                
                // Clean up
                fs.unlinkSync(expectScriptPath);
                
                return true;
            } catch (error) {
                console.error(chalk.red(`❌ Password authentication failed: ${error.message}`));
                
                // Clean up
                fs.unlinkSync(expectScriptPath);
                
                // Try sshpass as a fallback
                try {
                    console.log(chalk.cyan('Attempting authentication with sshpass...'));
                    execSync(`sshpass -p "${password}" ssh -o ConnectTimeout=10 ${config.username}@${config.host} "echo 'Connection successful'"`, { stdio: 'pipe' });
                    console.log(chalk.green('✅ Authentication with sshpass successful'));
                    return true;
                } catch (sshpassError) {
                    console.error(chalk.red(`❌ Authentication with sshpass failed: ${sshpassError.message}`));
                    
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
        } catch (error) {
            console.error(chalk.red(`❌ Error during password authentication: ${error.message}`));
            return false;
        }
    }
    
    return false;
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