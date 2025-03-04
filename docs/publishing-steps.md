# Publishing Guide for DreamHost Deployer v0.4.5

This guide outlines the steps for publishing the DreamHost Deployer package to npm.

## Pre-Publishing Checklist

Before publishing, ensure the following:

- [x] Version number updated to 0.4.5 in package.json
- [x] CHANGELOG.md updated with all new features and improvements
- [x] All code changes tested and working correctly
- [x] Documentation updated to reflect new features and changes
- [x] Release notes created in docs/v0.4.5-release-notes.md

### Key Features in v0.4.5

- **Server Environment Check**: Automatically checks for NVM and Node.js on the server
- **Version Verification**: Compares installed versions against recommended versions
- **Interactive Setup**: Offers to set up or update NVM and Node.js if needed
- **Enhanced Node.js Setup**: Added password authentication support and better error handling

## Publishing Steps

1. **Verify package contents**:
   ```
   npm pack
   ```
   This creates a tarball that you can inspect to ensure all necessary files are included.

2. **Log in to npm** (if not already logged in):
   ```
   npm login
   ```

3. **Publish the package**:
   ```
   npm publish
   ```

4. **Verify the published package**:
   ```
   npm view dreamhost-deployer
   ```
   Check that the version is 0.4.5 and all information is correct.

## Testing on Target System

After publishing, test the package on a target system:

1. **Install the package**:
   ```
   npm install -g dreamhost-deployer@latest
   ```

2. **Verify the version**:
   ```
   dreamhost-deployer --version
   ```
   Should output 0.4.5

3. **Set up SSH with password authentication**:
   ```
   dreamhost-deployer setup-ssh
   ```
   Choose password authentication when prompted.

4. **Deploy using the new method**:
   ```
   dreamhost-deployer deploy
   ```
   Verify that the server environment check runs before deployment.

## Troubleshooting

### Server Environment Check Issues
- If the server environment check fails, try running the setup-node command manually:
  ```
  dreamhost-deployer setup-node
  ```
- Check SSH connectivity to ensure the tool can connect to the server
- Verify that the user has sufficient permissions to install NVM and Node.js

### Authentication Issues
- Ensure the username and host are correct in the configuration
- Try running the SSH command manually to verify connectivity:
  ```
  ssh username@host
  ```

### Deployment Issues
- Run with verbose output:
  ```
  DEBUG=* dreamhost-deployer deploy
  ```
- Check if the remote directory exists and has correct permissions
- Verify that the local files exist and are readable

### Package Issues
- If the package is not working correctly, try reinstalling:
  ```
  npm uninstall -g dreamhost-deployer
  npm install -g dreamhost-deployer@latest
  ```
- Check for any error messages during installation 