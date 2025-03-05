# Target Directory Check Feature

## Overview

The Target Directory Check feature enhances the deployment process by checking if the target directory on the DreamHost server contains existing files before proceeding with deployment. This allows users to make informed decisions about how to handle existing files, preventing accidental overwrites or data loss.

## How It Works

When you run the deployment command, the tool will:

1. Connect to your DreamHost server using SSH
2. Check if the target directory exists
3. If it exists, check if it contains any files (other than the standard `.` and `..` entries)
4. Based on the results, provide options for how to proceed

## Options

If the target directory contains existing files, you'll be presented with the following options:

1. **Update existing files (keep other files)**
   - This option will deploy your new files, overwriting any existing files with the same names
   - Files in the target directory that don't exist in your local project will be preserved
   - This is useful for updating an existing website while keeping other files intact

2. **Clean directory and deploy (remove all existing files)**
   - This option will remove all existing files from the target directory before deployment
   - This ensures a clean deployment with only the files from your current project
   - Use this when you want to start fresh or when deploying a completely different project

3. **Cancel deployment**
   - This option will abort the deployment process
   - No changes will be made to the target directory
   - Use this if you need to review the existing files before proceeding

## Implementation Details

The feature uses the SSH2 library to establish a secure connection to the server and execute commands to check the directory contents. This approach is more reliable than using command-line SSH tools, especially on Windows systems.

Key implementation aspects:

- Uses a single SSH connection for the directory check to minimize authentication prompts
- Properly handles both password and key-based authentication
- Includes timeout handling and connection keepalive to prevent connection drops
- Provides clear, user-friendly messages about the state of the target directory

## Usage Examples

### Example 1: Empty Target Directory

```
🚀 Starting deployment to DreamHost...

📂 Loaded configuration:
   Host: example.dreamhost.com
   Username: user123
   Remote Path: /home/user123/example.com
   Local Path: ./my-project
   Web Server: Apache (default)

🔍 Checking target directory for existing files...
🔌 SSH connection established.
✅ Target directory /home/user123/example.com exists but is empty.

🔍 Checking server environment...
```

### Example 2: Target Directory with Existing Files

```
🚀 Starting deployment to DreamHost...

📂 Loaded configuration:
   Host: example.dreamhost.com
   Username: user123
   Remote Path: /home/user123/example.com
   Local Path: ./my-project
   Web Server: Apache (default)

🔍 Checking target directory for existing files...
🔌 SSH connection established.
⚠️ Target directory /home/user123/example.com contains existing files.
? The target directory contains existing files. What would you like to do? (Use arrow keys)
> Update existing files (keep other files)
  Clean directory and deploy (remove all existing files)
  Cancel deployment
```

### Example 3: Cleaning Directory Before Deployment

```
🚀 Starting deployment to DreamHost...

📂 Loaded configuration:
   Host: example.dreamhost.com
   Username: user123
   Remote Path: /home/user123/example.com
   Local Path: ./my-project
   Web Server: Apache (default)

🔍 Checking target directory for existing files...
🔌 SSH connection established.
⚠️ Target directory /home/user123/example.com contains existing files.
? The target directory contains existing files. What would you like to do? Clean directory and deploy (remove all existing files)

🧹 Cleaning target directory...
🔌 SSH connection established.
✅ Target directory /home/user123/example.com has been cleaned.

🔍 Checking server environment...
```

## Troubleshooting

If you encounter issues with the target directory check:

1. **Connection Timeout**
   - Ensure your SSH credentials are correct
   - Check if the server is accessible
   - Try increasing the connection timeout in the code if needed

2. **Permission Denied**
   - Verify that your user has permission to access the target directory
   - Check if your SSH key or password is correctly configured

3. **Directory Not Found**
   - The tool will automatically create the directory during deployment
   - No action is needed if the directory doesn't exist yet

## Related Features

The Target Directory Check feature works in conjunction with other improvements in version 0.5.4:

- **Improved Connection Handling**: Enhanced SSH connection reliability with timeout handling and keepalive packets
- **Batch Processing**: File transfers are now processed in batches to prevent overwhelming the server
- **Sequential Directory Creation**: Directories are created one by one to ensure reliability 