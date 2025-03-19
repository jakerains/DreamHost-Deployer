#!/bin/bash

# Create the assets/images directory if it doesn't exist
mkdir -p assets/images

# Function to create a styled border
create_border() {
  echo -e "\e[34m┌────────────────────────────────────────────────────────────────────────────┐\e[0m"
}

create_bottom_border() {
  echo -e "\e[34m└────────────────────────────────────────────────────────────────────────────┘\e[0m"
}

# Function to center text
center_text() {
  local text="$1"
  local width=78
  local padding=$(( (width - ${#text}) / 2 ))
  printf "\e[34m│\e[0m%${padding}s%s%$((width - padding - ${#text}))s\e[34m│\e[0m\n" "" "$text" ""
}

# Function to create a blank line with borders
blank_line() {
  echo -e "\e[34m│\e[0m                                                                            \e[34m│\e[0m"
}

# Create the DreamHost Deployer logo image
echo "Creating logo placeholder..."
echo "
DreamHost Deployer Logo - Replace with real logo
" > assets/images/logo.png

# Create the main menu image
echo "Creating main menu image..."
{
  create_border
  blank_line
  center_text "\e[1;36mDreamHost Deployer v0.6.2\e[0m"
  center_text "\e[90mA stylish, interactive CLI tool for deploying websites to DreamHost\e[0m"
  blank_line
  center_text "\e[1;37mMAIN MENU\e[0m"
  blank_line
  echo -e "\e[34m│\e[0m  \e[1;32m1.\e[0m \e[1;37mDeploy Website\e[0m                                                        \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m  \e[1;32m2.\e[0m \e[1;37mSetup SSH Key\e[0m                                                         \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m  \e[1;32m3.\e[0m \e[1;37mConfigure Project Settings\e[0m                                            \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m  \e[1;32m4.\e[0m \e[1;37mCheck Server Environment\e[0m                                              \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m  \e[1;32m5.\e[0m \e[1;37mManage .htaccess Configuration\e[0m                                        \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m  \e[1;32m6.\e[0m \e[1;37mRun Build Process\e[0m                                                     \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m  \e[1;32m7.\e[0m \e[1;37mView Deployment Info\e[0m                                                  \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m  \e[1;32m8.\e[0m \e[1;37mExit\e[0m                                                                  \e[34m│\e[0m"
  blank_line
  center_text "\e[3;90mUse arrow keys to navigate and Enter to select\e[0m"
  blank_line
  create_bottom_border
} > assets/images/main-menu.txt

# Create the deployment image
echo "Creating deployment image..."
{
  create_border
  blank_line
  center_text "\e[1;36mDreamHost Deployer v0.6.2\e[0m"
  center_text "\e[90mDeploying website to DreamHost\e[0m"
  blank_line
  echo -e "\e[34m│\e[0m  \e[1;37mTarget:\e[0m example.com (\e[36mexample@example.dreamhost.com\e[0m)                         \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m  \e[1;37mLocal path:\e[0m ./dist                                                         \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m  \e[1;37mRemote path:\e[0m /home/example/example.com                                     \e[34m│\e[0m"
  blank_line
  echo -e "\e[34m│\e[0m  \e[1;32m✓\e[0m Running build process... \e[90m(npm run build)\e[0m                                 \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m  \e[1;32m✓\e[0m Creating backup of remote files                                           \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m  \e[1;32m✓\e[0m Optimizing assets                                                         \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m  \e[1;36m⟳\e[0m Uploading files to server: \e[36m[====================>           ] 73%\e[0m        \e[34m│\e[0m"
  blank_line
  echo -e "\e[34m│\e[0m  \e[90mTransferred 123 of 168 files (5.3 MB of 7.2 MB)\e[0m                              \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m  \e[90mEstimated time remaining: 23 seconds\e[0m                                         \e[34m│\e[0m"
  blank_line
  center_text "\e[3;90mPress Ctrl+C to cancel the deployment\e[0m"
  blank_line
  create_bottom_border
} > assets/images/deployment.txt

# Create the SSH setup image
echo "Creating SSH setup image..."
{
  create_border
  blank_line
  center_text "\e[1;36mDreamHost Deployer v0.6.2\e[0m"
  center_text "\e[90mSSH Key Setup Assistant\e[0m"
  blank_line
  echo -e "\e[34m│\e[0m  \e[1;32m✓\e[0m Checking for existing SSH keys                                            \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m  \e[1;32m✓\e[0m Found SSH key: \e[36m~/.ssh/id_rsa.pub\e[0m                                        \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m  \e[1;32m✓\e[0m Fixed permissions on SSH key files                                        \e[34m│\e[0m"
  blank_line
  echo -e "\e[34m│\e[0m  \e[1;37mYour SSH Public Key:\e[0m                                                       \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m  \e[90mssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC4s0qNYf...truncated...user@host\e[0m       \e[34m│\e[0m"
  blank_line
  echo -e "\e[34m│\e[0m  \e[1;33m!\e[0m To complete setup, add this key to your DreamHost panel:                  \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m    1. Log in to DreamHost Panel                                                 \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m    2. Go to \e[36mServers → SSH Keys\e[0m                                                 \e[34m│\e[0m"
  echo -e "\e[34m│\e[0m    3. Add the key shown above                                                   \e[34m│\e[0m"
  blank_line
  center_text "\e[3;90mPress Enter to continue\e[0m"
  blank_line
  create_bottom_border
} > assets/images/ssh-setup.txt

echo "Converting text files to PNG images..."
echo "Note: This is a placeholder. In a real environment, you would need tools"
echo "like 'aha' and 'wkhtmltoimage' to convert these to actual PNG files."

echo "Done! Image placeholders created in assets/images/" 