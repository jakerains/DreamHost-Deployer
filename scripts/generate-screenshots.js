/**
 * Script to generate terminal mockup screenshots for the README
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create the screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Function to generate HTML for a terminal mockup
function generateTerminalHTML(title, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .terminal {
      width: 800px;
      background-color: #282a36;
      border-radius: 6px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    .terminal-header {
      display: flex;
      align-items: center;
      padding: 10px 15px;
      background-color: #1e1f29;
      border-bottom: 1px solid #333;
    }
    .terminal-buttons {
      display: flex;
      margin-right: 10px;
    }
    .terminal-button {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 8px;
    }
    .terminal-button.red {
      background-color: #ff5f56;
    }
    .terminal-button.yellow {
      background-color: #ffbd2e;
    }
    .terminal-button.green {
      background-color: #27c93f;
    }
    .terminal-title {
      color: #f8f8f2;
      font-size: 14px;
      flex-grow: 1;
      text-align: center;
    }
    .terminal-body {
      padding: 15px;
      color: #f8f8f2;
      font-family: 'SF Mono', Monaco, Menlo, Consolas, 'Ubuntu Mono', monospace;
      font-size: 14px;
      line-height: 1.5;
      overflow: auto;
      max-height: 500px;
      white-space: pre-wrap;
    }
    .blue {
      color: #6272a4;
    }
    .green {
      color: #50fa7b;
    }
    .yellow {
      color: #f1fa8c;
    }
    .red {
      color: #ff5555;
    }
    .cyan {
      color: #8be9fd;
    }
    .magenta {
      color: #ff79c6;
    }
    .bold {
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="terminal">
    <div class="terminal-header">
      <div class="terminal-buttons">
        <div class="terminal-button red"></div>
        <div class="terminal-button yellow"></div>
        <div class="terminal-button green"></div>
      </div>
      <div class="terminal-title">${title}</div>
    </div>
    <div class="terminal-body">${content}</div>
  </div>
</body>
</html>`;
}

// Generate main menu screenshot
const mainMenuContent = `<span class="bold">DreamHost Deployer v0.6.0</span>

<span class="blue">╔══════════════════════════════════╗</span>
<span class="blue">║</span>           <span class="bold">DREAMHOST DEPLOYER</span>          <span class="blue">║</span>
<span class="blue">╚══════════════════════════════════╝</span>

<span class="yellow">DEPLOYMENT</span>

? <span class="cyan">What would you like to do?</span> <span class="bold">(Use arrow keys)</span>
❯ <span class="green">🚀 Deploy website to DreamHost</span>        Deploy your website files to DreamHost server
  <span class="cyan">🔍 Dry run (preview deployment)</span>        Preview what files would be deployed without making changes
  <span class="cyan">🔨 Run build process only</span>              Build your project without deploying

<span class="yellow">CONFIGURATION</span>

  <span class="cyan">📋 Project-specific settings</span>           Configure build settings for various frameworks

<span class="yellow">SERVER SETUP</span>

  <span class="cyan">🔑 Setup SSH key authentication</span>        Generate and upload SSH keys to DreamHost
  <span class="cyan">🔧 Fix SSH key permissions</span>             Fix common SSH key permission issues
  <span class="cyan">🔍 Check server environment</span>            Check Node.js and NVM on your DreamHost server
  <span class="cyan">📦 Setup Node.js on server</span>             Install Node.js and NVM on your DreamHost server`;

// Generate deployment screenshot
const deploymentContent = `<span class="blue">╔══════════════════════════════════╗</span>
<span class="blue">║</span>        <span class="bold">DREAMHOST DEPLOYMENT</span>         <span class="blue">║</span>
<span class="blue">╚══════════════════════════════════╝</span>

<span class="blue">╔══════════════════════════════════════════════════╗</span>
<span class="blue">║</span>               <span class="bold">DEPLOYMENT SUMMARY</span>               <span class="blue">║</span>
<span class="blue">╚══════════════════════════════════════════════════╝</span>

╔═══════════════╤════════════════════════════════════╗
║ <span class="cyan">Setting</span>       │ <span class="cyan">Value</span>                            ║
╟───────────────┼────────────────────────────────────╢
║ Host          │ example.dreamhost.com               ║
║ Username      │ username                            ║
║ Remote Path   │ /home/username/example.com          ║
║ Local Path    │ /Users/username/project/dist        ║
║ Authentication│ SSH Key (~/.ssh/id_rsa)             ║
║ Web Server    │ Apache                              ║
╚═══════════════╧════════════════════════════════────╝

? <span class="cyan">Start deployment?</span> <span class="green">Yes</span>

<span class="blue">ℹ Starting deployment...</span>

<span class="cyan">[=========================================] | 100% || 24/24 Files</span>

<span class="green">✨ Deployment completed successfully!</span>

<span class="blue">╔════════════════════════════════════════════════════════════════════════════╗</span>
<span class="blue">║</span> <span class="bold">React Project Optimization Tips</span>                                            <span class="blue">║</span>
<span class="blue">║</span>                                                                        <span class="blue">║</span>
<span class="blue">║</span> • Enable Gzip compression for JS and CSS files                         <span class="blue">║</span>
<span class="blue">║</span> • Configure proper cache headers for static assets                     <span class="blue">║</span>
<span class="blue">║</span> • Set up proper routing with .htaccess for client-side routing         <span class="blue">║</span>
<span class="blue">║</span> • Consider implementing code splitting for better performance          <span class="blue">║</span>
<span class="blue">╚════════════════════════════════════════════════════════════════════════════╝</span>`;

// Generate SSH setup screenshot
const sshSetupContent = `<span class="blue">╔══════════════════════════════════╗</span>
<span class="blue">║</span>           <span class="bold">SSH KEY SETUP</span>             <span class="blue">║</span>
<span class="blue">╚══════════════════════════════════╝</span>

<span class="green">✨ Found existing SSH key at: ~/.ssh/id_rsa</span>

? <span class="cyan">Use existing SSH key?</span> <span class="green">Yes</span>

<span class="blue">ℹ Here is your public key:</span>

<span class="blue">╔══════════════════════════════════════════════════════════════════════════════════════╗</span>
<span class="blue">║</span> <span class="bold">SSH Public Key</span>                                                                    <span class="blue">║</span>
<span class="blue">║</span>                                                                                    <span class="blue">║</span>
<span class="blue">║</span> ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC5Qtnw9aFO+TxpvmXKRSuKRa5t4xUy8T...      <span class="blue">║</span>
<span class="blue">╚══════════════════════════════════════════════════════════════════════════════════════╝</span>

<span class="blue">ℹ Instructions:</span>

╔═════╤════════════════════════════════════════════════════════════════════════╗
║ <span class="cyan">Step</span> │ <span class="cyan">Action</span>                                                                ║
╟─────┼────────────────────────────────────────────────────────────────────────╢
║ 1   │ Log in to your DreamHost panel at https://panel.dreamhost.com          ║
║ 2   │ Go to Servers > Manage Servers                                         ║
║ 3   │ Click on the server (example.dreamhost.com)                            ║
║ 4   │ Click on "Manage SSH/FTP Users"                                        ║
║ 5   │ Find your username (username)                                          ║
║ 6   │ Click "Edit" next to your username                                     ║
║ 7   │ Paste the above public key into the "SSH Key" field                    ║
║ 8   │ Click "Save Changes"                                                   ║
╚═════╧────────────────────────────────────────────────────────────────────────╝

<span class="green">✨ Configuration updated with SSH key path.</span>

? <span class="cyan">Would you like to verify SSH connectivity after setting up the key?</span> <span class="green">Yes</span>

<span class="blue">ℹ After adding the key to DreamHost, return here and press ENTER to test the connection...</span>`;

// Save the HTML files
fs.writeFileSync(path.join(screenshotsDir, 'main-menu.html'), generateTerminalHTML('DreamHost Deployer - Main Menu', mainMenuContent));
fs.writeFileSync(path.join(screenshotsDir, 'deployment.html'), generateTerminalHTML('DreamHost Deployer - Deployment', deploymentContent));
fs.writeFileSync(path.join(screenshotsDir, 'ssh-setup.html'), generateTerminalHTML('DreamHost Deployer - SSH Setup', sshSetupContent));

console.log('HTML terminal mockups generated in the screenshots directory');
console.log('To convert these to images, open them in a web browser and take screenshots');
console.log('Or use a tool like "wkhtmltoimage" to convert them programmatically');

// Try to find and use wkhtmltoimage if available
try {
  const hasWkHtmlToImage = execSync('which wkhtmltoimage', { stdio: 'ignore' });
  
  if (hasWkHtmlToImage) {
    console.log('Found wkhtmltoimage, converting HTML to PNG...');
    
    execSync(`wkhtmltoimage --quality 100 "${path.join(screenshotsDir, 'main-menu.html')}" "${path.join(screenshotsDir, 'main-menu.png')}"`);
    execSync(`wkhtmltoimage --quality 100 "${path.join(screenshotsDir, 'deployment.html')}" "${path.join(screenshotsDir, 'deployment.png')}"`);
    execSync(`wkhtmltoimage --quality 100 "${path.join(screenshotsDir, 'ssh-setup.html')}" "${path.join(screenshotsDir, 'ssh-setup.png')}"`);
    
    console.log('PNG screenshots generated successfully');
  }
} catch (error) {
  console.log('wkhtmltoimage not found or error generating PNGs');
  console.log('Please convert the HTML files to images manually');
} 