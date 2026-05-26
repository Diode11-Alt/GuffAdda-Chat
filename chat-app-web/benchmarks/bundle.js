import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');
const statsFilePath = path.join(__dirname, 'stats.json');

function getDirectorySize(dirPath) {
    let size = 0;
    if (!fs.existsSync(dirPath)) return size;

    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            size += getDirectorySize(filePath);
        } else {
            size += stats.size;
        }
    }
    return size;
}

function getAssetSizes(dirPath) {
    const assets = { js: 0, css: 0, other: 0 };
    if (!fs.existsSync(dirPath)) return assets;

    function traverse(currentPath) {
        const files = fs.readdirSync(currentPath);
        for (const file of files) {
            const filePath = path.join(currentPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                traverse(filePath);
            } else {
                if (file.endsWith('.js')) assets.js += stats.size;
                else if (file.endsWith('.css')) assets.css += stats.size;
                else assets.other += stats.size;
            }
        }
    }
    traverse(dirPath);
    return assets;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

console.log('Building the project...');
try {
    execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
} catch (error) {
    console.error('Build failed', error);
    process.exit(1);
}

const currentSize = getDirectorySize(distPath);
const currentAssets = getAssetSizes(distPath);
console.log(`\nCurrent total bundle size: ${formatBytes(currentSize)}`);
console.log(`- JS:  ${formatBytes(currentAssets.js)}`);
console.log(`- CSS: ${formatBytes(currentAssets.css)}`);
console.log(`- Other: ${formatBytes(currentAssets.other)}`);

let previousStats = null;
if (fs.existsSync(statsFilePath)) {
    try {
        previousStats = JSON.parse(fs.readFileSync(statsFilePath, 'utf8'));
    } catch (e) {
        console.error('Could not read previous stats', e);
    }
}

if (previousStats && previousStats.totalSize !== undefined) {
    const previousSize = previousStats.totalSize;
    const diff = currentSize - previousSize;
    const diffFormatted = formatBytes(Math.abs(diff));
    if (diff > 0) {
        console.log(`\nTotal bundle size INCREASED by ${diffFormatted} (+${((diff / previousSize) * 100).toFixed(2)}%)`);
    } else if (diff < 0) {
        console.log(`\nTotal bundle size DECREASED by ${diffFormatted} (${((diff / previousSize) * 100).toFixed(2)}%)`);
    } else {
        console.log('\nTotal bundle size UNCHANGED');
    }
    
    // JS diff
    if (previousStats.assets && previousStats.assets.js !== undefined) {
        const jsDiff = currentAssets.js - previousStats.assets.js;
        console.log(`JS size changed by: ${jsDiff > 0 ? '+' : ''}${formatBytes(jsDiff)}`);
    }
    // CSS diff
    if (previousStats.assets && previousStats.assets.css !== undefined) {
        const cssDiff = currentAssets.css - previousStats.assets.css;
        console.log(`CSS size changed by: ${cssDiff > 0 ? '+' : ''}${formatBytes(cssDiff)}`);
    }
}

// Save new stats
fs.writeFileSync(statsFilePath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalSize: currentSize,
    assets: currentAssets
}, null, 2));

console.log('\nStats saved to benchmarks/stats.json');
