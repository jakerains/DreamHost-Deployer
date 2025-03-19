/**
 * DreamHost Deployer
 * Version 0.6.2
 * 
 * Server setup command implementations with enhanced UI
 */

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const ui = require('../utils/ui');
const configManager = require('../utils/config-manager');
const sshUtils = require('../utils/ssh-utils');

const DEFAULT_CONFIG_PATH = path.join(process.cwd(), 'deploy.config.json');

/**
 * Setup SSH key authentication with the remote server
 */
async function setupSshKey(options = {}) {
  ui.sectionHeader('SSH KEY SETUP');
  
  try {
    // Load config or prompt for server details
    const configPath = options.configPath || DEFAULT_CONFIG_PATH;
    let config = configManager.loadConfig(configPath);
    
    if (!config) {
      console.log(ui.warning('No configuration found. Will create server settings.'));
      
      const serverDetails = await inquirer.prompt([
        {
          type: 'input',
          name: 'host',
          message: 'DreamHost server:',
          default: 'example.dreamhost.com'
        },
        {
          type: 'input',
          name: 'username',
          message: 'SSH username:',
          validate: input => input.length > 0 ? true : 'Username is required'
        }
      ]);
      
      config = {
        host: serverDetails.host,
        username: serverDetails.username
      };
    }
    
    // Check if SSH key already exists
    const keyCheckSpinner = ui.spinner('Checking for SSH key...');
    keyCheckSpinner.start();
    
    const { defaultKeyPath, keyExists } = await sshUtils.checkForExistingKey();
    
    await new Promise(resolve => setTimeout(resolve, 800));
    keyCheckSpinner.stop();
    
    let keyPath;
    
    if (keyExists) {
      console.log(ui.success(`Found existing SSH key at: ${defaultKeyPath}`));
      
      const { useExisting } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useExisting',
          message: 'Use existing SSH key?',
          default: true
        }
      ]);
      
      if (useExisting) {
        keyPath = defaultKeyPath;
      } else {
        // Generate new key with custom path
        const { customKeyPath } = await inquirer.prompt([
          {
            type: 'input',
            name: 'customKeyPath',
            message: 'Enter path for new SSH key:',
            default: path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'dreamhost_rsa')
          }
        ]);
        
        keyPath = customKeyPath;
        
        const genKeySpinner = ui.spinner('Generating new SSH key...');
        genKeySpinner.start();
        
        await sshUtils.generateSshKey(keyPath);
        
        await new Promise(resolve => setTimeout(resolve, 1200));
        genKeySpinner.stop();
        
        console.log(ui.success(`SSH key generated at: ${keyPath}`));
      }
    } else {
      console.log(ui.info('No existing SSH key found. Will generate a new one.'));
      
      // Ask for key path
      const { customKeyPath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customKeyPath',
          message: 'Enter path for new SSH key:',
          default: defaultKeyPath
        }
      ]);
      
      keyPath = customKeyPath;
      
      const genKeySpinner = ui.spinner('Generating new SSH key...');
      genKeySpinner.start();
      
      await sshUtils.generateSshKey(keyPath);
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      genKeySpinner.stop();
      
      console.log(ui.success(`SSH key generated at: ${keyPath}`));
    }
    
    // Display the public key
    const pubKeyPath = `${keyPath}.pub`;
    
    if (fs.existsSync(pubKeyPath)) {
      console.log(ui.info('Here is your public key:'));
      const publicKey = fs.readFileSync(pubKeyPath, 'utf8').trim();
      
      const keyBox = ui.box(publicKey, { title: 'SSH Public Key', padding: 1 });
      console.log(keyBox);
      
      console.log(ui.info('Instructions:'));
      
      // Create step by step instructions
      const steps = [
        `Log in to your DreamHost panel at https://panel.dreamhost.com`,
        `Go to Servers > Manage Servers`,
        `Click on the server (${config.host})`,
        `Click on "Manage SSH/FTP Users"`,
        `Find your username (${config.username})`,
        `Click "Edit" next to your username`,
        `Paste the above public key into the "SSH Key" field`,
        `Click "Save Changes"`
      ];
      
      const stepsTable = ui.createTable(['Step', 'Action']);
      steps.forEach((step, index) => {
        stepsTable.push([String(index + 1), step]);
      });
      
      console.log(stepsTable.toString());
      
      // Update config with key path
      if (config) {
        config.privateKeyPath = keyPath;
        configManager.saveConfig(config, configPath);
        console.log(ui.success(`Configuration updated with SSH key path.`));
      }
      
      // Ask if they want to verify connectivity
      const { verifyConnection } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'verifyConnection',
          message: 'Would you like to verify SSH connectivity after setting up the key?',
          default: true
        }
      ]);
      
      if (verifyConnection) {
        console.log(ui.info(`\nAfter adding the key to DreamHost, return here and press ENTER to test the connection...`));
        await inquirer.prompt([{ type: 'input', name: 'dummy', message: 'Press ENTER to continue' }]);
        
        const verifySpinner = ui.spinner(`Testing connection to ${config.host}...`);
        verifySpinner.start();
        
        try {
          await sshUtils.testSshConnection(config);
          await new Promise(resolve => setTimeout(resolve, 1500));
          verifySpinner.stop();
          console.log(ui.success(`SSH connection successful! You're ready to deploy.`));
        } catch (error) {
          verifySpinner.stop();
          console.log(ui.error(`SSH connection failed: ${error.message}`));
          console.log(ui.info('Common issues:'));
          
          const troubleshooting = [
            `Key not added to DreamHost panel correctly`,
            `Key not yet propagated (can take a few minutes)`,
            `Incorrect server hostname or username`,
            `Firewall blocking SSH connection`
          ];
          
          troubleshooting.forEach(tip => console.log(ui.listItem(tip)));
        }
      }
    } else {
      console.log(ui.error(`Could not find public key at ${pubKeyPath}`));
    }
  } catch (error) {
    console.error(ui.error(`SSH key setup error: ${error.message}`));
  }
}

/**
 * Set up an .htaccess file for the site
 */
async function setupHtaccess(options = {}) {
  ui.sectionHeader('HTACCESS CONFIGURATION');
  
  try {
    // Load config or prompt for remote path
    const configPath = options.configPath || DEFAULT_CONFIG_PATH;
    let config = configManager.loadConfig(configPath);
    let remotePath;
    
    if (config && config.remotePath) {
      remotePath = config.remotePath;
      console.log(ui.info(`Using remote path from config: ${remotePath}`));
    } else {
      console.log(ui.warning('No configuration found or remote path not set.'));
      
      const { customRemotePath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customRemotePath',
          message: 'Enter the remote path where your site is deployed:',
          default: '/home/username/example.com'
        }
      ]);
      
      remotePath = customRemotePath;
    }
    
    // Choose htaccess template type
    const { templateType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateType',
        message: 'Select .htaccess template:',
        choices: [
          { name: 'SPA (React, Vue, Angular, etc.)', value: 'spa' },
          { name: 'PHP Application', value: 'php' },
          { name: 'WordPress', value: 'wordpress' },
          { name: 'Static Site', value: 'static' },
          { name: 'Custom', value: 'custom' }
        ]
      }
    ]);
    
    let htaccessContent = '';
    
    // Generate the template based on type
    if (templateType === 'custom') {
      console.log(ui.info('Enter your custom .htaccess content:'));
      const { customContent } = await inquirer.prompt([
        {
          type: 'editor',
          name: 'customContent',
          message: 'Edit your .htaccess file:',
          default: '# Custom .htaccess file\n\n'
        }
      ]);
      
      htaccessContent = customContent;
    } else {
      const generateSpinner = ui.spinner('Generating .htaccess template...');
      generateSpinner.start();
      
      switch (templateType) {
        case 'spa':
          htaccessContent = `# .htaccess for Single Page Applications (React, Vue, Angular, etc.)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  # Rewrite everything else to index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Caching and compression
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType text/x-javascript "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/x-javascript "access plus 1 month"
  ExpiresByType application/x-shockwave-flash "access plus 1 month"
  ExpiresByType image/x-icon "access plus 1 year"
  ExpiresDefault "access plus 2 days"
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>`;
          break;
          
        case 'php':
          htaccessContent = `# .htaccess for PHP Applications
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Redirect to HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  # Remove trailing slashes
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)/$ /$1 [L,R=301]
  
  # Remove .php extension
  RewriteCond %{REQUEST_FILENAME}.php -f
  RewriteRule ^(.*)$ $1.php [L]
</IfModule>

# PHP settings
<IfModule mod_php7.c>
  php_value upload_max_filesize 64M
  php_value post_max_size 64M
  php_value max_execution_time 300
  php_value max_input_time 300
  php_flag display_errors off
  php_flag log_errors on
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>`;
          break;
          
        case 'wordpress':
          htaccessContent = `# BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>
# END WordPress

# Block WordPress xmlrpc.php requests
<Files xmlrpc.php>
  Order Deny,Allow
  Deny from all
</Files>

# Protect wp-config.php
<Files wp-config.php>
  Order Deny,Allow
  Deny from all
</Files>

# Protect .htaccess
<Files .htaccess>
  Order Deny,Allow
  Deny from all
</Files>

# Disable directory browsing
Options -Indexes

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>`;
          break;
          
        case 'static':
          htaccessContent = `# .htaccess for Static Sites
# Redirect to HTTPS
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# Set default character set
AddDefaultCharset UTF-8

# Disable directory browsing
Options -Indexes

# Caching and compression
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/x-javascript "access plus 1 month"
  ExpiresByType image/x-icon "access plus 1 year"
  ExpiresDefault "access plus 2 days"
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>`;
          break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      generateSpinner.stop();
    }
    
    // Show preview
    console.log(ui.info('Preview of .htaccess file:'));
    
    const previewBox = ui.box(htaccessContent, { title: '.htaccess Preview', padding: 1 });
    console.log(previewBox);
    
    // Save location
    const { saveLocation } = await inquirer.prompt([
      {
        type: 'list',
        name: 'saveLocation',
        message: 'Where would you like to save this .htaccess file?',
        choices: [
          { name: 'Save locally in current directory', value: 'local' },
          { name: 'Save to local config directory', value: 'config' },
          { name: 'Upload directly to server', value: 'server' }
        ]
      }
    ]);
    
    let savePath;
    
    if (saveLocation === 'local') {
      savePath = path.join(process.cwd(), '.htaccess');
      fs.writeFileSync(savePath, htaccessContent);
      console.log(ui.success(`File saved to: ${savePath}`));
      
    } else if (saveLocation === 'config') {
      const configDir = path.dirname(configPath);
      savePath = path.join(configDir, '.htaccess');
      fs.writeFileSync(savePath, htaccessContent);
      console.log(ui.success(`File saved to: ${savePath}`));
      
    } else if (saveLocation === 'server') {
      // Check if we have connection details
      if (!config || !config.host || !config.username) {
        console.log(ui.error('Server connection details not found in config.'));
        return;
      }
      
      // Create temp file
      const tempFile = path.join(os.tmpdir(), '.htaccess.temp');
      fs.writeFileSync(tempFile, htaccessContent);
      
      const uploadSpinner = ui.spinner('Uploading .htaccess to server...');
      uploadSpinner.start();
      
      try {
        const remoteSavePath = path.join(remotePath, '.htaccess');
        await sshUtils.uploadFile(config, tempFile, remoteSavePath);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        uploadSpinner.stop();
        
        console.log(ui.success(`File uploaded to: ${remoteSavePath}`));
        
        // Clean up temp file
        fs.unlinkSync(tempFile);
      } catch (error) {
        uploadSpinner.stop();
        console.log(ui.error(`Upload failed: ${error.message}`));
      }
    }
    
    // Add information about what to do next
    console.log(ui.info('Next Steps:'));
    
    const nextSteps = [
      'Test your site to ensure the .htaccess rules are working correctly',
      'If using a CMS like WordPress, make sure to check settings after applying rules',
      'For SPA applications, test routes to ensure rewriting works properly',
      'Consider backing up this .htaccess file for future use'
    ];
    
    nextSteps.forEach(step => console.log(ui.listItem(step)));
    
  } catch (error) {
    console.error(ui.error(`Htaccess setup error: ${error.message}`));
  }
}

module.exports = {
  setupSshKey,
  setupHtaccess
}; 