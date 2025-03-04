# Publishing Guide for DreamHost Deployer v0.5.0

This guide outlines the steps for publishing the DreamHost Deployer package to npm.

## Pre-Publishing Checklist

Before publishing, ensure the following:

- [x] Version number updated to 0.5.0 in package.json
- [x] CHANGELOG.md updated with all new features and improvements
- [x] All code changes tested and working correctly
- [x] Documentation updated to reflect new features and changes
- [x] Release notes created in docs/v0.5.0-release-notes.md

### Key Features in v0.5.0

- **Interactive CLI Menu**: Main menu with all available commands
- **Enhanced Server Environment Checks**: More detailed output with follow-up actions
- **Updated Node.js Support**: Added support for Node.js 22.14.0 LTS (Jod)
- **Improved User Experience**: Better color-coded output and guidance

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
   Check that the version is 0.5.0 and all information is correct.

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
   Should output 0.5.0

3. **Try the interactive menu**:
   ```
   dreamhost-deployer
   ```
   Verify that the menu displays correctly and all options work.

4. **Check server environment**:
   ```
   dreamhost-deployer check-server
   ```
   Verify that the enhanced output and follow-up actions work correctly.

5. **Set up Node.js with the latest version**:
   ```
   dreamhost-deployer setup-node
   ```
   Choose Node.js 22.14.0 LTS and verify the installation.

6. **Deploy using the new method**:
   ```
   dreamhost-deployer deploy
   ```
   Verify that the deployment process works correctly.

## Troubleshooting

### Interactive Menu Issues
- If the menu doesn't display correctly, check the terminal compatibility
- Verify that inquirer and chalk are installed correctly
- Try running with the specific command instead (e.g., `dreamhost-deployer check-server`)

### SSH Authentication Issues
- If SSH authentication fails, try the troubleshooting guidance provided by the tool
- Check the available authentication methods with:
  ```
  ssh -v username@host
  ```
- Verify SSH key permissions if using key authentication
- Try connecting manually to verify credentials:
  ```
  ssh username@host
  ```

### Server Environment Check Issues
- If the server environment check fails, verify SSH connectivity
- Check if NVM is installed manually:
  ```
  ssh username@host "source ~/.nvm/nvm.sh && nvm --version"
  ```
- Check if Node.js is installed manually:
  ```
  ssh username@host "source ~/.nvm/nvm.sh && node --version"
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