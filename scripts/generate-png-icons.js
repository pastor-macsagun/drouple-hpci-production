#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Simple icon generation for PWA compatibility
// This creates placeholder PNG files that reference the SVG content
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512]

const svgIcon = fs.readFileSync('public/icon.svg', 'utf8')

// Extract the SVG content and create optimized versions
const createPngPlaceholder = (size) => {
  // For production, this would use a proper SVG to PNG converter
  // For now, we'll create optimized SVG files with fixed dimensions
  const optimizedSvg = svgIcon
    .replace(/width="[^"]*"/, `width="${size}"`)
    .replace(/height="[^"]*"/, `height="${size}"`)
    .replace(/viewBox="[^"]*"/, `viewBox="0 0 ${size} ${size}"`)

  return optimizedSvg
}

// Generate icon files
iconSizes.forEach(size => {
  const filename = `public/icon-${size}x${size}.png.svg`
  const content = createPngPlaceholder(size)

  fs.writeFileSync(filename, content)
  console.log(`Generated ${filename}`)
})

// Create actual PNG reference files for manifest
iconSizes.forEach(size => {
  const svgFile = `public/icon-${size}x${size}.svg`
  const pngFile = `public/icon-${size}x${size}.png`

  if (fs.existsSync(svgFile) && !fs.existsSync(pngFile)) {
    // Copy SVG as PNG placeholder for now
    // In production, use proper SVG to PNG conversion
    fs.copyFileSync(svgFile, pngFile + '.fallback')
    console.log(`Created PNG reference for ${size}x${size}`)
  }
})

console.log('Icon generation completed!')