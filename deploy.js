const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const os = require('os');
const inquirer = require('inquirer');
const chalk = require('chalk'); // Using chalk for better formatting

const execAsync = promisify(exec);

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

// Load or create configuration
async function loadOrCreateConfig(configPath) {
    // Check if config exists
    if (!fs.existsSync(configPath)) {
        console.log(chalk.yellow('⚠️ Configuration file not found: ' + configPath));
        console.log(chalk.red('Please run \'dreamhost-deployer init\' to create a configuration file.'));
        process.exit(1);
    }
    
    try {
        // Load config
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // If webServer is not defined, ask for it
        if (!config.webServer) {
            console.log(chalk.yellow('\n⚠️ Web server type not specified in configuration.'));
            
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
            
            config.webServer = webServer;
            
            // Save updated config
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log(chalk.green('✅ Configuration updated with web server type: ' + webServer));
        }
        
        return config;
    } catch (error) {
        console.error(chalk.red('❌ Error loading configuration: ' + error.message));
        process.exit(1);
    }
}

const fixPath = (filePath) => {
    return filePath.replace(/\\/g, '/');
};

// Main deploy function
async function deploy(config) {
    try {
        console.log(chalk.bold.blue('\n🚀 Starting deployment to DreamHost...\n'));
        
        // Validate configuration
        if (!config.host || !config.username || !config.remotePath || !config.localPath) {
            console.error(chalk.bold.red('❌ Invalid configuration. Missing required fields.'));
            process.exit(1);
        }

        // Display configuration summary
        console.log(chalk.cyan('Deployment Configuration:'));
        console.log(chalk.cyan(`  • Host: ${chalk.white(config.host)}`));
        console.log(chalk.cyan(`  • Username: ${chalk.white(config.username)}`));
        console.log(chalk.cyan(`  • Remote Path: ${chalk.white(config.remotePath)}`));
        console.log(chalk.cyan(`  • Local Path: ${chalk.white(config.localPath)}`));
        console.log(chalk.cyan(`  • Web Server: ${chalk.white(config.webServer || 'Apache (default)')}\n`));

        // Normalize paths
        const localPath = path.resolve(config.localPath);
        const remotePath = config.remotePath;
        
        // Check if local path exists
        if (!fs.existsSync(localPath)) {
            console.error(chalk.bold.red(`❌ Local path does not exist: ${localPath}`));
            process.exit(1);
        }

        // Prepare rsync command
        let rsyncCmd = `rsync -avz --delete`;
        
        // Add exclude patterns if specified
        if (config.exclude && Array.isArray(config.exclude)) {
            config.exclude.forEach(pattern => {
                rsyncCmd += ` --exclude='${pattern}'`;
            });
        }
        
        // Add SSH options
        rsyncCmd += ` -e "ssh -i ${config.privateKeyPath || '~/.ssh/id_rsa'}"`;
        
        // Add source and destination
        rsyncCmd += ` ${fixPath(localPath)}/`;
        rsyncCmd += ` ${config.username}@${config.host}:${remotePath}/`;
        
        console.log(chalk.yellow('📤 Executing deployment command:'));
        console.log(chalk.gray(rsyncCmd + '\n'));
        
        // Execute rsync with progress indicator
        console.log(chalk.blue('🔄 Transferring files to DreamHost server...'));
        
        // Execute rsync
        const { stdout, stderr } = await execAsync(rsyncCmd);
        
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        
        console.log(chalk.bold.green('\n✅ Deployment completed successfully!'));
        
        // Display next steps based on web server type
        console.log(chalk.bold.blue('\n📝 Next Steps:'));
        
        if (config.webServer === 'Nginx') {
            console.log(chalk.cyan('1. Verify your files at: ' + config.remotePath));
            console.log(chalk.cyan('2. If you\'re running a Node.js application, make sure it\'s properly configured'));
            console.log(chalk.cyan('3. Check your Nginx configuration in the DreamHost panel'));
        } else {
            console.log(chalk.cyan('1. Verify your files at: ' + config.remotePath));
            console.log(chalk.cyan('2. If you\'re running a Node.js application, make sure it\'s properly configured'));
            console.log(chalk.cyan('3. Check your Apache configuration (.htaccess file)'));
        }
        
        console.log(chalk.bold.green('\n🎉 Your website has been deployed to DreamHost!\n'));
        
    } catch (error) {
        console.error(chalk.bold.red(`\n❌ Deployment failed: ${error.message}\n`));
        process.exit(1);
    }
}

// Function to run the deployment process
async function runDeploy(configPath) {
    try {
        console.log(chalk.bold.blue('\n🚀 DreamHost Deployer\n'));
        
        const config = await loadOrCreateConfig(configPath);
        await deploy(config);
    } catch (error) {
        console.error(chalk.bold.red(`\n❌ Error: ${error.message}\n`));
        process.exit(1);
    }
}

// Export functions
module.exports = {
    runDeploy,
    deploy,
    loadOrCreateConfig
};

// Direct execution
if (require.main === module) {
    const configPath = process.argv[2] || 'deploy.config.json';
    runDeploy(configPath);
} 