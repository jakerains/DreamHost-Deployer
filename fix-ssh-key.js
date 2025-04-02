#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs');

// This file is kept for compatibility but now only removes SSH keys from config

async function run() {
    console.log(chalk.bold.blue('\n🔧 DreamHost Deployer Auth Migration Tool\n'));
    
    try {
        // Check if config exists
        const configPath = 'deploy.config.json';
        if (!fs.existsSync(configPath)) {
            console.log(chalk.yellow('⚠️ No configuration file found. No changes needed.'));
            return;
        }
        
        // Load config
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Remove privateKeyPath if it exists
        if (config.privateKeyPath) {
            console.log(chalk.cyan('📂 Updating configuration...'));
            delete config.privateKeyPath;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log(chalk.green('✅ SSH key authentication has been removed from configuration.'));
            console.log(chalk.yellow('⚠️ The system now uses password authentication only.'));
        } else {
            console.log(chalk.green('✅ Configuration is already using password authentication.'));
        }
        
        console.log(chalk.cyan('\nTo set up password authentication, run:'));
        console.log(chalk.cyan('dreamhost-deployer setup'));
        
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