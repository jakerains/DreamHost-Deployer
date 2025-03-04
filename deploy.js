const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const os = require('os');
const inquirer = require('inquirer');
const chalk = require('chalk'); // Using chalk for better formatting
const minimatch = require('minimatch');
const { checkAndSetupServerIfNeeded } = require('./src/utils/server-check');

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
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log(chalk.green(`✅ Configuration updated with web server type: ${webServer}`));
        }
        
        // If password is not defined, ask for it
        if (!config.password) {
            console.log(chalk.yellow('\n⚠️ SSH password not found in configuration.'));
            
            const { usePassword } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'usePassword',
                    message: 'Would you like to use password authentication for SSH?',
                    default: true
                }
            ]);
            
            if (usePassword) {
                const { password, savePassword } = await inquirer.prompt([
                    {
                        type: 'password',
                        name: 'password',
                        message: 'Enter your SSH password:',
                        mask: '*'
                    },
                    {
                        type: 'confirm',
                        name: 'savePassword',
                        message: 'Would you like to save this password in your configuration? (Not recommended for security reasons)',
                        default: false
                    }
                ]);
                
                if (savePassword) {
                    config.password = password;
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                    console.log(chalk.green('✅ Password saved to configuration.'));
                } else {
                    // Store password temporarily for this session only
                    config.password = password;
                    console.log(chalk.green('✅ Password will be used for this session only.'));
                }
            } else {
                console.log(chalk.yellow('⚠️ Continuing without password authentication. SSH key will be used if available.'));
            }
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
async function deploy() {
    try {
        console.log(chalk.bold.blue('\n🚀 Starting deployment to DreamHost...\n'));
        
        // Load configuration
        let config;
        const configPath = 'deploy.config.json';
        
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            console.log(chalk.cyan('📂 Loaded configuration:'));
            console.log(chalk.cyan(`   Host: ${config.host}`));
            console.log(chalk.cyan(`   Username: ${config.username}`));
            console.log(chalk.cyan(`   Remote Path: ${config.remotePath}`));
            console.log(chalk.cyan(`   Local Path: ${config.localPath}`));
            console.log(chalk.cyan(`   Web Server: ${config.webServer || 'Apache (default)'}`));
        } else {
            console.log(chalk.yellow('⚠️ Configuration file not found. Running setup...'));
            await initConfig();
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        
        // Check if the server has the right versions of NVM and Node.js
        await checkAndSetupServerIfNeeded(config);
        
        // Use the simplified native SSH/SCP deployment method
        await deployWithNativeSSH(config);
        
        // Display next steps based on web server type
        const webServer = config.webServer || 'apache';
        
        console.log(chalk.bold.blue('\n📝 Next Steps:'));
        
        if (webServer.toLowerCase() === 'apache') {
            console.log(chalk.cyan('1. Ensure your .htaccess file is properly configured'));
            console.log(chalk.cyan('2. Check file permissions (644 for files, 755 for directories)'));
            console.log(chalk.cyan('3. Visit your website to verify the deployment'));
        } else if (webServer.toLowerCase() === 'nginx') {
            console.log(chalk.cyan('1. Verify your Nginx configuration at /etc/nginx/sites-available/'));
            console.log(chalk.cyan('2. Check file permissions (644 for files, 755 for directories)'));
            console.log(chalk.cyan('3. Restart Nginx if needed: sudo service nginx restart'));
            console.log(chalk.cyan('4. Visit your website to verify the deployment'));
        }
        
        console.log(chalk.green('\n✅ Deployment completed successfully!'));
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
    
    // Add SSH options based on authentication method
    if (config.password) {
        console.log(chalk.blue('🔑 Using password authentication for rsync'));
        
        // Check if sshpass is available
        try {
            execSync('sshpass -V', { stdio: 'ignore' });
            // sshpass is available
            rsyncCmd = `sshpass -p "${config.password}" ${rsyncCmd}`;
            rsyncCmd += ` -e "ssh -o StrictHostKeyChecking=no"`;
        } catch (error) {
            // sshpass not available
            console.log(chalk.yellow('⚠️ sshpass not found. Password authentication with rsync requires sshpass.'));
            console.log(chalk.yellow('⚠️ Falling back to SCP deployment method.'));
            
            // Fall back to SCP method
            await deployWithScp(config, localPath, remotePath);
            return;
        }
    } else {
        // Use SSH key authentication
        // Check if Ed25519 key exists and use it instead of RSA if available
        let keyPath = config.privateKeyPath || '~/.ssh/id_rsa';
        const ed25519KeyPath = path.join(path.dirname(keyPath), 'id_ed25519');
        
        if (fs.existsSync(ed25519KeyPath)) {
            console.log(chalk.blue('🔑 Using Ed25519 key for better compatibility'));
            keyPath = ed25519KeyPath;
        }
        
        rsyncCmd += ` -e "ssh -i ${keyPath}"`;
    }
    
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
        console.error(chalk.red(`❌ Rsync deployment failed: ${error.message}`));
        
        if (error.message.includes('Permission denied') || error.message.includes('authentication')) {
            console.log(chalk.yellow('⚠️ This appears to be an authentication issue.'));
            
            if (!config.password) {
                console.log(chalk.yellow('⚠️ Trying again with password authentication...'));
                
                // Ask for password
                const { password } = await inquirer.prompt([
                    {
                        type: 'password',
                        name: 'password',
                        message: 'Enter your SSH password:',
                        mask: '*'
                    }
                ]);
                
                // Store password temporarily
                config.password = password;
                
                // Try again with password
                await deployWithRsync(config, localPath, remotePath);
                return;
            }
        }
        
        throw new Error(`Rsync deployment failed: ${error.message}`);
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
                let shouldExclude = false;
                
                // Check each exclude pattern
                for (const pattern of excludePatterns) {
                    // Direct match with filename
                    if (file === pattern) {
                        shouldExclude = true;
                        break;
                    }
                    
                    // Path starts with pattern (for directories)
                    if (relativePath.startsWith(pattern)) {
                        shouldExclude = true;
                        break;
                    }
                    
                    // Use minimatch for glob pattern matching
                    try {
                        if (minimatch(relativePath, pattern)) {
                            shouldExclude = true;
                            break;
                        }
                    } catch (err) {
                        // If minimatch fails, fall back to simple string comparison
                        console.log(chalk.yellow(`Warning: Pattern matching failed for ${pattern}, using simple comparison`));
                        if (relativePath.includes(pattern)) {
                            shouldExclude = true;
                            break;
                        }
                    }
                }
                
                if (shouldExclude) {
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
            // Check if password authentication should be used
            let mkdirCmd;
            
            if (config.password) {
                // Use sshpass for password authentication
                console.log(chalk.blue('🔑 Using password authentication'));
                
                // Check if sshpass is available
                try {
                    execSync('sshpass -V', { stdio: 'ignore' });
                    // sshpass is available
                    mkdirCmd = `sshpass -p "${config.password}" ssh -o StrictHostKeyChecking=no ${config.username}@${config.host} "mkdir -p ${remotePath}/${dir}"`;
                } catch (error) {
                    // sshpass not available, use expect script
                    console.log(chalk.yellow('⚠️ sshpass not found. Using alternative method.'));
                    
                    // Create a temporary expect script
                    const expectScript = `
                    spawn ssh -o StrictHostKeyChecking=no ${config.username}@${config.host} "mkdir -p ${remotePath}/${dir}"
                    expect "password:"
                    send "${config.password}\\r"
                    expect eof
                    `;
                    
                    const expectScriptPath = path.join(os.tmpdir(), 'ssh_expect.exp');
                    fs.writeFileSync(expectScriptPath, expectScript);
                    fs.chmodSync(expectScriptPath, '700');
                    
                    mkdirCmd = `expect ${expectScriptPath}`;
                    
                    // Clean up after execution
                    process.on('exit', () => {
                        try {
                            fs.unlinkSync(expectScriptPath);
                        } catch (e) {
                            // Ignore errors during cleanup
                        }
                    });
                }
            } else {
                // Use SSH key authentication
                // Check if Ed25519 key exists and use it instead of RSA if available
                let keyPath = config.privateKeyPath;
                const ed25519KeyPath = path.join(path.dirname(config.privateKeyPath), 'id_ed25519');
                
                if (fs.existsSync(ed25519KeyPath)) {
                    console.log(chalk.blue('🔑 Using Ed25519 key for better compatibility'));
                    keyPath = ed25519KeyPath;
                }
                
                mkdirCmd = `ssh -i "${keyPath}" ${config.username}@${config.host} "mkdir -p ${remotePath}/${dir}"`;
            }
            
            try {
                execSync(mkdirCmd, { stdio: 'pipe' });
            } catch (error) {
                console.error(chalk.red(`❌ Failed to create directory: ${dir}`));
                console.error(chalk.yellow('Error details:'), error.message);
                throw new Error(`Failed to create directory: ${error.message}`);
            }
        }
        
        // Transfer each file
        console.log(chalk.blue('📤 Transferring files...'));
        let fileCount = 0;
        
        // Check if password authentication should be used
        let scpBaseCmd;
        
        if (config.password) {
            // Use sshpass for password authentication
            try {
                execSync('sshpass -V', { stdio: 'ignore' });
                // sshpass is available
                scpBaseCmd = `sshpass -p "${config.password}" scp -o StrictHostKeyChecking=no`;
            } catch (error) {
                // sshpass not available, use expect script for each file
                console.log(chalk.yellow('⚠️ sshpass not found. Using alternative method for file transfers.'));
                scpBaseCmd = 'expect'; // Will create expect script for each file
            }
        } else {
            // Use SSH key authentication
            // Check if Ed25519 key exists and use it instead of RSA if available
            let keyPath = config.privateKeyPath;
            const ed25519KeyPath = path.join(path.dirname(config.privateKeyPath), 'id_ed25519');
            
            if (fs.existsSync(ed25519KeyPath)) {
                console.log(chalk.blue('🔑 Using Ed25519 key for better compatibility'));
                keyPath = ed25519KeyPath;
            }
            
            scpBaseCmd = `scp -i "${keyPath}"`;
        }
        
        for (const file of files) {
            fileCount++;
            process.stdout.write(`\r${chalk.blue(`Transferring file ${fileCount}/${files.length}: ${file}`)}`);
            
            let scpCmd;
            
            if (config.password && scpBaseCmd === 'expect') {
                // Create a temporary expect script for this file
                const expectScript = `
                spawn scp -o StrictHostKeyChecking=no "${path.join(localPath, file)}" ${config.username}@${config.host}:"${remotePath}/${file}"
                expect "password:"
                send "${config.password}\\r"
                expect eof
                `;
                
                const expectScriptPath = path.join(os.tmpdir(), `scp_expect_${fileCount}.exp`);
                fs.writeFileSync(expectScriptPath, expectScript);
                fs.chmodSync(expectScriptPath, '700');
                
                scpCmd = `expect ${expectScriptPath}`;
                
                // Clean up after execution
                process.on('exit', () => {
                    try {
                        fs.unlinkSync(expectScriptPath);
                    } catch (e) {
                        // Ignore errors during cleanup
                    }
                });
            } else {
                scpCmd = `${scpBaseCmd} "${path.join(localPath, file)}" ${config.username}@${config.host}:"${remotePath}/${file}"`;
            }
            
            try {
                execSync(scpCmd, { stdio: 'pipe' });
            } catch (error) {
                console.error(chalk.red(`\n❌ Failed to transfer file: ${file}`));
                console.error(chalk.yellow('Error details:'), error.message);
                throw new Error(`Failed to transfer file: ${error.message}`);
            }
        }
        
        console.log(chalk.green(`\n\n✅ Successfully transferred ${files.length} files!`));
    } catch (error) {
        throw new Error(`SCP deployment failed: ${error.message}`);
    }
}

// Simplified deployment using native SSH/SCP commands (cross-platform)
async function deployWithNativeSSH(config) {
    console.log(chalk.blue('\n🚀 Using native SSH/SCP for deployment (cross-platform)...'));
    
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
                const relativePath = path.relative(config.localPath, fullPath);
                
                // Check if file/directory should be excluded
                let shouldExclude = false;
                
                // Check each exclude pattern
                for (const pattern of excludePatterns) {
                    // Direct match with filename
                    if (file === pattern) {
                        shouldExclude = true;
                        break;
                    }
                    
                    // Path starts with pattern (for directories)
                    if (relativePath.startsWith(pattern)) {
                        shouldExclude = true;
                        break;
                    }
                    
                    // Use minimatch for glob pattern matching
                    try {
                        if (minimatch(relativePath, pattern)) {
                            shouldExclude = true;
                            break;
                        }
                    } catch (err) {
                        // If minimatch fails, fall back to simple string comparison
                        console.log(chalk.yellow(`Warning: Pattern matching failed for ${pattern}, using simple comparison`));
                        if (relativePath.includes(pattern)) {
                            shouldExclude = true;
                            break;
                        }
                    }
                }
                
                if (shouldExclude) {
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
        const files = getAllFiles(config.localPath, filesToExclude);
        console.log(chalk.blue(`🔍 Found ${files.length} files to transfer`));
        
        // Create remote directory structure first
        console.log(chalk.blue('🗂️  Creating remote directory structure...'));
        
        // Get unique directories from file paths
        const directories = [...new Set(
            files.map(file => path.dirname(file))
                .filter(dir => dir !== '.')
        )];
        
        // Prepare SSH command base
        let sshBase = `ssh ${config.username}@${config.host}`;
        let scpBase = `scp`;
        
        // Create each directory on remote server
        for (const dir of directories) {
            const mkdirCmd = `${sshBase} "mkdir -p ${config.remotePath}/${dir}"`;
            try {
                console.log(chalk.cyan(`Creating directory: ${dir}`));
                execSync(mkdirCmd, { stdio: 'pipe' });
            } catch (error) {
                console.error(chalk.red(`❌ Failed to create directory: ${dir}`));
                console.error(chalk.yellow('Error details:'), error.message);
                
                if (error.message.includes('Permission denied') || error.message.includes('authentication')) {
                    console.log(chalk.yellow('⚠️ This appears to be an authentication issue.'));
                    console.log(chalk.cyan('You will be prompted for your password for each command.'));
                    console.log(chalk.cyan('This is normal behavior when using password authentication.'));
                }
                
                throw new Error(`Failed to create directory: ${error.message}`);
            }
        }
        
        // Transfer each file
        console.log(chalk.blue('📤 Transferring files...'));
        let fileCount = 0;
        let successCount = 0;
        
        for (const file of files) {
            fileCount++;
            process.stdout.write(`\r${chalk.blue(`Transferring file ${fileCount}/${files.length}: ${file}`)}`);
            
            // Create parent directory if it doesn't exist (redundant but safer)
            const dirPath = path.dirname(file);
            if (dirPath !== '.') {
                try {
                    execSync(`${sshBase} "mkdir -p ${config.remotePath}/${dirPath}"`, { stdio: 'ignore' });
                } catch (error) {
                    // Ignore errors here as we already created directories
                }
            }
            
            // Transfer the file
            const scpCmd = `${scpBase} "${path.join(config.localPath, file)}" ${config.username}@${config.host}:"${config.remotePath}/${file}"`;
            try {
                execSync(scpCmd, { stdio: 'ignore' });
                successCount++;
            } catch (error) {
                console.error(chalk.red(`\n❌ Failed to transfer file: ${file}`));
                console.error(chalk.yellow('Error details:'), error.message);
                
                if (error.message.includes('Permission denied') || error.message.includes('authentication')) {
                    console.log(chalk.yellow('⚠️ This appears to be an authentication issue.'));
                    console.log(chalk.cyan('You will be prompted for your password for each file transfer.'));
                    console.log(chalk.cyan('This is normal behavior when using password authentication.'));
                }
                
                // Continue with other files instead of failing completely
                console.log(chalk.yellow('⚠️ Continuing with remaining files...'));
            }
        }
        
        console.log(chalk.green(`\n\n✅ Successfully transferred ${successCount}/${files.length} files!`));
        
        if (successCount < files.length) {
            console.log(chalk.yellow(`⚠️ ${files.length - successCount} files failed to transfer.`));
        }
        
        console.log(chalk.green('\n✅ Deployment completed!'));
    } catch (error) {
        throw new Error(`Deployment failed: ${error.message}`);
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