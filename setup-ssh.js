const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const inquirer = require('inquirer');

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
    
    // Check if config exists
    if (fs.existsSync(configPath)) {
        const { overwrite } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'overwrite',
                message: `${colors.yellow}Configuration file already exists. Overwrite?${colors.reset}`,
                default: false
            }
        ]);
        
        if (!overwrite) {
            console.log(`${colors.blue}Keeping existing configuration.${colors.reset}`);
            return;
        }
    }
    
    console.log(`${colors.blue}Creating new configuration...${colors.reset}`);
    
    // Create template
    const config = {
        host: '',
        username: '',
        remotePath: '',
        localPath: '',
        privateKeyPath: '',
        targetFolder: '',
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
            message: 'Enter server hostname (e.g., example.com):'
        },
        {
            type: 'input',
            name: 'username',
            message: 'Enter server username:'
        },
        {
            type: 'input',
            name: 'targetFolder',
            message: 'Enter target folder/domain (e.g., example.com):'
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
    
    console.log(`${colors.blue}Remote path set to: ${config.remotePath}${colors.reset}`);
    
    // Write config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`${colors.green}Configuration saved to ${configPath}${colors.reset}`);
}

// Generate SSH key
async function generateSSHKey(keyPath) {
    try {
        // Check if key already exists
        if (fs.existsSync(keyPath)) {
            const { overwrite } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'overwrite',
                    message: `${colors.yellow}SSH key already exists at ${keyPath}. Overwrite?${colors.reset}`,
                    default: false
                }
            ]);
            
            if (!overwrite) {
                console.log(`${colors.blue}Keeping existing SSH key.${colors.reset}`);
                return keyPath;
            }
        }
        
        // Generate key
        console.log(`${colors.blue}Generating new SSH key...${colors.reset}`);
        execSync(`ssh-keygen -t rsa -b 4096 -f "${keyPath}" -N "" -C "dreamhost-deployer"`);
        console.log(`${colors.green}SSH key generated at ${keyPath}${colors.reset}`);
        
        return keyPath;
    } catch (error) {
        console.error(`${colors.red}Error generating SSH key: ${error.message}${colors.reset}`);
        throw error;
    }
}

// Setup SSH
async function setupSSH() {
    try {
        console.log(`${colors.green}Setting up SSH for DreamHost deployment...${colors.reset}`);
        
        // Load or create configuration
        let config;
        const configPath = 'deploy.config.json';
        
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } else {
            console.log(`${colors.yellow}Configuration file not found. Creating new configuration...${colors.reset}`);
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
            console.log(`${colors.blue}Your public SSH key:${colors.reset}`);
            console.log(publicKey);
            console.log(`${colors.yellow}Add this key to your DreamHost account at:${colors.reset}`);
            console.log(`https://panel.dreamhost.com/index.cgi?tree=users.ssh&`);
        } else {
            console.error(`${colors.red}Public key not found at ${publicKeyPath}${colors.reset}`);
        }
        
        console.log(`${colors.green}SSH setup completed!${colors.reset}`);
    } catch (error) {
        console.error(`${colors.red}SSH setup failed: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

// Main function
async function run() {
    await setupSSH();
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