const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const os = require('os');
const inquirer = require('inquirer');

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
        console.log(`${colors.yellow}Configuration file not found: ${configPath}${colors.reset}`);
        console.log(`${colors.red}Please run 'dreamhost-deployer init' to create a configuration file.${colors.reset}`);
        process.exit(1);
    }
    
    try {
        // Load config
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config;
    } catch (error) {
        console.error(`${colors.red}Error loading configuration: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

const fixPath = (filePath) => {
    return filePath.replace(/\\/g, '/');
};

// Main deploy function
async function deploy(config) {
    try {
        console.log(`${colors.blue}Starting deployment to DreamHost...${colors.reset}`);
        
        // Validate configuration
        if (!config.host || !config.username || !config.remotePath || !config.localPath) {
            console.error(`${colors.red}Invalid configuration. Missing required fields.${colors.reset}`);
            process.exit(1);
        }

        // Normalize paths
        const localPath = path.resolve(config.localPath);
        const remotePath = config.remotePath;
        
        // Check if local path exists
        if (!fs.existsSync(localPath)) {
            console.error(`${colors.red}Local path does not exist: ${localPath}${colors.reset}`);
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
        
        console.log(`${colors.yellow}Executing: ${rsyncCmd}${colors.reset}`);
        
        // Execute rsync
        const { stdout, stderr } = await execAsync(rsyncCmd);
        
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        
        console.log(`${colors.green}Deployment completed successfully!${colors.reset}`);
        
    } catch (error) {
        console.error(`${colors.red}Deployment failed: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

// Function to run the deployment process
async function runDeploy(configPath) {
    try {
        const config = await loadOrCreateConfig(configPath);
        await deploy(config);
    } catch (error) {
        console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
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