const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { Client } = require('ssh2');
const chalk = require('chalk');
const minimatch = require('minimatch');
const cliProgress = require('cli-progress');
const os = require('os');

const execAsync = promisify(exec);

/**
 * Deployment utilities for DreamHost Deployer
 * Handles the actual deployment process, dry runs, and rollbacks
 */

// Simple logging utility with cross-platform path handling
function logToFile(message, type = 'info') {
  const logDir = path.join(process.cwd(), 'logs');
  const today = new Date().toISOString().split('T')[0];
  const logFile = path.join(logDir, `dreamhost-deployer-${today}.log`);
  
  // Ensure log directory exists
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
    
    // Write logs with proper line endings for the current platform
    fs.appendFileSync(logFile, logEntry, { encoding: 'utf8' });
  } catch (error) {
    console.error(chalk.red(`Failed to write to log file: ${error.message}`));
  }
}

// Main deployment function
async function deploy(config, options = {}) {
  const { dryRun = false, rollbackEnabled = true } = options;
  
  try {
    // Create logs directory if it doesn't exist (with cross-platform path handling)
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  logToFile(`Starting deployment to ${config.host}:${config.remotePath}`);
    
    // Validate local path exists
    if (!fs.existsSync(config.localPath)) {
      const errorMsg = `Local path does not exist: ${config.localPath}`;
      logToFile(errorMsg, 'error');
      throw new Error(errorMsg);
    }
    
    // Create backup for rollback if enabled
    let backupPath = null;
    if (rollbackEnabled && !dryRun) {
      backupPath = await createBackup(config);
      if (backupPath) {
        const backupMsg = `Created backup for rollback: ${backupPath}`;
        console.log(chalk.blue(`📦 ${backupMsg}`));
        logToFile(backupMsg);
      } else {
        const backupFailMsg = 'Failed to create backup, rollback will not be available';
        console.log(chalk.yellow(`⚠️ ${backupFailMsg}`));
        logToFile(backupFailMsg, 'warning');
      }
    }
    
    // Dry run message
    if (dryRun) {
      console.log(chalk.cyan('🔍 Performing DRY RUN - no actual deployment will occur'));
      logToFile('Performing DRY RUN deployment');
    }
    
    // Choose deployment method
    if (hasRsync()) {
      logToFile('Using rsync for deployment');
      await deployWithRsync(config, dryRun);
    } else {
      logToFile('Using SCP for deployment (rsync not available)');
      await deployWithScp(config, dryRun);
    }
    
    if (!dryRun) {
      const successMsg = 'Deployment completed successfully!';
      console.log(chalk.green(`✅ ${successMsg}`));
      logToFile(successMsg, 'success');
    } else {
      const dryRunMsg = 'Dry run completed - deployment looks good!';
      console.log(chalk.cyan(`🔍 ${dryRunMsg}`));
      logToFile(dryRunMsg);
    }
    
    return { success: true, backupPath };
  } catch (error) {
    const errorMsg = `Deployment failed: ${error.message}`;
    console.error(chalk.red(`❌ ${errorMsg}`));
    logToFile(errorMsg, 'error');
    
    // Log stack trace for debugging
    logToFile(`Stack trace: ${error.stack}`, 'error');
    
    return { success: false, error: error.message };
  }
}

// Check if rsync is available
function hasRsync() {
  try {
    // Use different commands based on platform to check for rsync
    if (process.platform === 'win32') {
      // On Windows, some installations might have rsync in a different location
      try {
        execSync('rsync --version', { stdio: 'ignore' });
        return true;
      } catch (e) {
        // Try typical Git Bash or WSL location
        try {
          execSync('where rsync', { stdio: 'ignore' });
          return true;
        } catch (e2) {
          return false;
        }
      }
    } else {
      // On macOS and Linux, just check directly
      execSync('rsync --version', { stdio: 'ignore' });
      return true;
    }
  } catch (error) {
    return false;
  }
}

// Deploy using rsync
async function deployWithRsync(config, dryRun = false) {
  console.log(chalk.blue('🚀 Deploying with rsync...'));
  
  // Build exclude arguments
  const excludeArgs = (config.exclude || [])
    .map(pattern => `--exclude="${pattern}"`)
    .join(' ');
  
  // Build rsync command
  // Use path.posix.join for Unix-style paths with forward slashes (rsync requirement)
  // Ensure Windows paths are properly converted for rsync
  const localPath = path.posix.join(config.localPath.replace(/\\/g, '/'), '/');
  // SSH key authentication removed - only using password auth
  const keyArg = '';
  const dryRunArg = dryRun ? '--dry-run' : '';
  
  // Add StrictHostKeyChecking=no to automatically accept host keys
  const sshOptions = '-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null';
  
  const cmd = `rsync -avz --delete -e "ssh ${sshOptions}" ${keyArg} ${excludeArgs} ${dryRunArg} ${localPath} ${config.username}@${config.host}:${config.remotePath}`;
  
  // Log command for debug purposes
  console.log(chalk.gray(`Command: ${cmd}`));
  
  // Create progress bar
  const progressBar = new cliProgress.SingleBar({
    format: 'Uploading |{bar}| {percentage}% || {value}/{total} files',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });
  
  try {
    if (!dryRun) {
      progressBar.start(100, 0);
      
      // Execute rsync with progress tracking
      const child = exec(cmd);
      
      // Track progress based on output
      let fileCount = 0;
      let totalFiles = 100; // Initial estimate
      
      child.stdout.on('data', (data) => {
        // Count files being transferred
        const lines = data.toString().split('\n');
        fileCount += lines.filter(line => line.trim().length > 0).length;
        progressBar.update(Math.min(Math.floor((fileCount / totalFiles) * 100), 99));
      });
      
      // Wait for completion
      await new Promise((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) {
            progressBar.update(100);
            resolve();
          } else {
            reject(new Error(`rsync exited with code ${code}`));
          }
        });
        
        child.on('error', (err) => {
          reject(err);
        });
      });
    } else {
      // Dry run just executes the command
      const { stdout } = await execAsync(cmd);
      console.log(chalk.gray('Files that would be transferred:'));
      console.log(stdout);
    }
    
    progressBar.stop();
  } catch (error) {
    progressBar.stop();
    throw error;
  }
}

// Deploy using SCP (fallback method)
async function deployWithScp(config, dryRun = false) {
  console.log(chalk.blue('🚀 Deploying with SCP...'));
  
  // Create progress bar
  const progressBar = new cliProgress.SingleBar({
    format: 'Uploading |{bar}| {percentage}% || {value}/{total} files',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });
  
  // In dry run mode, just list the files
  if (dryRun) {
    console.log(chalk.cyan('Files that would be transferred:'));
    listFilesRecursively(config.localPath, config.exclude || []);
    return;
  }
  
  try {
    // Get all files to transfer
    const filesToTransfer = getFilesRecursively(config.localPath, config.exclude || []);
    
    if (filesToTransfer.length === 0) {
      console.log(chalk.yellow('⚠️ No files to transfer!'));
      return;
    }
    
    progressBar.start(filesToTransfer.length, 0);
    
    // Connect to the server
    const ssh = new Client();
    
    await new Promise((resolve, reject) => {
      const connectionConfig = {
        host: config.host,
        username: config.username,
        port: 22,
        readyTimeout: 30000, // Add timeout to prevent hanging
        algorithms: {
          serverHostKey: ['ssh-ed25519', 'ecdsa-sha2-nistp256', 'rsa-sha2-512', 'rsa-sha2-256', 'ssh-rsa']
        }
      };
      
      // Only password authentication is supported
      connectionConfig.password = config.password;
      
      // Disable strict host key checking
      connectionConfig.hostVerifier = () => true;
      
      ssh.on('ready', resolve);
      ssh.on('error', reject);
      ssh.connect(connectionConfig);
    });
    
    // Create the remote directory if it doesn't exist
    await executeCommand(ssh, `mkdir -p ${config.remotePath}`);
    
    // Transfer each file
    let transferred = 0;
    let failedTransfers = [];
    
    for (const localFilePath of filesToTransfer) {
      const relativePath = path.relative(config.localPath, localFilePath);
      const remoteFilePath = path.posix.join(config.remotePath, relativePath);
      
      try {
        // Create remote directory if needed
        const remoteDir = path.posix.dirname(remoteFilePath);
        await executeCommand(ssh, `mkdir -p ${remoteDir}`);
        
        // Upload the file
        await uploadFile(ssh, localFilePath, remoteFilePath);
        
        transferred++;
        progressBar.update(transferred);
      } catch (error) {
        // Log error but continue with other files
        console.error(chalk.red(`❌ Failed to transfer file ${localFilePath}: ${error.message}`));
        failedTransfers.push({ path: localFilePath, error: error.message });
        // Still update progress
        transferred++;
        progressBar.update(transferred);
      }
    }
    
    // Report any failed transfers at the end
    if (failedTransfers.length > 0) {
      console.log(chalk.yellow(`\n⚠️ ${failedTransfers.length} files failed to transfer:`));
      failedTransfers.slice(0, 5).forEach(failure => {
        console.log(chalk.red(`  - ${failure.path}: ${failure.error}`));
      });
      if (failedTransfers.length > 5) {
        console.log(chalk.red(`  ...and ${failedTransfers.length - 5} more`));
      }
    }
    
    progressBar.stop();
    ssh.end();
  } catch (error) {
    progressBar.stop();
    throw error;
  }
}

// Helper function to execute a command over SSH
function executeCommand(ssh, command) {
  return new Promise((resolve, reject) => {
    ssh.exec(command, (err, stream) => {
      if (err) return reject(err);
      
      let stdout = '';
      let stderr = '';
      
      stream.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      }).on('data', (data) => {
        stdout += data;
      }).stderr.on('data', (data) => {
        stderr += data;
      });
    });
  });
}

// Helper function to upload a file via SCP
function uploadFile(ssh, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    // Create a timeout to prevent hanging transfers
    const timeout = setTimeout(() => {
      reject(new Error(`File transfer timeout: ${localPath} → ${remotePath}`));
    }, 300000); // 5 minute timeout for large files
    
    ssh.sftp((err, sftp) => {
      if (err) {
        clearTimeout(timeout);
        return reject(err);
      }
      
      const readStream = fs.createReadStream(localPath);
      const writeStream = sftp.createWriteStream(remotePath);
      
      writeStream.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      writeStream.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
      
      // Handle read stream errors
      readStream.on('error', (err) => {
        clearTimeout(timeout);
        writeStream.end();
        reject(err);
      });
      
      readStream.pipe(writeStream);
    });
  });
}

// Get a list of all files in a directory recursively
function getFilesRecursively(dir, excludePatterns = []) {
  const result = [];
  
  function traverseDir(currentDir, relativePath = '') {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      // Use path.join for local filesystem operations
      const currentPath = path.join(currentDir, file);
      // But normalize to posix-style paths for pattern matching consistency across platforms
      // This ensures pattern matching works the same on Windows and Unix-based systems
      const normalizedRelativePath = path.posix.join(relativePath.replace(/\\/g, '/'), file.replace(/\\/g, '/'));
      
      // Check if the file/directory matches any exclude pattern
      const shouldExclude = excludePatterns.some(pattern => 
        minimatch(normalizedRelativePath, pattern));
      
      if (shouldExclude) continue;
      
      if (fs.statSync(currentPath).isDirectory()) {
        traverseDir(currentPath, normalizedRelativePath);
      } else {
        result.push(currentPath);
      }
    }
  }
  
  traverseDir(dir);
  return result;
}

// List files that would be transferred (for dry run)
function listFilesRecursively(dir, excludePatterns = []) {
  function traverseDir(currentDir, relativePath = '') {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      // Use path.join for local filesystem operations
      const currentPath = path.join(currentDir, file);
      // But normalize to posix-style paths for pattern matching consistency across platforms
      // This ensures pattern matching works the same on Windows and Unix-based systems
      const normalizedRelativePath = path.posix.join(relativePath.replace(/\\/g, '/'), file.replace(/\\/g, '/'));
      
      // Check if the file/directory matches any exclude pattern
      const shouldExclude = excludePatterns.some(pattern => 
        minimatch(normalizedRelativePath, pattern));
      
      if (shouldExclude) {
        console.log(chalk.gray(`  [EXCLUDED] ${normalizedRelativePath}`));
        continue;
      }
      
      if (fs.statSync(currentPath).isDirectory()) {
        console.log(chalk.blue(`  [DIR] ${normalizedRelativePath}/`));
        traverseDir(currentPath, normalizedRelativePath);
      } else {
        console.log(chalk.green(`  [FILE] ${normalizedRelativePath}`));
      }
    }
  }
  
  traverseDir(dir);
}

// Create a backup for rollback
async function createBackup(config) {
  try {
    console.log(chalk.blue('📦 Creating backup for rollback capability...'));
    
    // Connect to SSH
    const ssh = new Client();
    
    // Private key authentication removed
    
    await new Promise((resolve, reject) => {
      const connectionConfig = {
        host: config.host,
        username: config.username,
        port: 22,
        readyTimeout: 30000, // Add timeout to prevent hanging
        algorithms: {
          serverHostKey: ['ssh-ed25519', 'ecdsa-sha2-nistp256', 'rsa-sha2-512', 'rsa-sha2-256', 'ssh-rsa']
        }
      };
      
      // Only password authentication is supported
      connectionConfig.password = config.password;
      
      // Disable strict host key checking
      connectionConfig.hostVerifier = () => true;
      
      ssh.on('ready', resolve);
      ssh.on('error', reject);
      ssh.connect(connectionConfig);
    });
    
    // Check if remote path exists
    try {
      await executeCommand(ssh, `ls -la ${config.remotePath}`);
    } catch (error) {
      console.log(chalk.yellow('⚠️ Remote directory does not exist yet, no backup needed'));
      ssh.end();
      return null;
    }
    
    // Check available disk space
    console.log(chalk.cyan('Checking available disk space...'));
    try {
      // Get directory size
      const dirSizeOutput = await executeCommand(ssh, `du -sh ${config.remotePath}`);
      console.log(chalk.cyan(`Current directory size: ${dirSizeOutput.split(/\s+/)[0]}`));
      
      // Check available space
      const diskSpaceOutput = await executeCommand(ssh, `df -h ${config.remotePath}`);
      console.log(chalk.cyan('Available disk space:'));
      console.log(chalk.gray(diskSpaceOutput));
      
      // Parse available space - typical output format: "Filesystem Size Used Avail Use% Mounted on"
      const availableMatch = diskSpaceOutput.match(/\S+\s+\S+\s+\S+\s+(\S+)\s+\S+\s+\S+/);
      if (availableMatch && availableMatch[1]) {
        const available = availableMatch[1];
        console.log(chalk.cyan(`Available space: ${available}`));
        
        // If available space is less than 500M (approximate match), warn user
        if (available.endsWith('K') || (available.endsWith('M') && parseInt(available, 10) < 500)) {
          console.log(chalk.yellow('⚠️ Low disk space available for backup. Proceeding with caution.'));
        }
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Could not check disk space: ${error.message}`));
    }
    
    // Create backup directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${config.remotePath}_backup_${timestamp}`;
    
    console.log(chalk.cyan(`Creating backup at: ${backupPath}`));
    await executeCommand(ssh, `cp -r ${config.remotePath} ${backupPath}`);
    
    ssh.end();
    return backupPath;
  } catch (error) {
    console.error(chalk.red(`❌ Failed to create backup: ${error.message}`));
    return null;
  }
}

// Rollback to a previous backup
async function rollback(config, backupPath) {
  if (!backupPath) {
    throw new Error('No backup path provided for rollback');
  }
  
  try {
    console.log(chalk.blue(`🔄 Rolling back to backup: ${backupPath}`));
    
    // Connect to SSH
    const ssh = new Client();
    
    await new Promise((resolve, reject) => {
      const connectionConfig = {
        host: config.host,
        username: config.username,
        port: 22,
        readyTimeout: 30000, // Add timeout to prevent hanging
        algorithms: {
          serverHostKey: ['ssh-ed25519', 'ecdsa-sha2-nistp256', 'rsa-sha2-512', 'rsa-sha2-256', 'ssh-rsa']
        }
      };
      
      // Only password authentication is supported
      connectionConfig.password = config.password;
      
      // Disable strict host key checking
      connectionConfig.hostVerifier = () => true;
      
      ssh.on('ready', resolve);
      ssh.on('error', reject);
      ssh.connect(connectionConfig);
    });
    
    // Remove current directory and replace with backup
    await executeCommand(ssh, `rm -rf ${config.remotePath}`);
    await executeCommand(ssh, `mv ${backupPath} ${config.remotePath}`);
    
    ssh.end();
    console.log(chalk.green('✅ Rollback completed successfully!'));
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Rollback failed: ${error.message}`));
    return false;
  }
}

module.exports = {
  deploy,
  rollback,
  hasRsync,
  logToFile
}; 