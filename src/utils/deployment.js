const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { Client } = require('ssh2');
const chalk = require('chalk');
const minimatch = require('minimatch');
const cliProgress = require('cli-progress');

const execAsync = promisify(exec);

/**
 * Deployment utilities for DreamHost Deployer
 * Handles the actual deployment process, dry runs, and rollbacks
 */

// Main deployment function
async function deploy(config, options = {}) {
  const { dryRun = false, rollbackEnabled = true } = options;
  
  try {
    // Validate local path exists
    if (!fs.existsSync(config.localPath)) {
      throw new Error(`Local path does not exist: ${config.localPath}`);
    }
    
    // Create backup for rollback if enabled
    let backupPath = null;
    if (rollbackEnabled && !dryRun) {
      backupPath = await createBackup(config);
      if (backupPath) {
        console.log(chalk.blue(`📦 Created backup for rollback: ${backupPath}`));
      } else {
        console.log(chalk.yellow('⚠️ Failed to create backup, rollback will not be available'));
      }
    }
    
    // Dry run message
    if (dryRun) {
      console.log(chalk.cyan('🔍 Performing DRY RUN - no actual deployment will occur'));
    }
    
    // Choose deployment method
    if (hasRsync()) {
      await deployWithRsync(config, dryRun);
    } else {
      await deployWithScp(config, dryRun);
    }
    
    if (!dryRun) {
      console.log(chalk.green('✅ Deployment completed successfully!'));
    } else {
      console.log(chalk.cyan('🔍 Dry run completed - deployment looks good!'));
    }
    
    return { success: true, backupPath };
  } catch (error) {
    console.error(chalk.red(`❌ Deployment failed: ${error.message}`));
    return { success: false, error: error.message };
  }
}

// Check if rsync is available
function hasRsync() {
  try {
    execSync('rsync --version', { stdio: 'ignore' });
    return true;
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
  const localPath = path.join(config.localPath, '/'); // Ensure trailing slash
  const keyArg = config.privateKeyPath ? `-e "ssh -i ${config.privateKeyPath}"` : '';
  const dryRunArg = dryRun ? '--dry-run' : '';
  
  const cmd = `rsync -avz --delete ${keyArg} ${excludeArgs} ${dryRunArg} ${localPath} ${config.username}@${config.host}:${config.remotePath}`;
  
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
        port: 22
      };
      
      // Use either password or private key
      if (config.password) {
        connectionConfig.password = config.password;
      } else if (config.privateKeyPath) {
        connectionConfig.privateKey = fs.readFileSync(config.privateKeyPath);
      }
      
      ssh.on('ready', resolve);
      ssh.on('error', reject);
      ssh.connect(connectionConfig);
    });
    
    // Create the remote directory if it doesn't exist
    await executeCommand(ssh, `mkdir -p ${config.remotePath}`);
    
    // Transfer each file
    let transferred = 0;
    for (const localFilePath of filesToTransfer) {
      const relativePath = path.relative(config.localPath, localFilePath);
      const remoteFilePath = path.posix.join(config.remotePath, relativePath);
      
      // Create remote directory if needed
      const remoteDir = path.posix.dirname(remoteFilePath);
      await executeCommand(ssh, `mkdir -p ${remoteDir}`);
      
      // Upload the file
      await uploadFile(ssh, localFilePath, remoteFilePath);
      
      transferred++;
      progressBar.update(transferred);
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
    ssh.sftp((err, sftp) => {
      if (err) return reject(err);
      
      const readStream = fs.createReadStream(localPath);
      const writeStream = sftp.createWriteStream(remotePath);
      
      writeStream.on('close', resolve);
      writeStream.on('error', reject);
      
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
      const currentPath = path.join(currentDir, file);
      const currentRelativePath = path.join(relativePath, file);
      
      // Check if the file/directory matches any exclude pattern
      const shouldExclude = excludePatterns.some(pattern => 
        minimatch(currentRelativePath, pattern));
      
      if (shouldExclude) continue;
      
      if (fs.statSync(currentPath).isDirectory()) {
        traverseDir(currentPath, currentRelativePath);
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
      const currentPath = path.join(currentDir, file);
      const currentRelativePath = path.join(relativePath, file);
      
      // Check if the file/directory matches any exclude pattern
      const shouldExclude = excludePatterns.some(pattern => 
        minimatch(currentRelativePath, pattern));
      
      if (shouldExclude) {
        console.log(chalk.gray(`  [EXCLUDED] ${currentRelativePath}`));
        continue;
      }
      
      if (fs.statSync(currentPath).isDirectory()) {
        console.log(chalk.blue(`  [DIR] ${currentRelativePath}/`));
        traverseDir(currentPath, currentRelativePath);
      } else {
        console.log(chalk.green(`  [FILE] ${currentRelativePath}`));
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
    
    await new Promise((resolve, reject) => {
      const connectionConfig = {
        host: config.host,
        username: config.username,
        port: 22
      };
      
      // Use either password or private key
      if (config.password) {
        connectionConfig.password = config.password;
      } else if (config.privateKeyPath) {
        connectionConfig.privateKey = fs.readFileSync(config.privateKeyPath);
      }
      
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
    
    // Create backup directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${config.remotePath}_backup_${timestamp}`;
    
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
        port: 22
      };
      
      // Use either password or private key
      if (config.password) {
        connectionConfig.password = config.password;
      } else if (config.privateKeyPath) {
        connectionConfig.privateKey = fs.readFileSync(config.privateKeyPath);
      }
      
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
  hasRsync
}; 