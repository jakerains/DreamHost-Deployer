/**
 * DreamHost Deployer
 * Version 0.6.2
 * 
 * Information commands implementation with enhanced UI
 */

const os = require('os');
const path = require('path');
const fs = require('fs');
const ui = require('../utils/ui');
const configManager = require('../utils/config-manager');
const serverInfo = require('../utils/server-info');
const packageInfo = require('../../package.json');
const buildIntegration = require('../utils/build-integration');

// Default config path
const DEFAULT_CONFIG_PATH = path.join(process.cwd(), 'deploy.config.json');

/**
 * Display info about the current configuration and server
 */
async function showInfo(options = {}) {
  ui.sectionHeader('DREAMHOST DEPLOYER INFO');
  
  // Show version and basic info
  console.log('');
  console.log(ui.label('Version') + ': ' + ui.highlight(packageInfo.version));
  console.log(ui.label('Description') + ': ' + packageInfo.description);
  console.log(ui.label('Homepage') + ': ' + ui.link(packageInfo.homepage));
  console.log('');
  
  // Read configuration
  const configPath = options.configPath || DEFAULT_CONFIG_PATH;
  
  try {
    // Load configuration
    const loadSpinner = ui.spinner('Loading configuration...');
    loadSpinner.start();
    const config = configManager.loadConfig(configPath);
    await new Promise(resolve => setTimeout(resolve, 800));
    loadSpinner.stop();
    
    if (config) {
      // Configuration details
      ui.subsectionHeader('Configuration Details');
      
      const configTable = ui.createTable(['Setting', 'Value']);
      
      // Add basic configuration
      configTable.push(
        ['Host', config.host || 'Not set'],
        ['Username', config.username || 'Not set'], 
        ['Remote Path', config.remotePath || 'Not set'],
        ['Local Path', config.localPath || 'Not set']
      );
      
      // Add authentication info
      if (config.privateKeyPath) {
        configTable.push(['Authentication', `SSH Key (${config.privateKeyPath})`]);
        
        // Check if the key exists
        if (fs.existsSync(config.privateKeyPath)) {
          configTable.push(['Key Status', ui.badge('OK', 'success')]);
        } else {
          configTable.push(['Key Status', ui.badge('Missing', 'error')]);
        }
      } else {
        configTable.push(['Authentication', 'Password']);
      }
      
      // Add build integration info
      if (config.buildIntegration) {
        configTable.push(
          ['Build Integration', ui.badge('Enabled', 'success')],
          ['Build Command', config.buildCommand || 'Not set'],
          ['Build Output Dir', config.buildOutputDir || 'Not set']
        );
      } else {
        configTable.push(['Build Integration', ui.badge('Disabled', 'normal')]);
      }
      
      console.log(configTable.toString());
      
      // Show validation status
      const validationErrors = configManager.validateConfig(config);
      
      if (validationErrors.length === 0) {
        console.log(ui.success('Configuration validation: All settings valid'));
      } else {
        console.log(ui.warning('Configuration validation: Issues detected'));
        console.log('');
        validationErrors.forEach(error => console.log(ui.warning(`  • ${error}`)));
      }
      
      // Fetch and display server info if requested
      if (options.includeServerInfo) {
        console.log('');
        ui.subsectionHeader('Server Information');
        
        try {
          const serverSpinner = ui.spinner('Fetching server information...');
          serverSpinner.start();
          
          const info = await serverInfo.getServerInfo(config);
          
          await new Promise(resolve => setTimeout(resolve, 1200));
          serverSpinner.stop();
          
          if (info) {
            const serverTable = ui.createTable(['Attribute', 'Value']);
            
            if (info.serverType) serverTable.push(['Server Type', info.serverType]);
            if (info.hostname) serverTable.push(['Hostname', info.hostname]);
            if (info.os) serverTable.push(['Operating System', info.os]);
            if (info.kernel) serverTable.push(['Kernel', info.kernel]);
            if (info.webServer) serverTable.push(['Web Server', info.webServer]);
            if (info.phpVersion) serverTable.push(['PHP Version', info.phpVersion]);
            if (info.diskSpace) serverTable.push(['Disk Space', `${info.diskSpace.used} used of ${info.diskSpace.total} (${info.diskSpace.percent}%)`]);
            
            console.log(serverTable.toString());
          } else {
            console.log(ui.warning('Could not retrieve server information.'));
          }
        } catch (error) {
          console.log(ui.error(`Server info error: ${error.message}`));
        }
      }
    } else {
      console.log(ui.warning(`No configuration found at ${configPath}`));
      console.log(ui.info('You can create a configuration by running the setup command or starting a deployment.'));
    }
    
    // Project detection
    console.log('');
    ui.subsectionHeader('Project Detection');
    
    const detectSpinner = ui.spinner('Analyzing project type...');
    detectSpinner.start();
    
    const projectInfo = buildIntegration.detectProjectType();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    detectSpinner.stop();
    
    if (projectInfo.type !== 'unknown') {
      console.log(ui.success(`Detected project type: ${projectInfo.type}`));
      console.log(ui.info(projectInfo.details));
      console.log('');
      
      // Display framework badge
      console.log(ui.projectTypeBadge(projectInfo.type));
      
      // Show build settings
      if (projectInfo.buildCommand) {
        console.log('');
        console.log(ui.label('Suggested Build Command') + ': ' + ui.highlight(projectInfo.buildCommand));
        
        if (projectInfo.outputDir) {
          console.log(ui.label('Output Directory') + ': ' + ui.highlight(projectInfo.outputDir));
        }
      }
    } else {
      console.log(ui.info('Could not automatically detect the project type.'));
    }
    
    // Local environment info
    console.log('');
    ui.subsectionHeader('Local Environment');
    
    const envTable = ui.createTable(['Component', 'Value']);
    
    envTable.push(
      ['Operating System', `${os.type()} ${os.release()}`],
      ['Architecture', process.arch],
      ['Node.js Version', process.version]
    );
    
    // Add npm if available
    try {
      const npmOutput = require('child_process').execSync('npm --version', { encoding: 'utf8' }).trim();
      envTable.push(['npm Version', npmOutput]);
    } catch (e) {
      envTable.push(['npm Version', 'Not detected']);
    }
    
    // Add git if available
    try {
      const gitOutput = require('child_process').execSync('git --version', { encoding: 'utf8' }).trim();
      envTable.push(['Git', gitOutput]);
    } catch (e) {
      envTable.push(['Git', 'Not detected']);
    }
    
    console.log(envTable.toString());
    
    // Show help for next steps
    console.log('');
    ui.subsectionHeader('Next Steps');
    
    const helpText = `
Here are some useful commands to get started:

${ui.command('dreamhost setup')} - Run the interactive setup
${ui.command('dreamhost deploy')} - Deploy your website
${ui.command('dreamhost deploy --dry-run')} - Test deployment without uploading
${ui.command('dreamhost ssh-setup')} - Set up SSH key authentication

For more information, see the documentation at:
${ui.link(packageInfo.homepage)}`;

    const helpBox = ui.box(helpText, { title: 'Help', padding: 1 });
    console.log(helpBox);
    
  } catch (error) {
    console.error(ui.error(`Error displaying information: ${error.message}`));
  }
}

/**
 * Display help information
 */
async function showHelp() {
  ui.sectionHeader('DREAMHOST DEPLOYER HELP');
  
  const commands = [
    {
      command: 'dreamhost',
      description: 'Show the interactive menu',
      usage: 'dreamhost'
    },
    {
      command: 'dreamhost deploy',
      description: 'Deploy your website to DreamHost',
      usage: 'dreamhost deploy [options]',
      options: [
        { flag: '--config-path <path>', description: 'Path to configuration file' },
        { flag: '--dry-run', description: 'Perform a dry run without actual deployment' },
        { flag: '--no-rollback', description: 'Disable rollback capability' }
      ]
    },
    {
      command: 'dreamhost build',
      description: 'Run the build process without deployment',
      usage: 'dreamhost build'
    },
    {
      command: 'dreamhost setup',
      description: 'Interactive setup to create configuration',
      usage: 'dreamhost setup'
    },
    {
      command: 'dreamhost ssh-setup',
      description: 'Set up SSH key authentication',
      usage: 'dreamhost ssh-setup'
    },
    {
      command: 'dreamhost htaccess',
      description: 'Configure and deploy .htaccess file',
      usage: 'dreamhost htaccess'
    },
    {
      command: 'dreamhost info',
      description: 'Display information about the deployment setup',
      usage: 'dreamhost info [options]',
      options: [
        { flag: '--server', description: 'Include server information' }
      ]
    },
    {
      command: 'dreamhost version',
      description: 'Display the version number',
      usage: 'dreamhost version'
    }
  ];
  
  // Display each command in a formatted way
  commands.forEach(cmd => {
    console.log('');
    console.log(ui.highlight(cmd.command));
    console.log(ui.info(cmd.description));
    console.log(ui.label('Usage') + ': ' + ui.command(cmd.usage));
    
    if (cmd.options && cmd.options.length > 0) {
      console.log('');
      console.log(ui.label('Options') + ':');
      
      const optionsTable = ui.createTable(['Flag', 'Description']);
      cmd.options.forEach(opt => {
        optionsTable.push([opt.flag, opt.description]);
      });
      
      console.log(optionsTable.toString());
    }
  });
  
  // Show examples
  console.log('');
  ui.subsectionHeader('Examples');
  
  const examples = [
    `${ui.command('dreamhost deploy')} - Deploy with interactive prompts`,
    `${ui.command('dreamhost deploy --dry-run')} - Test deployment without uploading`,
    `${ui.command('dreamhost deploy --config-path ./my-config.json')} - Use custom config`,
    `${ui.command('dreamhost ssh-setup')} - Set up SSH key authentication`,
    `${ui.command('dreamhost info --server')} - Show deployment and server info`
  ];
  
  examples.forEach(example => {
    console.log(ui.listItem(example));
  });
  
  // Useful links
  console.log('');
  ui.subsectionHeader('Useful Links');
  
  const links = [
    { text: 'GitHub Repository', url: packageInfo.homepage },
    { text: 'DreamHost Panel', url: 'https://panel.dreamhost.com/' },
    { text: 'DreamHost Wiki', url: 'https://help.dreamhost.com/hc/en-us' },
    { text: 'Report an Issue', url: `${packageInfo.bugs.url}` }
  ];
  
  links.forEach(link => {
    console.log(ui.listItem(`${link.text}: ${ui.link(link.url)}`));
  });
}

/**
 * Show version information
 */
function showVersion() {
  console.log(ui.success(`DreamHost Deployer v${packageInfo.version}`));
}

module.exports = {
  showInfo,
  showHelp,
  showVersion
}; 