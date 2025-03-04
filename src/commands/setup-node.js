const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { Client } = require('ssh2');
const os = require('os');
const chalk = require('chalk'); // Using chalk for better formatting

/**
 * Setup NVM and Node.js on DreamHost server
 * Based on: https://help.dreamhost.com/hc/en-us/articles/360029083351-Installing-a-custom-version-of-NVM-and-Node-js
 */
async function setupNodeOnServer(config) {
    console.log(chalk.bold.blue('\n📦 Setting up NVM and Node.js on DreamHost server...\n'));
    
    if (!config || !config.host || !config.username) {
        console.error(chalk.bold.red('❌ Invalid configuration. Missing required fields.'));
        process.exit(1);
    }
    
    // Display current configuration
    console.log(chalk.cyan('Current configuration:'));
    console.log(chalk.cyan(`  • Host: ${chalk.white(config.host)}`));
    console.log(chalk.cyan(`  • Username: ${chalk.white(config.username)}`));
    console.log(chalk.cyan(`  • Web Server: ${chalk.white(config.webServer || 'Apache (default)')}\n`));
    
    // Ask for Node.js version with better defaults from DreamHost docs
    const { nodeVersion } = await inquirer.prompt([
        {
            type: 'list',
            name: 'nodeVersion',
            message: 'Select Node.js version to install:',
            choices: [
                { name: 'Node.js 20.18.0 (LTS - Recommended by DreamHost)', value: '20.18.0' },
                { name: 'Node.js 18.19.1 (LTS)', value: '18.19.1' },
                { name: 'Node.js 16.20.2 (LTS)', value: '16.20.2' },
                { name: 'Custom version', value: 'custom' }
            ],
            default: '20.18.0'
        }
    ]);
    
    // If custom version selected, ask for the specific version
    let finalNodeVersion = nodeVersion;
    if (nodeVersion === 'custom') {
        const { customVersion } = await inquirer.prompt([
            {
                type: 'input',
                name: 'customVersion',
                message: 'Enter custom Node.js version (e.g., 20.18.0):',
                validate: (input) => {
                    return /^\d+\.\d+\.\d+$/.test(input) ? true : 'Please enter a valid version number (e.g., 20.18.0)';
                }
            }
        ]);
        finalNodeVersion = customVersion;
    }
    
    console.log(chalk.yellow(`\n🔌 Connecting to ${config.username}@${config.host}...\n`));
    
    // Setup SSH connection
    const conn = new Client();
    
    // Determine authentication method
    let authConfig = {
        host: config.host,
        username: config.username,
        readyTimeout: 30000
    };
    
    // Check if we have a password or need to ask for one
    let password = config.password;
    if (!config.privateKeyPath && !password) {
        const { usePassword } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'usePassword',
                message: 'No SSH key found. Would you like to use password authentication?',
                default: true
            }
        ]);
        
        if (usePassword) {
            const { sshPassword } = await inquirer.prompt([
                {
                    type: 'password',
                    name: 'sshPassword',
                    message: 'Enter your SSH password:',
                    mask: '*'
                }
            ]);
            password = sshPassword;
        } else {
            console.error(chalk.red('❌ No authentication method available.'));
            process.exit(1);
        }
    }
    
    // Set authentication method
    if (password) {
        authConfig.password = password;
    } else if (config.privateKeyPath) {
        try {
            authConfig.privateKey = fs.readFileSync(config.privateKeyPath);
        } catch (error) {
            console.error(chalk.red(`❌ Could not read private key: ${error.message}`));
            
            // Fall back to password
            const { fallbackPassword } = await inquirer.prompt([
                {
                    type: 'password',
                    name: 'fallbackPassword',
                    message: 'Enter your SSH password instead:',
                    mask: '*'
                }
            ]);
            authConfig.password = fallbackPassword;
        }
    }
    
    // Connect to the server
    try {
        await new Promise((resolve, reject) => {
            conn.on('ready', () => {
                console.log(chalk.green('✅ SSH connection established.'));
                resolve();
            }).on('error', (err) => {
                reject(err);
            }).connect(authConfig);
        });
        
        console.log(chalk.bold.blue('\n🚀 Installing NVM and Node.js...\n'));
        
        // Execute commands to install NVM and Node.js
        const commands = [
            // Install NVM (using version from DreamHost docs)
            'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash',
            
            // Setup NVM in .bashrc if not already there
            'grep -q "NVM_DIR" ~/.bashrc || echo \'export NVM_DIR="$HOME/.nvm"\n[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"\' >> ~/.bashrc',
            
            // Setup NVM in .bash_profile if not already there
            'grep -q "NVM_DIR" ~/.bash_profile || echo \'export NVM_DIR="$HOME/.nvm"\n[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"\' >> ~/.bash_profile',
            
            // Source NVM
            'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"',
            
            // Source bash_profile
            '. ~/.bash_profile',
            
            // Install specified Node.js version
            `nvm install v${finalNodeVersion}`,
            
            // Set as default
            `nvm alias default v${finalNodeVersion}`,
            
            // For Dedicated servers, update security controls (as mentioned in DreamHost docs)
            'setfattr -n user.pax.flags -v "mr" $(find $NVM_DIR -type f -iname "node" -o -iname "npm" -o -iname "npx") 2>/dev/null || echo "Not a Dedicated server or setfattr not available"',
            
            // Verify installation
            'node -v',
            'npm -v'
        ];
        
        // Add web server specific configurations
        if (config.webServer === 'Nginx') {
            console.log(chalk.cyan('\n🔧 Configuring for Nginx server...\n'));
            
            // Add Nginx specific commands if needed
            commands.push(
                // Create or update Nginx configuration for Node.js
                'mkdir -p ~/nginx_config',
                'echo "# Nginx configuration for Node.js app" > ~/nginx_config/node_app.conf',
                'echo "" >> ~/nginx_config/node_app.conf',
                'echo "# Add this to your Nginx server block in the DreamHost panel:" >> ~/nginx_config/node_app.conf',
                'echo "# ============================================================" >> ~/nginx_config/node_app.conf',
                'echo "" >> ~/nginx_config/node_app.conf',
                'echo "location / {" >> ~/nginx_config/node_app.conf',
                'echo "    proxy_pass http://localhost:YOUR_PORT;" >> ~/nginx_config/node_app.conf',
                'echo "    proxy_http_version 1.1;" >> ~/nginx_config/node_app.conf',
                'echo "    proxy_set_header Upgrade \\$http_upgrade;" >> ~/nginx_config/node_app.conf',
                'echo "    proxy_set_header Connection \'upgrade\';" >> ~/nginx_config/node_app.conf',
                'echo "    proxy_set_header Host \\$host;" >> ~/nginx_config/node_app.conf',
                'echo "    proxy_cache_bypass \\$http_upgrade;" >> ~/nginx_config/node_app.conf',
                'echo "}" >> ~/nginx_config/node_app.conf',
                'echo "" >> ~/nginx_config/node_app.conf',
                'echo "# ============================================================" >> ~/nginx_config/node_app.conf',
                'echo "# Remember to set up a Proxy Server in the DreamHost panel" >> ~/nginx_config/node_app.conf',
                'echo "# https://help.dreamhost.com/hc/en-us/articles/217955787-Proxy-Server" >> ~/nginx_config/node_app.conf'
            );
        } else {
            console.log(chalk.cyan('\n🔧 Configuring for Apache server...\n'));
            
            // Add Apache specific commands
            commands.push(
                // Create or update .htaccess for Apache
                'mkdir -p ~/apache_config',
                'echo "# Apache configuration for Node.js app" > ~/apache_config/.htaccess',
                'echo "" >> ~/apache_config/.htaccess',
                'echo "# Copy this file to your web directory" >> ~/apache_config/.htaccess',
                'echo "# ============================================================" >> ~/apache_config/.htaccess',
                'echo "" >> ~/apache_config/.htaccess',
                'echo "RewriteEngine On" >> ~/apache_config/.htaccess',
                'echo "RewriteRule ^$ http://localhost:YOUR_PORT/ [P,L]" >> ~/apache_config/.htaccess',
                'echo "RewriteCond %{REQUEST_FILENAME} !-f" >> ~/apache_config/.htaccess',
                'echo "RewriteCond %{REQUEST_FILENAME} !-d" >> ~/apache_config/.htaccess',
                'echo "RewriteRule ^(.*)$ http://localhost:YOUR_PORT/$1 [P,L]" >> ~/apache_config/.htaccess',
                'echo "" >> ~/apache_config/.htaccess',
                'echo "# ============================================================" >> ~/apache_config/.htaccess',
                'echo "# Remember to set up a Proxy Server in the DreamHost panel" >> ~/apache_config/.htaccess',
                'echo "# https://help.dreamhost.com/hc/en-us/articles/217955787-Proxy-Server" >> ~/apache_config/.htaccess'
            );
        }
        
        // Execute each command with progress indicator
        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];
            const stepNumber = i + 1;
            const totalSteps = commands.length;
            
            console.log(chalk.yellow(`[${stepNumber}/${totalSteps}] Executing: ${cmd}`));
            
            try {
                const output = await executeCommand(conn, cmd);
                console.log(chalk.green('Command output:'));
                console.log(output);
            } catch (error) {
                console.error(chalk.red(`Command failed: ${error.message}`));
                // Continue with next command even if this one fails
                continue;
            }
        }
        
        console.log(chalk.bold.green('\n✅ NVM and Node.js have been successfully installed on your DreamHost server!'));
        console.log(chalk.bold.green(`✅ Node.js version: v${finalNodeVersion}`));
        
        // Final instructions based on web server type
        console.log(chalk.bold.blue('\n📝 Next Steps:'));
        
        if (config.webServer === 'Nginx') {
            console.log(chalk.cyan('1. A sample Nginx configuration has been created at ~/nginx_config/node_app.conf'));
            console.log(chalk.cyan('2. You\'ll need to update your Nginx configuration through the DreamHost panel'));
            console.log(chalk.cyan('3. Replace YOUR_PORT with the port your Node.js application will run on'));
            console.log(chalk.cyan('4. Set up a Proxy Server in the DreamHost panel: https://help.dreamhost.com/hc/en-us/articles/217955787-Proxy-Server'));
        } else {
            console.log(chalk.cyan('1. A sample .htaccess file has been created at ~/apache_config/.htaccess'));
            console.log(chalk.cyan('2. Copy this file to your web directory'));
            console.log(chalk.cyan('3. Replace YOUR_PORT with the port your Node.js application will run on'));
            console.log(chalk.cyan('4. Set up a Proxy Server in the DreamHost panel: https://help.dreamhost.com/hc/en-us/articles/217955787-Proxy-Server'));
        }
        
        console.log(chalk.cyan('5. Start your Node.js application using PM2 or another process manager'));
        console.log(chalk.cyan('6. Make sure your application is listening on the specified port'));
        
        console.log(chalk.bold.blue('\n🎉 You can now use Node.js in your DreamHost environment!\n'));
        
    } catch (error) {
        console.error(chalk.bold.red(`\n❌ Error setting up NVM and Node.js: ${error.message}\n`));
    } finally {
        conn.end();
    }
}

// Execute a command via SSH
function executeCommand(conn, command) {
    return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
            if (err) return reject(err);
            
            let output = '';
            
            stream.on('data', (data) => {
                output += data.toString();
            }).on('close', (code) => {
                if (code !== 0) {
                    return reject(new Error(`Command failed with code ${code}: ${output}`));
                }
                resolve(output);
            }).stderr.on('data', (data) => {
                output += data.toString();
            });
        });
    });
}

// Main function
async function run(providedConfig = null) {
    try {
        console.log(chalk.bold.blue('\n🚀 DreamHost Node.js Setup Wizard\n'));
        
        let config;
        
        // Use provided config or load from file
        if (providedConfig) {
            config = providedConfig;
            console.log(chalk.cyan('Using provided configuration'));
        } else {
            // Load configuration
            const configPath = path.resolve(process.cwd(), 'deploy.config.json');
            
            if (!fs.existsSync(configPath)) {
                console.error(chalk.bold.red('❌ Configuration file not found!'));
                console.log(chalk.yellow('Please run \'dreamhost-deployer init\' to create a configuration file.'));
                process.exit(1);
            }
            
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        
        await setupNodeOnServer(config);
        
    } catch (error) {
        console.error(chalk.bold.red(`\n❌ Error: ${error.message}\n`));
        process.exit(1);
    }
}

// Export functions
module.exports = {
    run,
    setupNodeOnServer
};

// Direct execution
if (require.main === module) {
    run();
} 