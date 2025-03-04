const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const inquirer = require('inquirer');
const chalk = require('chalk'); // Using chalk for better formatting

// Colors for output
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

// Promise-based question function using inquirer instead of readline
async function question(query) {
    const { answer } = await inquirer.prompt([
        {
            type: 'input',
            name: 'answer',
            message: query
        }
    ]);
    return answer;
}

// Initialize configuration
async function initConfig() {
    const configPath = 'deploy.config.json';
    
    console.log(chalk.bold.blue('\n🔧 DreamHost Deployer Configuration Wizard\n'));
    
    // Check if config exists
    if (fs.existsSync(configPath)) {
        const { overwrite } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'overwrite',
                message: chalk.yellow('⚠️ Configuration file already exists. Overwrite?'),
                default: false
            }
        ]);
        
        if (!overwrite) {
            console.log(chalk.blue('✅ Keeping existing configuration.'));
            return;
        }
    }
    
    console.log(chalk.blue('📝 Creating new configuration...'));
    
    // Ask for web server type first
    const { webServer } = await inquirer.prompt([
        {
            type: 'list',
            name: 'webServer',
            message: 'Select your DreamHost web server type:',
            choices: [
                { name: 'Apache (Default)', value: 'Apache' },
                { name: 'Nginx', value: 'Nginx' }
            ],
            default: 'Apache'
        }
    ]);
    
    console.log(chalk.cyan(`\n🌐 Web server selected: ${chalk.white(webServer)}`));
    console.log(chalk.cyan('Now let\'s configure your DreamHost server details:\n'));
    
    // Create template
    const config = {
        host: '',
        username: '',
        remotePath: '',
        localPath: '',
        privateKeyPath: '',
        targetFolder: '',
        webServer: webServer,
        exclude: [
            'node_modules',
            '.git',
            '.env',
            '.DS_Store'
        ]
    };
    
    // Prompt for configuration values using inquirer
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'host',
            message: 'Enter server hostname (e.g., example.com):',
            validate: (input) => input.trim() !== '' ? true : 'Hostname cannot be empty'
        },
        {
            type: 'input',
            name: 'username',
            message: 'Enter server username:',
            validate: (input) => input.trim() !== '' ? true : 'Username cannot be empty'
        },
        {
            type: 'input',
            name: 'targetFolder',
            message: 'Enter target folder/domain (e.g., example.com):',
            validate: (input) => input.trim() !== '' ? true : 'Target folder cannot be empty'
        },
        {
            type: 'input',
            name: 'localPath',
            message: 'Enter local path to deploy (default: ./dist):',
            default: './dist'
        },
        {
            type: 'input',
            name: 'privateKeyPath',
            message: `Enter private key path (default: ${path.join(os.homedir(), '.ssh', 'id_rsa')}):`,
            default: path.join(os.homedir(), '.ssh', 'id_rsa')
        }
    ]);
    
    // Update config with answers
    config.host = answers.host;
    config.username = answers.username;
    config.targetFolder = answers.targetFolder;
    config.remotePath = `/home/${answers.username}/${answers.targetFolder}`;
    config.localPath = answers.localPath;
    config.privateKeyPath = answers.privateKeyPath;
    
    console.log(chalk.cyan('\nConfiguration Summary:'));
    console.log(chalk.cyan(`  • Host: ${chalk.white(config.host)}`));
    console.log(chalk.cyan(`  • Username: ${chalk.white(config.username)}`));
    console.log(chalk.cyan(`  • Remote Path: ${chalk.white(config.remotePath)}`));
    console.log(chalk.cyan(`  • Local Path: ${chalk.white(config.localPath)}`));
    console.log(chalk.cyan(`  • SSH Key: ${chalk.white(config.privateKeyPath)}`));
    console.log(chalk.cyan(`  • Web Server: ${chalk.white(config.webServer)}`));
    
    // Write config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green(`\n✅ Configuration saved to ${configPath}`));
}

// Generate SSH key
async function generateSSHKey(keyPath) {
    try {
        console.log(chalk.blue('\n🔑 Setting up SSH key...'));
        
        // Check if key already exists
        if (fs.existsSync(keyPath)) {
            const { overwrite } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'overwrite',
                    message: chalk.yellow(`⚠️ SSH key already exists at ${keyPath}. Overwrite?`),
                    default: false
                }
            ]);
            
            if (!overwrite) {
                console.log(chalk.blue('✅ Keeping existing SSH key.'));
                return keyPath;
            }
        }
        
        // Generate key - using Ed25519 instead of RSA for better compatibility
        console.log(chalk.blue('🔐 Generating new SSH key...'));
        execSync(`ssh-keygen -t ed25519 -f "${keyPath}" -N "" -C "dreamhost-deployer"`);
        console.log(chalk.green(`✅ SSH key generated at ${keyPath}`));
        
        return keyPath;
    } catch (error) {
        console.error(chalk.red(`❌ Error generating SSH key: ${error.message}`));
        throw error;
    }
}

// Setup SSH
async function setupSSH() {
    try {
        console.log(chalk.bold.blue('\n🚀 Setting up SSH for DreamHost deployment...\n'));
        
        // Load or create configuration
        let config;
        const configPath = 'deploy.config.json';
        
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            console.log(chalk.cyan('📂 Loaded existing configuration.'));
        } else {
            console.log(chalk.yellow('⚠️ Configuration file not found. Creating new configuration...'));
            await initConfig();
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        
        // Generate SSH key if needed
        if (!config.privateKeyPath) {
            const defaultKeyPath = path.join(os.homedir(), '.ssh', 'id_rsa');
            
            const { keyPath } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'keyPath',
                    message: `Enter private key path (default: ${defaultKeyPath}):`,
                    default: defaultKeyPath
                }
            ]);
            
            config.privateKeyPath = keyPath;
            
            // Update config
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        }
        
        // Generate key if it doesn't exist
        if (!fs.existsSync(config.privateKeyPath)) {
            await generateSSHKey(config.privateKeyPath);
        }
        
        // Display public key
        const publicKeyPath = `${config.privateKeyPath}.pub`;
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
        } else {
            console.error(chalk.red(`❌ Public key not found at ${publicKeyPath}`));
        }
        
        console.log(chalk.green('\n✅ SSH setup completed!'));
    } catch (error) {
        console.error(chalk.red(`\n❌ SSH setup failed: ${error.message}`));
        process.exit(1);
    }
}

// Main function
async function run() {
    try {
        await setupSSH();
    } catch (error) {
        console.error(chalk.red(`\n❌ Error: ${error.message}`));
        process.exit(1);
    }
}

// Export functions
module.exports = {
    run,
    initConfig,
    generateSSHKey,
    setupSSH
};

// Direct execution
if (require.main === module) {
    run();
} 