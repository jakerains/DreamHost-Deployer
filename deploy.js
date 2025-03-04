const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const os = require('os');
const inquirer = require('inquirer');
const chalk = require('chalk'); // Using chalk for better formatting
const minimatch = require('minimatch');

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

        // Check if rsync is available
        try {
            execSync('rsync --version', { stdio: 'ignore' });
            // If we get here, rsync is available
            await deployWithRsync(config, localPath, remotePath);
        } catch (error) {
            // Rsync not available, likely on Windows
            if (process.platform === 'win32') {
                console.log(chalk.yellow('⚠️ Rsync not found on your Windows system.'));
                
                // Check if WSL is installed
                try {
                    execSync('wsl echo "WSL is installed"', { stdio: 'ignore' });
                    console.log(chalk.blue('ℹ️ WSL is installed but you\'re running from Windows shell.'));
                    console.log(chalk.blue('   For better performance, consider running this tool from within WSL.'));
                    console.log(chalk.blue('   See docs/windows-deployment-guide.md for detailed instructions.'));
                } catch (wslError) {
                    // WSL not installed or not properly configured
                    console.log(chalk.blue('ℹ️ WSL is not installed or not accessible.'));
                }
                
                const { choice } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'choice',
                        message: 'Choose how to proceed:',
                        choices: [
                            { name: 'Use alternative SCP method (slower but works on Windows)', value: 'scp' },
                            { name: 'Install WSL (Windows Subsystem for Linux) [recommended]', value: 'wsl' },
                            { name: 'Cancel deployment', value: 'cancel' }
                        ]
                    }
                ]);
                
                if (choice === 'scp') {
                    await deployWithScp(config, localPath, remotePath);
                } else if (choice === 'wsl') {
                    console.log(chalk.cyan('\n📋 To install WSL, follow these steps:'));
                    console.log(chalk.white('1. Open PowerShell as Administrator'));
                    console.log(chalk.white('2. Run: wsl --install'));
                    console.log(chalk.white('3. Restart your computer'));
                    console.log(chalk.white('4. WSL will finish installation on restart'));
                    console.log(chalk.white('5. Run WSL and install rsync: sudo apt update && sudo apt install rsync'));
                    console.log(chalk.white('6. Navigate to your project in WSL: cd /mnt/c/Users/your-username/project-path'));
                    console.log(chalk.white('7. Run the deployment tool from WSL'));
                    console.log(chalk.cyan('\nFor detailed instructions, see docs/windows-deployment-guide.md'));
                    process.exit(0);
                } else {
                    console.log(chalk.blue('Deployment canceled.'));
                    process.exit(0);
                }
            } else {
                console.error(chalk.red(`❌ Error: Rsync is not installed or not in your PATH.`));
                console.log(chalk.yellow('Please install rsync and try again.'));
                process.exit(1);
            }
        }
    } catch (error) {
        console.error(chalk.red(`\n❌ Deployment failed: ${error.message}`));
        process.exit(1);
    }
}

// Deploy using rsync (Unix/Linux/macOS and Windows with proper setup)
async function deployWithRsync(config, localPath, remotePath) {
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
    
    try {
        execSync(rsyncCmd, { stdio: 'inherit' });
        console.log(chalk.green('\n✅ Deployment completed successfully!'));
    } catch (error) {
        throw new Error(`Command failed: ${rsyncCmd}\n${error.message}`);
    }
}

// Deploy using SCP (alternative for Windows without rsync)
async function deployWithScp(config, localPath, remotePath) {
    console.log(chalk.blue('\n📦 Using SCP for deployment (this may be slower than rsync)...'));
    
    try {
        // Create a temporary file listing all files to transfer
        const tempFilePath = path.join(os.tmpdir(), 'files-to-transfer.txt');
        const filesToExclude = config.exclude || ['node_modules', '.git', '.env', '.DS_Store'];
        
        // Walk through directory and get all files
        const getAllFiles = (dir, excludePatterns) => {
            let results = [];
            const list = fs.readdirSync(dir);
            
            list.forEach(file => {
                const fullPath = path.join(dir, file);
                const relativePath = path.relative(localPath, fullPath);
                
                // Check if file/directory should be excluded
                if (excludePatterns.some(pattern => 
                    minimatch(relativePath, pattern) || 
                    relativePath.startsWith(pattern) ||
                    file === pattern)) {
                    return;
                }
                
                const stat = fs.statSync(fullPath);
                if (stat && stat.isDirectory()) {
                    results = results.concat(getAllFiles(fullPath, excludePatterns));
                } else {
                    results.push(relativePath.replace(/\\/g, '/'));
                }
            });
            
            return results;
        };
        
        // Get all files, excluding patterns
        const files = getAllFiles(localPath, filesToExclude);
        console.log(chalk.blue(`🔍 Found ${files.length} files to transfer`));
        
        // Create remote directory structure first
        console.log(chalk.blue('🗂️  Creating remote directory structure...'));
        
        // Get unique directories from file paths
        const directories = [...new Set(
            files.map(file => path.dirname(file))
                .filter(dir => dir !== '.')
        )];
        
        // Create each directory on remote server
        for (const dir of directories) {
            const mkdirCmd = `ssh -i "${config.privateKeyPath}" ${config.username}@${config.host} "mkdir -p ${remotePath}/${dir}"`;
            execSync(mkdirCmd, { stdio: 'ignore' });
        }
        
        // Transfer each file
        console.log(chalk.blue('📤 Transferring files...'));
        let fileCount = 0;
        
        for (const file of files) {
            fileCount++;
            process.stdout.write(`\r${chalk.blue(`Transferring file ${fileCount}/${files.length}: ${file}`)}`);
            
            const scpCmd = `scp -i "${config.privateKeyPath}" "${path.join(localPath, file)}" ${config.username}@${config.host}:"${remotePath}/${file}"`;
            execSync(scpCmd, { stdio: 'ignore' });
        }
        
        console.log(chalk.green('\n\n✅ Deployment completed successfully!'));
    } catch (error) {
        throw new Error(`SCP deployment failed: ${error.message}`);
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