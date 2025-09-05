#!/usr/bin/env node

/**
 * PWA Icon Generation Script for Drouple Church Management System
 * Generates all required icon sizes from the base SVG icon
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Icon sizes required for PWA compliance
const ICON_SIZES = [
  // Standard PWA icons
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  
  // Apple touch icons
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  
  // Favicon variations
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' }
];

// Check if ImageMagick/convert is available
function checkImageMagick() {
  try {
    execSync('convert -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Fallback: Create simple colored rectangles as icons
function generateFallbackIcon(size, outputPath) {
  const svgContent = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.125)}" fill="#1e7ce8"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.25}" fill="white"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.15}" fill="#1e7ce8"/>
  <rect x="${size * 0.25}" y="${size * 0.2}" width="${size * 0.5}" height="${size * 0.15}" fill="white"/>
  <rect x="${size * 0.25}" y="${size * 0.65}" width="${size * 0.5}" height="${size * 0.15}" fill="white"/>
</svg>`;

  const tempSvgPath = outputPath.replace('.png', '.temp.svg');
  fs.writeFileSync(tempSvgPath, svgContent);
  
  try {
    if (checkImageMagick()) {
      execSync(`convert "${tempSvgPath}" "${outputPath}"`);
    } else {
      // If no ImageMagick, just copy the SVG with PNG extension for now
      console.warn(`ImageMagick not available. Creating ${outputPath} as SVG.`);
      fs.copyFileSync(tempSvgPath, outputPath.replace('.png', '.svg'));
    }
    fs.unlinkSync(tempSvgPath);
    return true;
  } catch (error) {
    console.error(`Failed to generate ${outputPath}:`, error.message);
    fs.unlinkSync(tempSvgPath);
    return false;
  }
}

// Generate icons from source SVG
function generateFromSvg(svgPath, size, outputPath) {
  try {
    if (checkImageMagick()) {
      execSync(`convert -background none "${svgPath}" -resize ${size}x${size} "${outputPath}"`);
      return true;
    } else {
      return generateFallbackIcon(size, outputPath);
    }
  } catch (error) {
    console.error(`Failed to generate ${outputPath} from SVG:`, error.message);
    return generateFallbackIcon(size, outputPath);
  }
}

// Generate favicon.ico
function generateFavicon() {
  const publicDir = path.join(__dirname, '..', 'public');
  const faviconPath = path.join(publicDir, 'favicon.ico');
  
  try {
    if (checkImageMagick()) {
      // Create favicon.ico with multiple sizes
      const size16 = path.join(publicDir, 'favicon-16x16.png');
      const size32 = path.join(publicDir, 'favicon-32x32.png');
      const size48 = path.join(publicDir, 'favicon-48x48.png');
      
      if (fs.existsSync(size16) && fs.existsSync(size32) && fs.existsSync(size48)) {
        execSync(`convert "${size16}" "${size32}" "${size48}" "${faviconPath}"`);
        console.log('✅ Generated favicon.ico');
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not generate favicon.ico:', error.message);
  }
}

function main() {
  console.log('🚀 Generating PWA icons for Drouple Church Management System...\n');
  
  const publicDir = path.join(__dirname, '..', 'public');
  const sourceSvg = path.join(publicDir, 'icon.svg');
  
  // Check if source SVG exists
  if (!fs.existsSync(sourceSvg)) {
    console.error('❌ Source icon.svg not found in public directory');
    process.exit(1);
  }
  
  let successCount = 0;
  let totalCount = ICON_SIZES.length;
  
  // Generate all icon sizes
  for (const iconSpec of ICON_SIZES) {
    const outputPath = path.join(publicDir, iconSpec.name);
    console.log(`Generating ${iconSpec.name} (${iconSpec.size}x${iconSpec.size})...`);
    
    if (generateFromSvg(sourceSvg, iconSpec.size, outputPath)) {
      successCount++;
      console.log(`✅ Generated ${iconSpec.name}`);
    } else {
      console.log(`❌ Failed to generate ${iconSpec.name}`);
    }
  }
  
  // Generate favicon.ico
  generateFavicon();
  
  console.log(`\n📊 Results: ${successCount}/${totalCount} icons generated successfully`);
  
  if (successCount === totalCount) {
    console.log('🎉 All PWA icons generated successfully!');
  } else {
    console.log('⚠️ Some icons failed to generate. Manual intervention may be required.');
  }
  
  // Verify critical icons
  const criticalIcons = ['icon-192x192.png', 'icon-512x512.png', 'apple-touch-icon.png'];
  const missingCritical = criticalIcons.filter(icon => 
    !fs.existsSync(path.join(publicDir, icon))
  );
  
  if (missingCritical.length > 0) {
    console.log('\n❌ Critical icons missing:', missingCritical.join(', '));
    console.log('PWA installation may not work properly on some devices.');
  } else {
    console.log('\n✅ All critical PWA icons are present!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateFromSvg, generateFallbackIcon, checkImageMagick };