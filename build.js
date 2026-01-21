#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = path.join(__dirname, 'src');
const DIST_DIR = path.join(__dirname, 'dist');
const OUTPUT_FILE = path.join(DIST_DIR, 'filemanager.php');

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        log(`Error reading ${filePath}: ${err.message}`, 'red');
        process.exit(1);
    }
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function build() {
    log('\n🔨 Building File Manager...', 'blue');

    ensureDir(DIST_DIR);

    // Read all PHP modules
    log('  📄 Reading PHP modules...', 'yellow');
    const phpConfig = readFile(path.join(SRC_DIR, 'php', 'config.php'));
    const phpAuth = readFile(path.join(SRC_DIR, 'php', 'auth.php'));
    const phpFilesystem = readFile(path.join(SRC_DIR, 'php', 'filesystem.php'));
    const phpArchive = readFile(path.join(SRC_DIR, 'php', 'archive.php'));
    const phpApi = readFile(path.join(SRC_DIR, 'php', 'api.php'));

    // Read CSS modules
    log('  🎨 Reading CSS modules...', 'yellow');
    const cssBase = readFile(path.join(SRC_DIR, 'css', 'base.css'));
    const cssComponents = readFile(path.join(SRC_DIR, 'css', 'components.css'));
    const combinedCSS = cssBase + '\n' + cssComponents;

    // Read JavaScript modules
    log('  📜 Reading JavaScript modules...', 'yellow');
    const vueLib = readFile(path.join(SRC_DIR, 'js', 'vue.prod.js'));
    const appJs = readFile(path.join(SRC_DIR, 'js', 'app.js'));

    // Read HTML templates
    log('  📋 Reading HTML templates...', 'yellow');
    let loginTemplate = readFile(path.join(SRC_DIR, 'templates', 'login.html'));
    let mainTemplate = readFile(path.join(SRC_DIR, 'templates', 'main.html'));

    // Replace placeholders in templates
    log('  🔄 Processing templates...', 'yellow');
    loginTemplate = loginTemplate.replace('/* CSS_PLACEHOLDER */', combinedCSS);
    mainTemplate = mainTemplate.replace('/* CSS_PLACEHOLDER */', combinedCSS);
    mainTemplate = mainTemplate.replace('/* VUE_PLACEHOLDER */', vueLib);
    mainTemplate = mainTemplate.replace('/* JS_PLACEHOLDER */', appJs);

    // Get version info
    log('  📦 Adding version information...', 'yellow');
    const packageJson = JSON.parse(readFile(path.join(__dirname, 'package.json')));
    const version = packageJson.version;
    const buildDate = new Date().toISOString();

    // Build the final PHP file
    log('  🔧 Assembling final file...', 'yellow');
    const output = `<?php
/**
 * PHP File Manager
 * Single File - Built from modular source
 *
 * @version ${version}
 * @build ${buildDate}
 * @repository https://github.com/Al-Waleed-IT/single-php-file-manager
 * @license MIT
 */

define('APP_VERSION', '${version}');
define('APP_BUILD_DATE', '${buildDate}');

session_start();

${phpConfig}

${phpAuth}

${phpFilesystem}

${phpArchive}

${phpApi}

// Initialize
initializeUsers();

// Show login or main page
if (!isAuthenticated()) {
?>
${loginTemplate}
<?php
exit;
}
?>
${mainTemplate}
`;

    // Write the output file
    fs.writeFileSync(OUTPUT_FILE, output);

    const stats = fs.statSync(OUTPUT_FILE);
    const sizeKB = (stats.size / 1024).toFixed(2);

    log(`\n✅ Build complete!`, 'green');
    log(`  📦 Output: ${OUTPUT_FILE}`, 'green');
    log(`  📏 Size: ${sizeKB} KB`, 'green');
    log(`  ⏰ Time: ${new Date().toLocaleTimeString()}\n`, 'green');
}

function watch() {
    log('\n👀 Watch mode enabled - monitoring for changes...', 'blue');

    // Initial build
    build();

    // Watch for file changes
    const watchPaths = [
        path.join(SRC_DIR, 'php'),
        path.join(SRC_DIR, 'js'),
        path.join(SRC_DIR, 'css'),
        path.join(SRC_DIR, 'templates')
    ];

    watchPaths.forEach(watchPath => {
        fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
            if (filename) {
                log(`\n📝 Change detected in ${filename}`, 'yellow');
                build();
            }
        });
    });

    log('  Press Ctrl+C to stop watching\n', 'blue');
}

// Main execution
if (process.argv.includes('--watch') || process.argv.includes('-w')) {
    watch();
} else {
    build();
}
