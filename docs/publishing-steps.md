# Publishing Steps for DreamHost Deployer v0.4.1

This guide outlines the steps to publish the latest version of DreamHost Deployer with SSH key and deployment fixes.

## Pre-publishing Checklist

1. ✅ Fixed "minimatch is not a function" error
   - Updated minimatch package to version 5.1.0
   - Improved error handling in file exclusion logic

2. ✅ Added automatic Ed25519 SSH key detection
   - Code now checks for both RSA and Ed25519 keys
   - Prioritizes Ed25519 keys when available

3. ✅ Added new `fix-ssh-key` command
   - Interactive tool to diagnose and fix SSH key issues
   - Options to generate new Ed25519 keys or use existing ones

4. ✅ Improved error handling
   - Better error messages for SSH and SCP operations
   - Detailed reporting for failed directory creation and file transfers

5. ✅ Updated documentation
   - CHANGELOG.md updated with all fixes
   - project-map.md updated to reflect new components

## Publishing Steps

1. **Verify package contents**
   ```bash
   npm pack
   ```
   This will create a tarball file that you can inspect to ensure all necessary files are included.

2. **Login to npm (if not already logged in)**
   ```bash
   npm login
   ```

3. **Publish the package**
   ```bash
   npm publish
   ```

4. **Verify the published package**
   ```bash
   npm view dreamhost-deployer
   ```

## Testing on Target System

After publishing, you can test the package on the target system with:

```bash
# Update to the latest version
npm install -g dreamhost-deployer@latest

# Check the installed version
dreamhost-deployer --version

# Fix SSH key issues
dreamhost-deployer fix-ssh-key

# Try deploying again
dreamhost-deployer deploy
```

## Troubleshooting

If you encounter issues after publishing:

1. **SSH Key Issues**
   - Run `dreamhost-deployer fix-ssh-key` to diagnose and fix SSH key problems
   - Ensure the key is properly added to DreamHost panel

2. **Deployment Issues**
   - Check the error messages for specific details
   - Verify your configuration in `deploy.config.json`
   - Try running with verbose output: `DEBUG=* dreamhost-deployer deploy`

3. **Package Issues**
   - If the package is missing files, check your `.npmignore` file
   - Ensure all dependencies are correctly listed in `package.json` 