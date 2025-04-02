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
        // Password will be asked for during deployment or setup process
    ]);
    
    // Update config with answers
    config.host = answers.host;
    config.username = answers.username;
    config.targetFolder = answers.targetFolder;
    config.remotePath = `/home/${answers.username}/${answers.targetFolder}`;
    config.localPath = answers.localPath;
    // Password authentication only
    
    console.log(chalk.cyan('\nConfiguration Summary:'));
    console.log(chalk.cyan(`  • Host: ${chalk.white(config.host)}`));
    console.log(chalk.cyan(`  • Username: ${chalk.white(config.username)}`));
    console.log(chalk.cyan(`  • Remote Path: ${chalk.white(config.remotePath)}`));
    console.log(chalk.cyan(`  • Local Path: ${chalk.white(config.localPath)}`));
    // Authentication using password only;
    console.log(chalk.cyan(`  • Web Server: ${chalk.white(config.webServer)}`));
    
    // Write config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green(`\n✅ Configuration saved to ${configPath}`));
}

// SSH key generation removed - only using password authentication

// Setup SSH
async function setupSSH() {
    try {
        console.log(chalk.bold.blue('\n🚀 Setting up SSH Password Authentication for DreamHost...\n'));
        
        // Load or create configuration
        let config;
        const configPath = 'deploy.config.json';
        
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            console.log(chalk.cyan('📂 Loaded existing configuration.'));
            
            // Remove any privateKeyPath if it exists (migrating from previous versions)
            if (config.privateKeyPath) {
                delete config.privateKeyPath;
                console.log(chalk.yellow('⚠️ SSH key authentication has been removed from this version.'));
                console.log(chalk.yellow('⚠️ The system now uses password authentication only.'));
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            }
        } else {
            console.log(chalk.yellow('⚠️ Configuration file not found. Creating new configuration...'));
            await initConfig();
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        
        // Password authentication only
        
        // Password setup
            console.log(chalk.blue('\n🔑 Setting up password authentication...'));
            console.log(chalk.cyan('With password authentication, you\'ll be prompted for your password during deployment.'));
            
            // Ask if user wants to test the connection now
            const { testConnection } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'testConnection',
                    message: 'Would you like to test your SSH connection now?',
                    default: true
                }
            ]);
            
            if (testConnection) {
                console.log(chalk.blue('🔄 Testing SSH connection...'));
                
                try {
                    // Test SSH connection
                    console.log(chalk.yellow('You will be prompted for your password.'));
                    console.log(chalk.yellow('This is normal and expected with password authentication.'));
                    
                    const sshCmd = `ssh ${config.username}@${config.host} "echo 'Connection successful'"`;
                    execSync(sshCmd, { stdio: 'inherit' });
                    
                    console.log(chalk.green('✅ SSH connection successful!'));
                } catch (error) {
                    console.error(chalk.red(`❌ SSH connection failed: ${error.message}`));
                    console.log(chalk.yellow('⚠️ Please check your username and host and try again.'));
                    console.log(chalk.yellow('⚠️ Make sure you have SSH access to your DreamHost server.'));
                }
            }
            
            // Ask if user wants to save a password for non-interactive use
            const { savePassword } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'savePassword',
                    message: 'Would you like to save your password for non-interactive use? (Not recommended for security reasons)',
                    default: false
                }
            ]);
            
            if (savePassword) {
                const { password } = await inquirer.prompt([
                    {
                        type: 'password',
                        name: 'password',
                        message: 'Enter your SSH password:',
                        mask: '*'
                    }
                ]);
                
                config.password = password;
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                console.log(chalk.green('✅ Password saved to configuration.'));
                console.log(chalk.yellow('⚠️ Note: Storing passwords in plain text is not secure.'));
            } else {
                // Remove password if it exists
                if (config.password) {
                    delete config.password;
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                }
                console.log(chalk.green('✅ You will be prompted for your password during deployment.'));
            }
        }
        
        console.log(chalk.green('\n✅ SSH setup completed!'));
        console.log(chalk.cyan('You can now run "dreamhost-deployer deploy" to deploy your website.'));
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