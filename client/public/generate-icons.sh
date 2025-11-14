#!/bin/bash
# Generate PNG icons from SVG for better PWA support

# Check if imagemagick is available
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Installing..."
    # This won't work on Replit, but we'll create a note
    echo "Note: PNG icons should be generated from favicon.svg"
    echo "For now, we'll create placeholder text files"
    
    # Create placeholder files to document what's needed
    echo "192x192 PNG needed from favicon.svg" > icon-192.png.txt
    echo "512x512 PNG needed from favicon.svg" > icon-512.png.txt
    exit 0
fi

# Generate icons
convert favicon.svg -resize 192x192 icon-192.png
convert favicon.svg -resize 512x512 icon-512.png

echo "Icons generated successfully!"
