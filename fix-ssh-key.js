#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const inquirer = require('inquirer');
const chalk = require('chalk');

async function fixSSHKey() {
    console.log(chalk.bold.blue('\n🔧 DreamHost Deployer SSH Key Fix Tool\n'));
    
    try {
        // Check if config exists
        const configPath = 'deploy.config.json';
        if (!fs.existsSync(configPath)) {
            console.log(chalk.red('❌ Configuration file not found. Please run "dreamhost-deployer init" first.'));
            return;
        }
        
        // Load config
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log(chalk.cyan('📂 Loaded existing configuration.'));
        
        // Check current key path
        console.log(chalk.cyan(`Current SSH key path: ${chalk.white(config.privateKeyPath)}`));
        
        // Determine key type
        let keyType = 'unknown';
        if (config.privateKeyPath.endsWith('id_rsa')) {
            keyType = 'RSA';
        } else if (config.privateKeyPath.endsWith('id_ed25519')) {
            keyType = 'Ed25519';
        }
        
        console.log(chalk.cyan(`Current key type: ${chalk.white(keyType)}`));
        
        // Check if Ed25519 key exists
        const sshDir = path.dirname(config.privateKeyPath);
        const ed25519KeyPath = path.join(sshDir, 'id_ed25519');
        const rsaKeyPath = path.join(sshDir, 'id_rsa');
        
        if (fs.existsSync(ed25519KeyPath)) {
            console.log(chalk.green('✅ Ed25519 key found at:'), ed25519KeyPath);
        } else {
            console.log(chalk.yellow('⚠️ No Ed25519 key found.'));
        }
        
        if (fs.existsSync(rsaKeyPath)) {
            console.log(chalk.blue('ℹ️ RSA key found at:'), rsaKeyPath);
        }
        
        // Ask what to do
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: 'Generate new Ed25519 key (recommended)', value: 'generate_ed25519' },
                    { name: 'Update config to use existing Ed25519 key', value: 'use_existing_ed25519' },
                    { name: 'Keep using current key', value: 'keep_current' }
                ]
            }
        ]);
        
        if (action === 'generate_ed25519') {
            // Generate new Ed25519 key
            console.log(chalk.blue('🔐 Generating new Ed25519 SSH key...'));
            
            // Check if key already exists
            if (fs.existsSync(ed25519KeyPath)) {
                const { overwrite } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'overwrite',
                        message: chalk.yellow(`⚠️ Ed25519 key already exists at ${ed25519KeyPath}. Overwrite?`),
                        default: false
                    }
                ]);
                
                if (!overwrite) {
                    console.log(chalk.blue('✅ Using existing Ed25519 key.'));
                    config.privateKeyPath = ed25519KeyPath;
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                    console.log(chalk.green('✅ Configuration updated to use Ed25519 key.'));
                    displayPublicKey(ed25519KeyPath);
                    return;
                }
            }
            
            // Generate key
            // Resolve tilde expansion and normalize paths for cross-platform compatibility
            const resolvedPath = path.normalize(ed25519KeyPath.replace(/^~/, os.homedir()));
            execSync(`ssh-keygen -t ed25519 -f "${resolvedPath}" -N "" -C "dreamhost-deployer"`);
            console.log(chalk.green(`✅ Ed25519 SSH key generated at ${ed25519KeyPath}`));
            
            // Update config
            config.privateKeyPath = ed25519KeyPath;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log(chalk.green('✅ Configuration updated to use Ed25519 key.'));
            
            // Display public key
            displayPublicKey(ed25519KeyPath);
            
        } else if (action === 'use_existing_ed25519') {
            if (!fs.existsSync(ed25519KeyPath)) {
                console.log(chalk.red('❌ No Ed25519 key found. Please generate one first.'));
                return;
            }
            
            // Update config
            config.privateKeyPath = ed25519KeyPath;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log(chalk.green('✅ Configuration updated to use Ed25519 key.'));
            
            // Display public key
            displayPublicKey(ed25519KeyPath);
            
        } else {
            console.log(chalk.blue('✅ Keeping current SSH key configuration.'));
        }
        
    } catch (error) {
        console.error(chalk.red(`\n❌ SSH key fix failed: ${error.message}`));
        process.exit(1);
    }
}

function displayPublicKey(keyPath) {
    const publicKeyPath = `${keyPath}.pub`;
    if (fs.existsSync(publicKeyPath)) {
        const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
        console.log(chalk.blue('\n📋 Your public SSH key:'));
        console.log(chalk.cyan('='.repeat(60)));
        console.log(publicKey);
        console.log(chalk.cyan('='.repeat(60)));
        console.log(chalk.yellow('\n⚠️ Add this key to your DreamHost account at:'));
        console.log(chalk.cyan('https://panel.dreamhost.com/index.cgi?tree=users.ssh&'));
        
        console.log(chalk.bold.blue('\n📝 Next Steps:'));
        console.log(chalk.cyan('1. Copy the public key shown above'));
        console.log(chalk.cyan('2. Log in to your DreamHost panel'));
        console.log(chalk.cyan('3. Navigate to Users > Manage Users > SSH Keys'));
        console.log(chalk.cyan('4. Add the public key to your user account'));
        console.log(chalk.cyan('5. Wait a few minutes for the key to propagate'));
        console.log(chalk.cyan('6. Try deploying again with: dreamhost-deployer deploy'));
    }
}

// Run the script
async function run() {
    try {
        await fixSSHKey();
    } catch (err) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
    }
}

// If called directly
if (require.main === module) {
    run();
}

// Export for CLI
module.exports = { run }; 