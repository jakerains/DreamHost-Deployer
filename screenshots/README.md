# Screenshots for DreamHost Deployer

This directory contains HTML mockups of the DreamHost Deployer terminal interface. To generate the actual images referenced in the main README, you have several options:

## Option 1: Manual Screenshots

1. Open the HTML files in a browser:
   - main-menu.html
   - deployment.html
   - ssh-setup.html

2. Take screenshots of each page and save them with the same filename but with a `.png` extension:
   - main-menu.png
   - deployment.png
   - ssh-setup.png

## Option 2: Using Chrome Headless Mode

If you have Google Chrome or Chromium installed, you can run our provided shell script:

```bash
# Make sure the script is executable
chmod +x scripts/generate-screenshots.sh

# Run the script
./scripts/generate-screenshots.sh
```

This will automatically generate the PNG files in this directory.

## Option 3: Using wkhtmltoimage

If you have `wkhtmltoimage` installed, you can run:

```bash
node scripts/generate-screenshots.js
```

## Why we need these screenshots

These screenshots are displayed in the main GitHub README to showcase the beautiful terminal interface of DreamHost Deployer. They help users understand the visual experience they'll get when using the tool. 