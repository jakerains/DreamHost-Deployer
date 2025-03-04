# Windows Deployment Guide

This guide provides detailed instructions for Windows users deploying to DreamHost with our tool.

## Deployment Options for Windows

There are three main ways to deploy from Windows:

1. **Using WSL (Recommended for best performance)**
2. **Using the built-in SCP alternative (Simplest approach)**
3. **Installing rsync directly on Windows (Advanced)**

## Option 1: Deploy using WSL

Windows Subsystem for Linux (WSL) provides the best performance as it allows running the Linux version of rsync natively.

### Prerequisites
- WSL installed with a Linux distribution (Ubuntu recommended)
- rsync installed in your WSL distribution

### Installation Steps

1. **Check if WSL is installed**:
   Open PowerShell and run:
   ```powershell
   wsl --list
   ```

2. **Install WSL if not present**:
   ```powershell
   wsl --install
   ```
   (Restart your computer after installation)

3. **Launch WSL terminal**:
   Search for "Ubuntu" or your WSL distribution in the Start menu

4. **Install rsync in WSL**:
   ```bash
   sudo apt update
   sudo apt install rsync
   ```

5. **Verify rsync installation**:
   ```bash
   rsync --version
   ```

### Deployment Steps

1. **Navigate to your project directory in WSL**:
   ```bash
   # Windows C: drive is mounted at /mnt/c in WSL
   cd /mnt/c/Users/jaker/your-project-path
   ```

2. **Run the deployment tool**:
   ```bash
   dreamhost-deployer deploy
   ```

## Option 2: Use the Built-in SCP Alternative

If you don't want to use WSL, our tool now includes an SCP-based alternative that works natively on Windows.

### Deployment Steps

1. **Run the deployment from Windows Command Prompt or PowerShell**:
   ```
   dreamhost-deployer deploy
   ```

2. **When prompted, choose "Use alternative SCP method"**

3. **The tool will use SCP to transfer files** (slightly slower than rsync but works directly on Windows)

## Option 3: Install rsync on Windows (Advanced)

For users who prefer to have rsync directly on Windows.

### Installation Methods

1. **Using Git Bash**:
   - Install Git for Windows (includes rsync)
   - Run commands from Git Bash

2. **Using Chocolatey** (Windows package manager):
   ```powershell
   choco install rsync
   ```

3. **Using cwRsync**:
   - Download a standalone rsync package for Windows
   - Add to your system PATH

## Troubleshooting

### "rsync not recognized" error
- This occurs when running from Windows shell even if WSL is installed
- Solution: Either run from within WSL terminal OR choose the SCP alternative

### SSH key issues
- The tool now generates Ed25519 keys instead of RSA keys for better compatibility with DreamHost
- If you're having issues with SSH authentication, try regenerating your keys with `dreamhost-deployer setup-ssh`
- Make sure your SSH key is properly set up in both Windows and WSL
- For WSL, you may need to copy your Windows SSH key to the WSL ~/.ssh directory

### File path issues
- Windows uses backslashes (\\) while WSL/Linux uses forward slashes (/)
- Our tool tries to handle this automatically, but manual path adjustments may be needed in some cases

## Need More Help?

If you encounter any issues with Windows deployment, please open an issue on our GitHub repository with details about your setup and the specific error message. 