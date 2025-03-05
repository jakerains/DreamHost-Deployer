# Improved Connection Handling

## Overview

Version 0.5.4 of DreamHost Deployer introduces significant improvements to SSH connection handling, addressing common issues such as connection timeouts, authentication problems, and reliability concerns during deployment operations.

## Key Improvements

### 1. SSH2 Library Integration

The tool now uses the Node.js SSH2 library for directory creation and server checks, replacing command-line SSH tools. This provides:

- More reliable connections, especially on Windows systems
- Better error handling and reporting
- Consistent behavior across different operating systems
- Improved authentication handling for both password and key-based methods

### 2. Batch Processing for File Transfers

File transfers are now processed in batches to prevent overwhelming the server:

- Files are grouped into batches of 10 (configurable)
- Small pauses between batches reduce server load
- Progress reporting shows batch and overall progress
- Failures in one file don't stop the entire deployment

### 3. Connection Timeout Handling

Enhanced timeout handling prevents deployment failures due to connection issues:

- Increased connection timeout to 30 seconds (up from 10)
- Keepalive packets sent every 10 seconds to maintain connection
- Automatic retry mechanisms for certain operations
- Clear error messages when timeouts occur

### 4. Sequential Directory Creation

Directories are now created one by one in a controlled sequence:

- Prevents overwhelming the server with many mkdir commands
- Provides better progress reporting during directory creation
- Improves error handling for each directory
- Reduces the chance of timeout errors

## Technical Implementation

### SSH Connection Configuration

```javascript
const connectConfig = {
    host: config.host,
    port: 22,
    username: config.username,
    readyTimeout: 30000, // Increased timeout to 30 seconds
    keepaliveInterval: 10000 // Send keepalive packets every 10 seconds
};

// Add authentication method
if (config.password) {
    connectConfig.password = config.password;
} else if (config.privateKeyPath) {
    connectConfig.privateKey = fs.readFileSync(config.privateKeyPath);
}
```

### Directory Creation Process

The directory creation process now uses a sequential approach with the SSH2 library:

1. Establish a single SSH connection
2. Process directories one by one
3. Create each directory with proper error handling
4. Close the connection when all directories are created

This approach is more reliable than creating multiple connections or using command-line SSH tools.

### Batch Processing for File Transfers

File transfers are now processed in batches:

1. Files are divided into batches of 10
2. Each batch is processed sequentially
3. A small pause (2 seconds) is added between batches
4. Progress is reported for both individual files and batches

This approach prevents overwhelming the server and reduces the chance of timeouts.

## Benefits

### Improved Reliability

- Fewer connection timeouts during deployment
- More consistent behavior across different environments
- Better handling of large deployments with many files
- Reduced chance of partial deployments due to connection issues

### Better User Experience

- More detailed progress reporting
- Clearer error messages when issues occur
- Improved guidance for troubleshooting connection problems
- Continued deployment even if some files fail to transfer

### Enhanced Windows Compatibility

- More reliable SSH connections on Windows systems
- No dependency on command-line SSH tools
- Consistent behavior between Windows, macOS, and Linux
- Better handling of Windows-specific path issues

## Troubleshooting

### Connection Timeouts

If you still experience connection timeouts:

1. Check your network connection to the DreamHost server
2. Verify that your SSH credentials are correct
3. Try increasing the `readyTimeout` value in the code
4. Consider reducing the batch size for very large deployments

### Authentication Issues

If you encounter authentication problems:

1. Verify that your password or SSH key is correct
2. Check if your SSH key is in the correct format
3. Try using the `fix-ssh-key` command to resolve key issues
4. Consider switching to password authentication if key authentication fails

### Slow Transfers

If file transfers are slow:

1. Check your internet connection speed
2. Consider increasing the batch size for faster transfers
3. Verify that your DreamHost server is not under heavy load
4. Try excluding unnecessary files from the deployment

## Example: Connection Error Handling

```
🚀 Starting deployment to DreamHost...

📂 Loaded configuration:
   Host: example.dreamhost.com
   Username: user123
   Remote Path: /home/user123/example.com
   Local Path: ./my-project
   Web Server: Apache (default)

🔍 Checking target directory for existing files...
❌ SSH connection error: Connection timed out

This could be due to:
1. Incorrect hostname or username
2. Server is not accessible
3. Firewall blocking the connection

Please check your configuration and try again.
```

## Related Features

The improved connection handling works in conjunction with other features in version 0.5.4:

- **Target Directory Check**: Uses the SSH2 library to check if the target directory contains existing files
- **Enhanced File Transfer**: More reliable file transfers with better error handling
- **Improved Password Authentication**: Better handling of password authentication for SCP operations 