/**
 * DreamHost Deployer
 * Version 0.6.2
 * 
 * Deploy command implementation with enhanced UI
 */

const path = require('path');
const inquirer = require('inquirer');
const ui = require('../utils/ui');

// Import modular components
const configManager = require('../utils/config-manager');
const deployment = require('../utils/deployment');
const buildIntegration = require('../utils/build-integration');
const { checkAndSetupServerIfNeeded } = require('../utils/server-check');

// Default config path
const DEFAULT_CONFIG_PATH = path.join(process.cwd(), 'deploy.config.json');

/**
 * Main deployment function
 * @param {Object} options Deployment options
 */
async function deploy(options = {}) {
  ui.sectionHeader('DREAMHOST DEPLOYMENT');
  
  const configPath = options.configPath || DEFAULT_CONFIG_PATH;
  
  try {
    // Load or create configuration
    const loadSpinner = ui.spinner('Loading configuration...');
    loadSpinner.start();
    let config = configManager.loadConfig(configPath);
    await new Promise(resolve => setTimeout(resolve, 800));
    loadSpinner.stop();
    
    if (!config) {
      console.log(ui.warning(`No configuration found at ${configPath}`));
      
      // Check if we should create a new config
      const { createNew } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createNew',
          message: 'Would you like to create a new configuration?',
          default: true
        }
      ]);
      
      if (createNew) {
        // Check if this is potentially a Vite project
        const detectSpinner = ui.spinner('Detecting project type...');
        detectSpinner.start();
        const isVite = configManager.detectViteProject();
        await new Promise(resolve => setTimeout(resolve, 1000));
        detectSpinner.stop();
        
        if (isVite) {
          console.log(ui.info('Detected a Vite project! Using Vite-specific defaults...'));
          console.log(ui.projectTypeBadge('vite'));
        }
        
        const configSpinner = ui.spinner('Creating configuration...');
        configSpinner.start();
        config = await configManager.createConfig(configPath, isVite);
        await new Promise(resolve => setTimeout(resolve, 1000));
        configSpinner.stop();
      } else {
        console.log(ui.error('Deployment cancelled: No configuration available'));
        return;
      }
    }
    
    // Validate configuration
    const validateSpinner = ui.spinner('Validating configuration...');
    validateSpinner.start();
    const validationErrors = configManager.validateConfig(config);
    await new Promise(resolve => setTimeout(resolve, 800));
    validateSpinner.stop();
    
    if (validationErrors.length > 0) {
      console.log(ui.error('Configuration validation failed:'));
      validationErrors.forEach(error => console.log(ui.warning(`  • ${error}`)));
      
      // Ask if they want to continue anyway
      const { continueAnyway } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueAnyway',
          message: 'Would you like to continue anyway?',
          default: false
        }
      ]);
      
      if (!continueAnyway) {
        console.log(ui.error('Deployment cancelled'));
        return;
      }
    }
    
    // Check server environment if needed
    const serverSpinner = ui.spinner('Checking server environment...');
    serverSpinner.start();
    await new Promise(resolve => setTimeout(resolve, 1000));
    serverSpinner.stop();
    
    await checkAndSetupServerIfNeeded(config);
    
    // Run build process if enabled
    if (config.buildIntegration) {
      try {
        console.log(ui.info('Running build process...'));
        
        const buildSpinner = ui.spinner(`Running: ${config.buildCommand}`);
        buildSpinner.start();
        const buildResult = await buildIntegration.runBuild(config);
        buildSpinner.stop();
        
        if (buildResult.success) {
          console.log(ui.success(`Build completed successfully`));
          
          // Update localPath to use build output directory if it's not already set to it
          if (!config.localPath.includes(config.buildOutputDir)) {
            config.localPath = buildResult.outputPath;
            console.log(ui.info(`Updated local path to build output: ${config.localPath}`));
          }
        }
      } catch (error) {
        console.error(ui.error(`Build failed: ${error.message}`));
        
        const { continueDeployment } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueDeployment',
            message: 'Would you like to continue with deployment anyway?',
            default: false
          }
        ]);
        
        if (!continueDeployment) {
          console.log(ui.error('Deployment cancelled'));
          return;
        }
      }
    }
    
    // Display deployment summary
    ui.sectionHeader('DEPLOYMENT SUMMARY');
    
    // Create a table for deployment details
    const table = ui.createTable(['Setting', 'Value']);
    table.push(
      ['Host', config.host],
      ['Username', config.username],
      ['Remote Path', config.remotePath],
      ['Local Path', config.localPath],
      ['Authentication', config.privateKeyPath ? `SSH Key (${config.privateKeyPath})` : 'Password'],
      ['Web Server', config.webServer || 'Apache']
    );
    console.log(table.toString());
    
    // Check if this is a dry run
    if (options.dryRun) {
      console.log(ui.info('PERFORMING DRY RUN - no actual deployment will occur'));
    }
    
    // Confirm deployment
    if (!options.skipConfirmation) {
      const { confirmDeploy } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmDeploy',
          message: options.dryRun ? 'Start dry run?' : 'Start deployment?',
          default: true
        }
      ]);
      
      if (!confirmDeploy) {
        console.log(ui.warning('Deployment cancelled by user'));
        return;
      }
    }
    
    // Perform the deployment
    console.log(ui.info(options.dryRun ? 'Starting dry run...' : 'Starting deployment...'));
    
    const deployResult = await deployment.deploy(config, {
      dryRun: options.dryRun,
      rollbackEnabled: options.rollbackEnabled !== false
    });
    
    if (deployResult.success) {
      if (!options.dryRun) {
        console.log(ui.success('Deployment completed successfully!'));
        
        // Suggest optimizations based on project type
        const projectInfo = buildIntegration.detectProjectType();
        if (projectInfo.type !== 'unknown') {
          console.log('\n' + ui.collapsibleSection(`${projectInfo.details} Optimization Tips`, 
            buildIntegration.suggestOptimizations(projectInfo.type).join('\n')));
        }
      } else {
        console.log(ui.success('Dry run completed - deployment looks good!'));
      }
    } else {
      console.error(ui.error(`Deployment failed: ${deployResult.error}`));
      
      // Offer rollback if available
      if (deployResult.backupPath) {
        const { performRollback } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'performRollback',
            message: 'Would you like to roll back to the previous version?',
            default: true
          }
        ]);
        
        if (performRollback) {
          const rollbackSpinner = ui.spinner('Rolling back to previous version...');
          rollbackSpinner.start();
          
          const rollbackResult = await deployment.rollback(config, deployResult.backupPath);
          
          rollbackSpinner.stop();
          
          if (rollbackResult) {
            console.log(ui.success('Rollback completed successfully'));
          } else {
            console.error(ui.error('Rollback failed'));
          }
        }
      }
    }
  } catch (error) {
    console.error(ui.error(`Deployment process error: ${error.message}`));
  }
}

/**
 * Run only the build process (without deployment)
 */
async function runBuildOnly() {
  ui.sectionHeader('BUILD PROCESS');
  
  const configPath = DEFAULT_CONFIG_PATH;
  
  try {
    // Load configuration
    const loadSpinner = ui.spinner('Loading configuration...');
    loadSpinner.start();
    let config = configManager.loadConfig(configPath);
    await new Promise(resolve => setTimeout(resolve, 800));
    loadSpinner.stop();
    
    if (!config) {
      console.log(ui.warning(`No configuration found at ${configPath}`));
      
      // Detect project type automatically
      const detectSpinner = ui.spinner('Detecting project type...');
      detectSpinner.start();
      const projectInfo = buildIntegration.detectProjectType();
      await new Promise(resolve => setTimeout(resolve, 1200));
      detectSpinner.stop();
      
      if (projectInfo.type !== 'unknown' && projectInfo.buildCommand) {
        console.log(ui.info(`${projectInfo.details}`));
        console.log(ui.projectTypeBadge(projectInfo.type));
        console.log(ui.info(`Using detected build command: ${projectInfo.buildCommand}`));
        
        config = {
          buildIntegration: true,
          buildCommand: projectInfo.buildCommand,
          buildOutputDir: projectInfo.outputDir
        };
      } else {
        throw new Error('Could not determine build settings. Please create a configuration file.');
      }
    }
    
    // Run build process
    if (!config.buildIntegration || !config.buildCommand) {
      throw new Error('Build integration not enabled in configuration');
    }
    
    const buildSpinner = ui.spinner(`Running: ${config.buildCommand}`);
    buildSpinner.start();
    
    const buildResult = await buildIntegration.runBuild(config);
    
    buildSpinner.stop();
    
    if (buildResult.success) {
      console.log(ui.success(`Build completed successfully!`));
      
      // Show output path
      console.log(ui.info(`Output directory: ${buildResult.outputPath}`));
      
      return buildResult;
    }
  } catch (error) {
    console.error(ui.error(`Build failed: ${error.message}`));
    throw error;
  }
}

module.exports = {
  deploy,
  runBuildOnly
}; 