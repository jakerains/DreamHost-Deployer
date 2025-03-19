#!/bin/bash

# Generate screenshots using Chrome headless mode
# Requires Google Chrome or Chromium to be installed

echo "Generating screenshots for DreamHost Deployer..."

# Path to Chrome or Chromium
if [ "$(uname)" == "Darwin" ]; then
  # macOS
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  # Linux
  CHROME=$(which google-chrome || which google-chrome-stable || which chromium-browser || which chromium)
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ] || [ "$(expr substr $(uname -s) 1 10)" == "MINGW64_NT" ]; then
  # Windows
  CHROME="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
else
  echo "Unsupported operating system"
  exit 1
fi

if [ ! -x "$CHROME" ]; then
  echo "Chrome or Chromium not found. Please install Google Chrome or Chromium."
  exit 1
fi

# Create screenshots directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
SCREENSHOTS_DIR="$REPO_DIR/screenshots"

# Generate screenshots with Chrome headless
"$CHROME" --headless --screenshot="$SCREENSHOTS_DIR/main-menu.png" --window-size=850,800 --default-background-color=0 file://"$SCREENSHOTS_DIR/main-menu.html"
"$CHROME" --headless --screenshot="$SCREENSHOTS_DIR/deployment.png" --window-size=850,1000 --default-background-color=0 file://"$SCREENSHOTS_DIR/deployment.html"
"$CHROME" --headless --screenshot="$SCREENSHOTS_DIR/ssh-setup.png" --window-size=850,1000 --default-background-color=0 file://"$SCREENSHOTS_DIR/ssh-setup.html"

echo "Screenshots generated in $SCREENSHOTS_DIR directory"
echo "You can now view them in the README on GitHub" 