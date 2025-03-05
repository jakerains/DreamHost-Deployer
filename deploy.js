const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const os = require('os');
const inquirer = require('inquirer');
const chalk = require('chalk'); // Using chalk for better formatting
const minimatch = require('minimatch');
const { checkAndSetupServerIfNeeded } = require('./src/utils/server-check');
const { Client } = require('ssh2');
const { spawn } = require('child_process');

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
    try {
        const config = {};
        
        // Check if config exists
        if (!fs.existsSync(configPath)) {
            console.log(chalk.yellow(`Configuration file not found at ${configPath}`));
            console.log(chalk.blue('Let\'s set up your DreamHost deployment configuration...'));
            
            // Check if this is potentially a Vite project
            const isViteProject = fs.existsSync(path.join(process.cwd(), 'vite.config.js')) || 
                                fs.existsSync(path.join(process.cwd(), 'vite.config.ts'));
            
            // Also check package.json for vite dependency
            let hasViteDependency = false;
            try {
                const packageJsonPath = path.join(process.cwd(), 'package.json');
                if (fs.existsSync(packageJsonPath)) {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                    hasViteDependency = (packageJson.dependencies && packageJson.dependencies.vite) || 
                                        (packageJson.devDependencies && packageJson.devDependencies.vite);
                }
            } catch (err) {
                // Silently ignore package.json parsing errors
            }
            
            const isVite = isViteProject || hasViteDependency;
            if (isVite) {
                console.log(chalk.cyan('📦 Detected a Vite project! Using Vite-specific defaults...'));
            }
            
            // Get user input for configuration
            config.host = await question('DreamHost hostname (e.g., example.com):');
            config.username = await question('SSH username:');
            
            // Detect whether to use password or key authentication
            const authType = await question('Authentication type (password/key) [key]:') || 'key';
            
            if (authType.toLowerCase() === 'password') {
                config.password = await question('SSH password:', true);
            } else {
                // Default to ~/.ssh/id_rsa, but allow custom path
                const homeDir = os.homedir();
                const defaultKeyPath = path.join(homeDir, '.ssh', 'id_rsa');
                config.privateKeyPath = await question(`Path to private key [${defaultKeyPath}]:`) || defaultKeyPath;
            }
            
            config.remotePath = await question('Remote path on DreamHost (e.g., /home/username/example.com):');
            config.localPath = await question(`Local path to deploy from [${process.cwd()}]:`) || process.cwd();
            
            // Ask about build integration
            const enableBuildIntegration = (await question('Enable build integration? (y/n) [y]:') || 'y').toLowerCase();
            
            if (enableBuildIntegration === 'y') {
                config.buildIntegration = true;
                
                // Use Vite defaults if it's a Vite project
                const defaultBuildCmd = isVite ? 'npm run build' : 'npm run build';
                const defaultOutputDir = isVite ? 'dist' : 'build';
                
                config.buildCommand = await question(`Build command [${defaultBuildCmd}]:`) || defaultBuildCmd;
                config.buildOutputDir = await question(`Output directory [${defaultOutputDir}]:`) || defaultOutputDir;
                
                // For Vite projects, add additional guidance
                if (isVite) {
                    console.log(chalk.cyan('ℹ️ For Vite projects, common build commands include:'));
                    console.log(chalk.cyan('   - npm run build (package.json script)'));
                    console.log(chalk.cyan('   - yarn build (if using Yarn)'));
                    console.log(chalk.cyan('   - npx vite build (direct vite command)'));
                    console.log(chalk.cyan('The standard output directory for Vite is "dist"'));
                }
            }
            
            // Save configuration
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log(chalk.green(`✅ Configuration saved to ${configPath}`));
        } else {
            // Load existing config
            Object.assign(config, JSON.parse(fs.readFileSync(configPath, 'utf8')));
            console.log(chalk.green(`✅ Loaded configuration from ${configPath}`));
        }
        
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

// Function to check if target directory has existing files
async function checkTargetDirectory(config) {
    console.log(chalk.blue('\n🔍 Checking target directory for existing files...'));
    
    return new Promise((resolve, reject) => {
        const conn = new Client();
        let operationTimeout;
        
        // Set a 1-minute timeout for the directory check
        operationTimeout = setTimeout(() => {
            conn.end();
            reject(new Error('Directory check timed out after 60 seconds. This could indicate network issues or server load.'));
        }, 60000); // 1 minute
        
        conn.on('ready', () => {
            console.log(chalk.blue('🔌 SSH connection established.'));
            
            // Execute ls command to check if directory exists and has files
            conn.exec(`ls -la ${config.remotePath}`, (err, stream) => {
                if (err) {
                    clearTimeout(operationTimeout);
                    conn.end();
                    // If directory doesn't exist, we can proceed with deployment
                    if (err.message.includes('No such file or directory')) {
                        console.log(chalk.yellow(`⚠️ Target directory ${config.remotePath} does not exist yet.`));
                        resolve({ exists: false, hasFiles: false });
                        return;
                    }
                    reject(new Error(`Failed to check target directory: ${err.message}`));
                    return;
                }
                
                let output = '';
                let stderr = '';
                
                stream.on('data', (data) => {
                    output += data.toString();
                });
                
                stream.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                
                stream.on('close', (code) => {
                    clearTimeout(operationTimeout);
                    conn.end();
                    
                    if (code !== 0) {
                        if (stderr.includes('No such file or directory')) {
                            console.log(chalk.yellow(`⚠️ Target directory ${config.remotePath} does not exist yet.`));
                            resolve({ exists: false, hasFiles: false });
                            return;
                        }
                        reject(new Error(`Failed to check target directory: ${stderr}`));
                        return;
                    }
                    
                    // Parse the output to check if there are files (excluding . and ..)
                    const lines = output.split('\n').filter(line => line.trim() !== '');
                    
                    // First line is total, and then we have . and .. entries
                    // If there are more than 3 lines, there are other files/directories
                    const hasFiles = lines.length > 3;
                    
                    if (hasFiles) {
                        // Count the number of files/directories
                        const fileCount = lines.length - 3; // Subtract total line, . and ..
                        console.log(chalk.yellow(`⚠️ Target directory ${config.remotePath} contains ${fileCount} existing files/directories.`));
                    } else {
                        console.log(chalk.green(`✅ Target directory ${config.remotePath} exists but is empty.`));
                    }
                    
                    resolve({ exists: true, hasFiles });
                });
            });
        });
        
        conn.on('error', (err) => {
            clearTimeout(operationTimeout);
            conn.end();
            
            // Provide more helpful error messages for common issues
            if (err.message.includes('connect ETIMEDOUT')) {
                reject(new Error(`SSH connection timed out. Please check your network connection and server availability.`));
            } else if (err.message.includes('Authentication failed')) {
                reject(new Error(`SSH authentication failed. Please check your username, password, or SSH key.`));
            } else {
                reject(new Error(`SSH connection error: ${err.message}`));
            }
        });
        
        conn.on('timeout', () => {
            clearTimeout(operationTimeout);
            conn.end();
            reject(new Error('SSH connection timeout. This could be due to network issues or server load.'));
        });
        
        // Connect with password or key
        const connectConfig = {
            host: config.host,
            port: 22,
            username: config.username,
            readyTimeout: 30000, // Increase timeout to 30 seconds
            keepaliveInterval: 10000 // Send keepalive packets every 10 seconds
        };
        
        if (config.password) {
            connectConfig.password = config.password;
        } else if (config.privateKeyPath) {
            try {
                connectConfig.privateKey = fs.readFileSync(config.privateKeyPath);
            } catch (error) {
                clearTimeout(operationTimeout);
                reject(new Error(`Failed to read private key: ${error.message}`));
                return;
            }
        }
        
        conn.connect(connectConfig);
    });
}

// Function to clean target directory
async function cleanTargetDirectory(config) {
    console.log(chalk.blue('\n🧹 Cleaning target directory...'));
    
    return new Promise((resolve, reject) => {
        const conn = new Client();
        let operationTimeout;
        
        // Set a 2-minute timeout for the entire operation
        operationTimeout = setTimeout(() => {
            console.log(chalk.yellow('⚠️ Directory cleaning is taking longer than expected...'));
            console.log(chalk.yellow('   This could be due to a large number of files or slow server response.'));
            console.log(chalk.yellow('   The operation will continue, but you can press Ctrl+C to cancel.'));
            
            // Set another timeout for critical failure
            setTimeout(() => {
                conn.end();
                reject(new Error('Directory cleaning timed out after 5 minutes. Please try cleaning manually.'));
            }, 180000); // 3 more minutes (5 minutes total)
        }, 120000); // 2 minutes
        
        conn.on('ready', () => {
            console.log(chalk.blue('🔌 SSH connection established.'));
            console.log(chalk.blue('🗑️  Removing files from target directory... (this may take a while)'));
            
            // Execute rm command to remove all files (but not the directory itself)
            conn.exec(`rm -rf ${config.remotePath}/*`, (err, stream) => {
                if (err) {
                    clearTimeout(operationTimeout);
                    conn.end();
                    reject(new Error(`Failed to clean target directory: ${err.message}`));
                    return;
                }
                
                let stderr = '';
                
                stream.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                
                stream.on('data', (data) => {
                    // If there's any output, log it
                    const output = data.toString().trim();
                    if (output) {
                        console.log(chalk.blue(`   ${output}`));
                    }
                });
                
                stream.on('close', (code) => {
                    clearTimeout(operationTimeout);
                    conn.end();
                    
                    if (code !== 0) {
                        reject(new Error(`Failed to clean target directory: ${stderr}`));
                        return;
                    }
                    
                    console.log(chalk.green(`✅ Target directory ${config.remotePath} has been cleaned.`));
                    resolve();
                });
            });
        });
        
        conn.on('error', (err) => {
            clearTimeout(operationTimeout);
            conn.end();
            reject(new Error(`SSH connection error: ${err.message}`));
        });
        
        conn.on('timeout', () => {
            clearTimeout(operationTimeout);
            conn.end();
            reject(new Error('SSH connection timeout'));
        });
        
        // Connect with password or key
        const connectConfig = {
            host: config.host,
            port: 22,
            username: config.username,
            readyTimeout: 30000, // Increase timeout to 30 seconds
            keepaliveInterval: 10000 // Send keepalive packets every 10 seconds
        };
        
        if (config.password) {
            connectConfig.password = config.password;
        } else if (config.privateKeyPath) {
            try {
                connectConfig.privateKey = fs.readFileSync(config.privateKeyPath);
            } catch (error) {
                clearTimeout(operationTimeout);
                reject(new Error(`Failed to read private key: ${error.message}`));
                return;
            }
        }
        
        conn.connect(connectConfig);
    });
}

// Run build process
async function runBuild(config) {
    console.log(chalk.blue('\n🔨 Running build process...'));
    
    // Check if this is a Vite project
    const isViteProject = fs.existsSync(path.join(config.localPath, 'vite.config.js')) || 
                          fs.existsSync(path.join(config.localPath, 'vite.config.ts')) ||
                          (config.buildCommand && config.buildCommand.includes('vite'));
    
    if (isViteProject) {
        console.log(chalk.cyan('📦 Detected Vite project - optimizing build process...'));
    }
    
    console.log(chalk.blue(`📋 Executing: ${config.buildCommand}`));
    
    return new Promise((resolve, reject) => {
        // Use child_process.spawn to show real-time output
        const build = spawn(config.buildCommand, {
            shell: true,
            cwd: config.localPath,
            stdio: 'pipe'
        });
        
        let buildOutput = '';
        let errorOutput = '';
        let isBuilding = false;
        
        build.stdout.on('data', (data) => {
            const output = data.toString();
            buildOutput += output;
            
            // Highlight Vite-specific messages
            if (isViteProject) {
                if (output.includes('vite v')) {
                    console.log(chalk.cyan(output));
                } else if (output.includes('building for production')) {
                    console.log(chalk.cyan(output));
                    isBuilding = true;
                } else if (output.includes('built in')) {
                    console.log(chalk.green(output));
                } else {
                    console.log(output);
                }
            } else {
                console.log(output);
            }
        });
        
        build.stderr.on('data', (data) => {
            const output = data.toString();
            errorOutput += output;
            console.log(chalk.yellow(output));
        });
        
        build.on('error', (error) => {
            console.error(chalk.red(`\n❌ Failed to start build process: ${error.message}`));
            
            if (isViteProject) {
                // Vite-specific error handling
                if (error.message.includes('command not found') && config.buildCommand.includes('vite')) {
                    console.log(chalk.yellow('ℹ️ It seems Vite is not installed. Try installing it with:'));
                    console.log(chalk.cyan('  npm install vite --save-dev'));
                } else if (error.message.includes('Node.js')) {
                    console.log(chalk.yellow('ℹ️ Vite requires Node.js 14.18+ or 16+. Please update your Node.js version.'));
                }
            }
            
            reject(new Error(`Build failed: ${error.message}`));
        });
        
        build.on('close', (code) => {
            if (code !== 0) {
                console.error(chalk.red(`\n❌ Build process exited with code ${code}`));
                
                if (isViteProject) {
                    // Vite-specific error handling
                    if (errorOutput.includes('Error: Cannot find module')) {
                        console.log(chalk.yellow('ℹ️ Missing dependencies detected. Try running:'));
                        console.log(chalk.cyan('  npm install'));
                    } else if (errorOutput.includes('SyntaxError')) {
                        console.log(chalk.yellow('ℹ️ Syntax error in your code. Check the error message above for details.'));
                    }
                }
                
                // Check if the build output directory exists despite error
                const outputDir = path.join(config.localPath, config.buildOutputDir);
                if (fs.existsSync(outputDir)) {
                    console.log(chalk.yellow('\n⚠️ Build exited with an error, but the output directory exists.'));
                    
                    // For Vite, check if dist contains index.html
                    if (isViteProject) {
                        const indexPath = path.join(outputDir, 'index.html');
                        if (fs.existsSync(indexPath)) {
                            console.log(chalk.yellow('ℹ️ Found index.html in the output directory, the build might be usable.'));
                            
                            // Count files to see if it's a reasonable build
                            try {
                                const files = fs.readdirSync(outputDir);
                                const assetDir = path.join(outputDir, 'assets');
                                const hasAssets = fs.existsSync(assetDir) && fs.readdirSync(assetDir).length > 0;
                                
                                if (files.length > 3 || hasAssets) {
                                    console.log(chalk.green('✅ Output directory contains files, proceeding with deployment.'));
                                    return resolve();
                                }
                            } catch (err) {
                                // Ignore errors counting files
                            }
                        }
                    }
                }
                
                // Ask user if they want to continue
                const readline = require('readline').createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                readline.question(chalk.yellow('\n⚠️ Do you want to continue with deployment despite build errors? (y/n) '), (answer) => {
                    readline.close();
                    
                    if (answer.toLowerCase() === 'y') {
                        console.log(chalk.yellow('⚠️ Continuing with deployment despite build errors...'));
                        resolve();
                    } else {
                        reject(new Error('Build failed and user chose to abort deployment'));
                    }
                });
            } else {
                // Build succeeded, check if output directory exists
                const outputDir = path.join(config.localPath, config.buildOutputDir);
                if (!fs.existsSync(outputDir)) {
                    console.error(chalk.red(`\n❌ Build completed but output directory not found: ${config.buildOutputDir}`));
                    
                    if (isViteProject) {
                        console.log(chalk.yellow('ℹ️ For Vite projects, the default output directory is "dist".'));
                        console.log(chalk.yellow('   Update your configuration with the correct output directory.'));
                    }
                    
                    reject(new Error(`Build output directory not found: ${config.buildOutputDir}`));
                    return;
                }
                
                console.log(chalk.green('\n✅ Build completed successfully!'));
                resolve();
            }
        });
    });
}

// Main deploy function
async function deploy(configPath = 'dreamhost-config.json') {
    console.log(chalk.blue('\n🚀 Starting deployment to DreamHost'));
    
    try {
        // Load or create configuration
        const config = await loadOrCreateConfig(configPath);
        
        // Ask user for deploy mode
        console.log(chalk.blue('\n📋 Deployment Mode:'));
        
        // Check if this is a Vite project
        const isViteProject = fs.existsSync(path.join(config.localPath, 'vite.config.js')) || 
                             fs.existsSync(path.join(config.localPath, 'vite.config.ts')) ||
                             (config.buildCommand && config.buildCommand.includes('vite'));
        
        if (isViteProject) {
            console.log(chalk.cyan('📦 Detected Vite project!'));
        }
        
        // Determine the deployment mode
        let deployPath = config.localPath;
        
        // If build integration is enabled, run the build process
        if (config.buildIntegration) {
            try {
                // Run build process
                await runBuild(config);
                
                // Update deploy path to build output directory
                deployPath = path.join(config.localPath, config.buildOutputDir);
                
                console.log(chalk.green(`✅ Build completed. Will deploy from: ${deployPath}`));
                
                // Check if build directory exists and has files
                if (!fs.existsSync(deployPath)) {
                    throw new Error(`Build directory not found: ${deployPath}`);
                }
                
                const files = fs.readdirSync(deployPath);
                if (files.length === 0) {
                    throw new Error(`Build directory is empty: ${deployPath}`);
                }
                
                // For Vite projects, verify we have an index.html
                if (isViteProject && !fs.existsSync(path.join(deployPath, 'index.html'))) {
                    console.log(chalk.yellow('⚠️ Warning: No index.html found in build directory. Vite build may have failed.'));
                }
            } catch (error) {
                console.error(chalk.red(`❌ Build process failed: ${error.message}`));
                
                // Ask if user wants to continue with deployment from source directory
                const readline = require('readline').createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                const answer = await new Promise(resolve => {
                    readline.question(chalk.yellow('\n⚠️ Do you want to continue with deployment from source directory? (y/n) '), (answer) => {
                        readline.close();
                        resolve(answer.toLowerCase());
                    });
                });
                
                if (answer !== 'y') {
                    console.log(chalk.yellow('Deployment cancelled.'));
                    return;
                }
                
                console.log(chalk.yellow(`⚠️ Continuing with deployment from source directory: ${config.localPath}`));
                deployPath = config.localPath;
            }
        }
        
        // Check and setup server if needed
        await checkAndSetupServerIfNeeded(config);
        
        // Save configuration with updated build settings
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        
        // Deploy using native SSH/SCP
        await deployWithNativeSSH(config, deployPath);
        
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
    if (config.exclude && config.exclude.length > 0) {
        for (const pattern of config.exclude) {
            rsyncCmd += ` --exclude="${pattern}"`;
        }
    } else {
        // Default excludes
        rsyncCmd += ` --exclude="node_modules" --exclude=".git" --exclude=".env" --exclude=".DS_Store"`;
    }
    
    // Default excludes for common build tools
    rsyncCmd += ` --exclude=".next" --exclude=".nuxt" --exclude=".cache"`;
    
    // Handle trailing slashes for rsync
    const localPathWithSlash = localPath.endsWith('/') ? localPath : `${localPath}/`;
    
    // If using password authentication
    if (config.password) {
        console.log(chalk.blue('🔑 Using password authentication for rsync'));
        
        // Create a temporary file for rsync password
        const passwordFilePath = path.join(os.tmpdir(), `rsync-password-${Date.now()}`);
        fs.writeFileSync(passwordFilePath, config.password);
        fs.chmodSync(passwordFilePath, '600'); // Secure permissions
        
        rsyncCmd += ` --password-file="${passwordFilePath}" "${localPathWithSlash}" ${config.username}@${config.host}:${remotePath}/`;
        
        try {
            console.log(chalk.blue('📦 Running rsync with password authentication...'));
            const result = execSync(rsyncCmd, { stdio: 'pipe' });
            console.log(chalk.green('✅ Rsync completed successfully!'));
            
            // Clean up the password file
            fs.unlinkSync(passwordFilePath);
            
            return result;
        } catch (error) {
            // Clean up the password file
            try {
                fs.unlinkSync(passwordFilePath);
            } catch (e) {
                // Ignore errors during cleanup
            }
            
            console.error(chalk.red(`❌ Rsync failed: ${error.message}`));
            throw error;
        }
    } else if (config.privateKeyPath) {
        // Using SSH key authentication
        console.log(chalk.blue('🔑 Using SSH key authentication for rsync'));
        
        // Check if Ed25519 key exists and use it instead of RSA if available
        let keyPath = config.privateKeyPath;
        const ed25519KeyPath = path.join(path.dirname(config.privateKeyPath), 'id_ed25519');
        
        if (fs.existsSync(ed25519KeyPath)) {
            console.log(chalk.blue('🔑 Using Ed25519 key for better compatibility'));
            keyPath = ed25519KeyPath;
        }
        
        rsyncCmd += ` -e "ssh -i ${keyPath}" "${localPathWithSlash}" ${config.username}@${config.host}:${remotePath}/`;
        
        try {
            console.log(chalk.blue('📦 Running rsync with SSH key authentication...'));
            const result = execSync(rsyncCmd, { stdio: 'pipe' });
            console.log(chalk.green('✅ Rsync completed successfully!'));
            return result;
        } catch (error) {
            console.error(chalk.red(`❌ Rsync failed: ${error.message}`));
            throw error;
        }
    } else {
        // No authentication specified, try default SSH authentication
        console.log(chalk.blue('🔑 Using default SSH authentication for rsync'));
        
        rsyncCmd += ` "${localPathWithSlash}" ${config.username}@${config.host}:${remotePath}/`;
        
        try {
            console.log(chalk.blue('📦 Running rsync with default authentication...'));
            const result = execSync(rsyncCmd, { stdio: 'pipe' });
            console.log(chalk.green('✅ Rsync completed successfully!'));
            return result;
        } catch (error) {
            console.error(chalk.red(`❌ Rsync failed: ${error.message}`));
            throw error;
        }
    }
}

// Deploy using scp (backup method for Windows)
async function deployWithScp(config, localPath, remotePath) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(chalk.blue('\n🚀 Using SCP for deployment...'));
            
            // Get all files in the local directory, excluding node_modules and git
            const filesToExclude = [
                'node_modules/**',
                '.git/**',
                '.github/**',
                'package-lock.json',
                '*.log',
                '.DS_Store',
                'Thumbs.db',
                ...(config.exclude || [])
            ];
            
            const getAllFiles = (dir, excludePatterns) => {
                const list = fs.readdirSync(dir);
                let fileList = [];
                
                list.forEach(file => {
                    const fullPath = path.join(dir, file);
                    const relativePath = path.relative(localPath, fullPath);
                    
                    // Check if file/directory should be excluded
                    const shouldExclude = excludePatterns.some(pattern => {
                        try {
                            return minimatch(relativePath, pattern, { dot: true, matchBase: true });
                        } catch (err) {
                            // Fallback to simple string matching if minimatch fails
                            return pattern.includes('*') ? 
                                relativePath.includes(pattern.replace('**', '').replace('*', '')) : 
                                relativePath === pattern;
                        }
                    });
                    
                    if (shouldExclude) {
                        return;
                    }
                    
                    const isDirectory = fs.statSync(fullPath).isDirectory();
                    
                    if (isDirectory) {
                        fileList = fileList.concat(getAllFiles(fullPath, excludePatterns));
                    } else {
                        fileList.push(relativePath);
                    }
                });
                
                return fileList;
            };
            
            // Get all files
            const files = getAllFiles(localPath, filesToExclude);
            
            if (files.length === 0) {
                reject(new Error('No files found to deploy. Check your path and exclusion patterns.'));
                return;
            }
            
            console.log(chalk.blue(`🔍 Found ${files.length} files to transfer`));
            
            // Create directories first (SCP doesn't create directories automatically)
            const directories = new Set();
            files.forEach(file => {
                const dir = path.dirname(file);
                if (dir !== '.') {
                    directories.add(dir);
                }
            });
            
            // Sort directories by depth to ensure parent directories are created first
            const sortedDirectories = Array.from(directories).sort((a, b) => {
                return a.split('/').length - b.split('/').length;
            });
            
            if (sortedDirectories.length > 0) {
                console.log(chalk.blue(`🗂️ Creating ${sortedDirectories.length} directories...`));
                
                for (const dir of sortedDirectories) {
                    try {
                        let sshCmd;
                        if (config.password) {
                            // Create temporary expect script for SSH with password
                            const expectScriptPath = path.join(os.tmpdir(), `dreamhost-ssh-${Date.now()}.expect`);
                            fs.writeFileSync(expectScriptPath, `
#!/usr/bin/expect -f
spawn ssh ${config.username}@${config.host} "mkdir -p ${remotePath}/${dir.replace(/\\/g, '/')}"
expect {
    "password:" { send "${config.password}\\r"; exp_continue }
    "Permission denied" { exit 1 }
    eof { exit }
}
                            `);
                            fs.chmodSync(expectScriptPath, '755');
                            sshCmd = expectScriptPath;
                            
                            // Clean up after execution
                            process.on('exit', () => {
                                try {
                                    fs.unlinkSync(expectScriptPath);
                                } catch (e) {
                                    // Ignore errors during cleanup
                                }
                            });
                        } else {
                            // Use key authentication
                            let keyPath = '';
                            if (config.privateKeyPath) {
                                keyPath = `-i "${config.privateKeyPath}"`;
                            }
                            
                            sshCmd = `ssh ${keyPath} ${config.username}@${config.host} "mkdir -p ${remotePath}/${dir.replace(/\\/g, '/')}"`;
                        }
                        
                        execSync(sshCmd, { stdio: 'ignore' });
                    } catch (error) {
                        console.error(chalk.red(`❌ Failed to create directory: ${dir}`));
                        console.error(chalk.red(`Error details: ${error.message}`));
                        
                        // Continue with other directories instead of failing completely
                        console.log(chalk.yellow('⚠️ Continuing with remaining directories...'));
                    }
                }
            }
            
            // Now transfer the files
            console.log(chalk.blue('\n📤 Transferring files...'));
            let fileCount = 0;
            let successCount = 0;
            
            for (const file of files) {
                fileCount++;
                process.stdout.write(`\r${chalk.blue(`Transferring file ${fileCount}/${files.length}: ${file}`)}`);
                
                let scpCmd;
                
                if (config.password) {
                    // Create temporary expect script for SCP with password
                    const expectScriptPath = path.join(os.tmpdir(), `dreamhost-scp-${Date.now()}.expect`);
                    fs.writeFileSync(expectScriptPath, `
#!/usr/bin/expect -f
spawn scp "${path.join(localPath, file)}" ${config.username}@${config.host}:"${remotePath}/${file.replace(/\\/g, '/')}"
expect {
    "password:" { send "${config.password}\\r"; exp_continue }
    "Permission denied" { exit 1 }
    eof { exit }
}
                    `);
                    fs.chmodSync(expectScriptPath, '755');
                    scpCmd = expectScriptPath;
                    
                    // Clean up after execution
                    process.on('exit', () => {
                        try {
                            fs.unlinkSync(expectScriptPath);
                        } catch (e) {
                            // Ignore errors during cleanup
                        }
                    });
                } else {
                    // Use key authentication
                    let keyPath = '';
                    if (config.privateKeyPath) {
                        keyPath = `-i "${config.privateKeyPath}"`;
                    }
                    
                    scpCmd = `scp ${keyPath} "${path.join(localPath, file)}" ${config.username}@${config.host}:"${remotePath}/${file.replace(/\\/g, '/')}"`;
                }
                
                try {
                    execSync(scpCmd, { stdio: 'ignore' });
                    successCount++;
                } catch (error) {
                    console.error(chalk.red(`\n❌ Failed to transfer file: ${file}`));
                    console.error(chalk.red(`Error details: ${error.message}`));
                    
                    // Continue with other files instead of failing completely
                    console.log(chalk.yellow('⚠️ Continuing with remaining files...'));
                }
            }
            
            console.log(chalk.green(`\n\n✅ Successfully transferred ${successCount}/${files.length} files!`));
            
            if (successCount === 0) {
                reject(new Error('Failed to transfer any files. Please check your configuration and try again.'));
                return;
            }
            
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

// Simplified deployment using native SSH/SCP commands (cross-platform)
async function deployWithNativeSSH(config, localPath) {
    console.log(chalk.blue('\n🚀 Using native SSH/SCP for deployment (cross-platform)...'));
    
    // Check if this is a Vite project
    const isViteProject = fs.existsSync(path.join(config.localPath, 'vite.config.js')) || 
                         fs.existsSync(path.join(config.localPath, 'vite.config.ts')) ||
                         (config.buildCommand && config.buildCommand.includes('vite'));
    
    // Get all files, excluding node_modules, git, and other common exclude patterns
    const filesToExclude = [
        'node_modules/**',
        '.git/**',
        '.github/**',
        '.vscode/**',
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
        '*.log',
        '.DS_Store',
        'Thumbs.db',
        'README.md',
        'LICENSE',
        '.gitignore',
        '.env',
        '.env.*',
        ...(config.exclude || [])
    ];
    
    // Add Vite-specific exclusions if this is a Vite project and we're not using build integration
    // (if build integration is enabled, we'll be deploying from the build directory anyway)
    if (isViteProject && !config.buildIntegration) {
        filesToExclude.push(
            'public/**',          // Source assets that get copied to dist
            'src/**',             // Source code
            'vite.config.js',     // Vite configuration
            'vite.config.ts',     // TypeScript Vite configuration
            'tsconfig.json',      // TypeScript configuration
            'index.html',         // Source index.html (gets processed into dist)
            'tests/**',           // Test files
            'cypress/**',         // Cypress test files
            'vitest.config.js',   // Vitest configuration
            'vitest.config.ts',   // TypeScript Vitest configuration
            'playwright.config.js', // Playwright configuration
            'playwright.config.ts'  // TypeScript Playwright configuration
        );
    }
    
    // Get all files, with exclusions
    // ... rest of the function ...
}

// Function to run the deployment process
async function runDeploy(configPath) {
    try {
        console.log(chalk.bold.blue('\n🚀 DreamHost Deployer\n'));
        
        const config = await loadOrCreateConfig(configPath);
        await deploy(configPath);
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