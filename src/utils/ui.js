/**
 * DreamHost Deployer UI Utilities
 * Provides stylish terminal UI components for an enhanced CLI experience
 */

const chalk = require('chalk');
const ora = require('ora');
const figlet = require('figlet');
const boxen = require('boxen');
const gradient = require('gradient-string');
const terminalLink = require('terminal-link');
const Table = require('cli-table3');
const cliProgress = require('cli-progress');

// Gradient themes
const primaryGradient = gradient(['#396afc', '#2948ff']);
const successGradient = gradient(['#00b09b', '#96c93d']);
const errorGradient = gradient(['#ff416c', '#ff4b2b']);
const infoGradient = gradient(['#457fca', '#5691c8']);

/**
 * Create a stylish header
 * @param {string} text The header text
 * @returns {string} The stylish header
 */
function header(text) {
  return figlet.textSync(text, {
    font: 'Standard',
    horizontalLayout: 'full'
  });
}

/**
 * Display the main application header
 */
function showAppHeader() {
  console.clear();
  console.log('\n');
  console.log(primaryGradient(header('DreamHost')));
  console.log(primaryGradient(header('Deployer')));
  console.log('\n');
  
  const version = require('../../package.json').version;
  console.log(boxen(
    chalk.bold(`Version ${version}`) + '\n\n' +
    chalk.cyan('A stylish tool for deploying websites to DreamHost'),
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: 'round',
      borderColor: 'blue'
    }
  ));
  console.log('\n');
}

/**
 * Display a section header
 * @param {string} title The section title
 */
function sectionHeader(title) {
  console.log('\n' + boxen(chalk.bold(` ${title} `), {
    padding: 0,
    margin: { top: 1, bottom: 1 },
    borderStyle: 'round',
    borderColor: 'blue'
  }));
}

/**
 * Display a subsection header
 * @param {string} title The subsection title
 */
function subsectionHeader(title) {
  console.log('\n' + chalk.cyan.bold(`[ ${title} ]`));
}

/**
 * Create a spinner with a message
 * @param {string} text The spinner text
 * @returns {object} The spinner instance
 */
function spinner(text) {
  return ora({
    text,
    color: 'blue',
    spinner: 'dots'
  });
}

/**
 * Create a progress bar
 * @returns {object} The progress bar instance
 */
function progressBar() {
  return new cliProgress.SingleBar({
    format: chalk.cyan('{bar}') + ' | {percentage}% || {value}/{total} {unit}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });
}

/**
 * Create a table
 * @param {string[]} headers The table headers
 * @param {object} options Table options
 * @returns {object} The table instance
 */
function createTable(headers, options = {}) {
  return new Table({
    head: headers.map(h => chalk.bold.cyan(h)),
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    },
    style: {
      head: [],
      border: []
    },
    ...options
  });
}

/**
 * Format success message
 * @param {string} message The success message
 * @returns {string} The formatted message
 */
function success(message) {
  return successGradient(`✨ ${message}`);
}

/**
 * Format error message
 * @param {string} message The error message
 * @returns {string} The formatted message
 */
function error(message) {
  return errorGradient(`✖ ${message}`);
}

/**
 * Format info message
 * @param {string} message The info message
 * @returns {string} The formatted message
 */
function info(message) {
  return infoGradient(`ℹ ${message}`);
}

/**
 * Format warning message
 * @param {string} message The warning message
 * @returns {string} The formatted message
 */
function warning(message) {
  return chalk.yellow(`⚠ ${message}`);
}

/**
 * Create a collapsible section
 * @param {string} title The section title
 * @param {string} content The section content
 * @returns {string} The formatted section
 */
function collapsibleSection(title, content) {
  return boxen(
    chalk.bold(title) + '\n\n' + content,
    {
      padding: 1,
      margin: { top: 0, bottom: 1 },
      borderStyle: 'round',
      borderColor: 'cyan'
    }
  );
}

/**
 * Create a code block
 * @param {string} code The code content
 * @returns {string} The formatted code block
 */
function codeBlock(code) {
  return boxen(
    code,
    {
      padding: 1,
      margin: { top: 0, bottom: 1 },
      borderStyle: 'round',
      borderColor: 'yellow'
    }
  );
}

/**
 * Format a clickable link
 * @param {string} text The link text
 * @param {string} url The URL
 * @returns {string} The formatted link
 */
function link(text, url) {
  return terminalLink(chalk.underline.blue(text), url, { fallback: true });
}

/**
 * Format project type badge
 * @param {string} type The project type
 * @returns {string} The formatted badge
 */
function projectTypeBadge(type) {
  const colors = {
    vite: '#646cff',
    react: '#61dafb',
    nextjs: '#000000',
    nuxt: '#00dc82',
    gatsby: '#663399',
    angular: '#dd0031',
    svelte: '#ff3e00',
    'vue-cli': '#42b883'
  };
  
  const bgColor = colors[type] || '#4a4a4a';
  const textColor = ['nextjs', 'angular'].includes(type) ? '#ffffff' : '#000000';
  
  return chalk.bgHex(bgColor).hex(textColor)(` ${type.toUpperCase()} `);
}

/**
 * Format highlighted text
 * @param {string} text The text to highlight
 * @returns {string} The highlighted text
 */
function highlight(text) {
  return chalk.cyan.bold(text);
}

/**
 * Format a label
 * @param {string} text The label text
 * @returns {string} The formatted label
 */
function label(text) {
  return chalk.blue.bold(text);
}

/**
 * Create a box around text
 * @param {string} content The content for the box
 * @param {object} options Box options
 * @returns {string} The boxed content
 */
function box(content, options = {}) {
  return boxen(content, {
    padding: options.padding || 1,
    margin: options.margin || { top: 0, bottom: 1 },
    borderStyle: options.borderStyle || 'round',
    borderColor: options.borderColor || 'blue',
    title: options.title || '',
    titleAlignment: options.titleAlignment || 'center'
  });
}

/**
 * Format a list item
 * @param {string} text The list item text
 * @returns {string} The formatted list item
 */
function listItem(text) {
  return `  • ${text}`;
}

/**
 * Format a command
 * @param {string} cmd The command
 * @returns {string} The formatted command
 */
function command(cmd) {
  return chalk.green(`\`${cmd}\``);
}

/**
 * Format a badge
 * @param {string} text The badge text
 * @param {string} type The badge type (success, error, warning, normal)
 * @returns {string} The formatted badge
 */
function badge(text, type = 'normal') {
  const colors = {
    success: { bg: 'bgGreen', fg: 'black' },
    error: { bg: 'bgRed', fg: 'white' },
    warning: { bg: 'bgYellow', fg: 'black' },
    normal: { bg: 'bgBlue', fg: 'white' }
  };
  
  const style = colors[type] || colors.normal;
  return chalk[style.bg][style.fg](` ${text} `);
}

/**
 * Display a success box with a message or array of messages
 * @param {string|string[]} content The content to display
 */
function successBox(content) {
  const messages = Array.isArray(content) ? content : [content];
  
  console.log(boxen(
    messages.join('\n'),
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: 'round',
      borderColor: 'green',
      title: '✅ Success',
      titleAlignment: 'center'
    }
  ));
}

module.exports = {
  showAppHeader,
  sectionHeader,
  subsectionHeader,
  spinner,
  progressBar,
  createTable,
  success,
  error,
  info,
  warning,
  collapsibleSection,
  codeBlock,
  link,
  projectTypeBadge,
  highlight,
  label,
  box,
  listItem,
  command,
  badge,
  successBox
}; 