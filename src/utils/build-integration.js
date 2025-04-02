const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Build integration module for DreamHost Deployer
 * Handles running build processes for various project types
 */

// Main build function
async function runBuild(config) {
  if (!config.buildIntegration || !config.buildCommand) {
    throw new Error('Build integration is not enabled or build command is not specified');
  }
  
  console.log(chalk.blue(`🔨 Running build command: ${config.buildCommand}`));
  
  try {
    // Execute the build command
    const { stdout, stderr } = await execAsync(config.buildCommand, {
      cwd: process.cwd(),
      shell: true,
      env: { ...process.env, FORCE_COLOR: 'true' } // Preserve color output
    });
    
    if (stdout) {
      console.log(chalk.gray('Build output:'));
      console.log(stdout);
    }
    
    if (stderr && stderr.trim().length > 0) {
      console.log(chalk.yellow('Build warnings/errors:'));
      console.log(stderr);
    }
    
    // Verify that build output directory exists
    const buildOutputPath = path.resolve(process.cwd(), config.buildOutputDir);
    if (!fs.existsSync(buildOutputPath)) {
      // Create the directory instead of throwing an error
      console.log(chalk.yellow(`⚠️ Build output directory not found: ${buildOutputPath}, creating it...`));
      try {
        fs.mkdirSync(buildOutputPath, { recursive: true });
        console.log(chalk.green(`✅ Created build output directory: ${buildOutputPath}`));
      } catch (err) {
        throw new Error(`Failed to create build output directory: ${err.message}`);
      }
    }
    
    return {
      success: true,
      outputPath: buildOutputPath
    };
  } catch (error) {
    console.error(chalk.red(`❌ Build failed: ${error.message}`));
    
    // Provide helpful errors based on common framework issues
    const errorOutput = error.message + (error.stderr || '');
    
    if (errorOutput.includes('vite')) {
      if (errorOutput.includes('not found') || errorOutput.includes('command not found')) {
        console.log(chalk.yellow('\nTroubleshooting Vite build issues:'));
        console.log('- Make sure Vite is installed: npm install vite --save-dev');
        console.log('- Check your package.json for a build script: "build": "vite build"');
      } else if (errorOutput.includes('Cannot find module')) {
        console.log(chalk.yellow('\nTroubleshooting Vite module issues:'));
        console.log('- Try running: npm install');
        console.log('- Check for missing dependencies in your project');
      }
    } else if (errorOutput.includes('react-scripts')) {
      console.log(chalk.yellow('\nTroubleshooting Create React App build issues:'));
      console.log('- Make sure react-scripts is installed: npm install react-scripts --save-dev');
      console.log('- Check your package.json for a build script: "build": "react-scripts build"');
    } else if (errorOutput.includes('next')) {
      console.log(chalk.yellow('\nTroubleshooting Next.js build issues:'));
      console.log('- Make sure Next.js is installed: npm install next --save-dev');
      console.log('- Check your package.json for a build script: "build": "next build"');
    }
    
    throw error;
  }
}

// Detect project type for better build integration
function detectProjectType() {
  try {
    // Check for package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return {
        type: 'unknown',
        details: 'No package.json found'
      };
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check for various frameworks
    if (deps.vite || fs.existsSync(path.join(process.cwd(), 'vite.config.js')) || fs.existsSync(path.join(process.cwd(), 'vite.config.ts'))) {
      return {
        type: 'vite',
        details: 'Vite project detected',
        buildCommand: 'npm run build',
        outputDir: 'dist',
        exclude: ['node_modules', '.git', 'src', 'public', '*.config.js', '*.config.ts', '.env*']
      };
    } else if (deps['react-scripts']) {
      return {
        type: 'cra',
        details: 'Create React App project detected',
        buildCommand: 'npm run build',
        outputDir: 'build',
        exclude: ['node_modules', '.git', 'src', 'public', '.env*']
      };
    } else if (deps.next) {
      return {
        type: 'nextjs',
        details: 'Next.js project detected',
        buildCommand: 'npm run build',
        outputDir: 'out', // Assumes export was run
        exclude: ['node_modules', '.git', 'src', 'pages', 'public', '.next', '.env*']
      };
    } else if (deps.gatsby) {
      return {
        type: 'gatsby',
        details: 'Gatsby project detected',
        buildCommand: 'npm run build',
        outputDir: 'public',
        exclude: ['node_modules', '.git', 'src', '.cache', '.env*']
      };
    } else if (deps.nuxt || deps['@nuxt/core']) {
      return {
        type: 'nuxt',
        details: 'Nuxt.js project detected',
        buildCommand: 'npm run build',
        outputDir: 'dist',
        exclude: ['node_modules', '.git', 'assets', 'components', 'layouts', 'pages', 'plugins', 'static', '.nuxt', '.env*']
      };
    } else if (deps.vue || deps['@vue/cli-service']) {
      return {
        type: 'vue-cli',
        details: 'Vue CLI project detected',
        buildCommand: 'npm run build',
        outputDir: 'dist',
        exclude: ['node_modules', '.git', 'src', 'public', 'vue.config.js', '.env*']
      };
    } else if (deps.svelte || deps['svelte-kit']) {
      return {
        type: 'svelte',
        details: 'Svelte/SvelteKit project detected',
        buildCommand: 'npm run build',
        outputDir: 'build',
        exclude: ['node_modules', '.git', 'src', 'static', 'svelte.config.js', '.env*']
      };
    } else if (deps.angular || deps['@angular/core']) {
      return {
        type: 'angular',
        details: 'Angular project detected',
        buildCommand: 'npm run build',
        outputDir: 'dist',
        exclude: ['node_modules', '.git', 'src', 'e2e', 'angular.json', '.env*']
      };
    }
    
    // Generic Node.js project
    return {
      type: 'generic',
      details: 'Generic Node.js project detected',
      buildCommand: packageJson.scripts?.build ? 'npm run build' : null,
      outputDir: fs.existsSync(path.join(process.cwd(), 'dist')) ? 'dist' : 
                (fs.existsSync(path.join(process.cwd(), 'build')) ? 'build' : null),
      exclude: ['node_modules', '.git', 'src', '.env*']
    };
  } catch (error) {
    console.error(chalk.red(`Error detecting project type: ${error.message}`));
    return {
      type: 'unknown',
      details: `Error: ${error.message}`,
      error
    };
  }
}

// Suggest framework-specific optimizations
function suggestOptimizations(projectType) {
  const suggestions = {
    vite: [
      '- Use import.meta.env for environment variables',
      '- Enable build optimizations in vite.config.js',
      '- Consider using /assets/ for static files',
      '- Add base: "/" to vite.config.js for proper path resolution'
    ],
    cra: [
      '- Use process.env.PUBLIC_URL for asset paths',
      '- Add "homepage": "." to package.json for relative paths',
      '- Create a .env.production file for production environment variables'
    ],
    nextjs: [
      '- Use next export for static site generation',
      '- Configure basePath in next.config.js',
      '- Use next/image for optimized images'
    ],
    gatsby: [
      '- Use gatsby-plugin-sitemap for SEO',
      '- Configure pathPrefix in gatsby-config.js',
      '- Use gatsby-image for optimized images'
    ],
    nuxt: [
      '- Set target: "static" in nuxt.config.js',
      '- Configure generate.dir for custom output directory',
      '- Use nuxt/image for optimized images'
    ],
    'vue-cli': [
      '- Set publicPath: "./" in vue.config.js for relative paths',
      '- Enable modern build mode for better performance',
      '- Use vue/cli-plugin-pwa for offline support'
    ],
    svelte: [
      '- Configure paths.base in svelte.config.js',
      '- Use "adapter-static" for static site generation',
      '- Consider URL rewriting for SPA mode'
    ],
    angular: [
      '- Set "baseHref": "/" in angular.json',
      '- Enable production mode for optimized builds',
      '- Use Angular Universal for SSR if needed'
    ]
  };
  
  return suggestions[projectType] || [
    '- Use relative paths for assets',
    '- Create a .htaccess file for Apache URL rewriting',
    '- Set correct base URL in your HTML'
  ];
}

module.exports = {
  runBuild,
  detectProjectType,
  suggestOptimizations
}; 