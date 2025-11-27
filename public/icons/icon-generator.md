# Icon Generation Guide

You need to generate PWA icons for Separa. Here are the required sizes:

## Required Icon Sizes:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152 (Apple)
- 180x180 (Apple)
- 192x192
- 384x384
- 512x512

## Method 1: Using Online Tool (Easiest)
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload your logo/icon (minimum 512x512 recommended)
3. Download all generated icons
4. Place them in this `/public/icons/` folder

## Method 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first, then run:
magick convert source-logo.png -resize 72x72 icon-72x72.png
magick convert source-logo.png -resize 96x96 icon-96x96.png
magick convert source-logo.png -resize 128x128 icon-128x128.png
magick convert source-logo.png -resize 144x144 icon-144x144.png
magick convert source-logo.png -resize 152x152 icon-152x152.png
magick convert source-logo.png -resize 180x180 icon-180x180.png
magick convert source-logo.png -resize 192x192 icon-192x192.png
magick convert source-logo.png -resize 384x384 icon-384x384.png
magick convert source-logo.png -resize 512x512 icon-512x512.png
```

## Method 3: Using Figma/Photoshop
1. Create a 512x512 canvas
2. Design your icon (keep it simple and centered)
3. Export at each size listed above
4. Save as PNG with transparency

## Design Guidelines:
- Keep the design simple and recognizable
- Use your brand colors (emerald green #10b981 for Separa)
- Ensure the icon looks good at small sizes (72x72)
- Consider a maskable icon variant (safe zone in center)
- Test on both light and dark backgrounds

## Temporary Placeholder:
Until you create proper icons, you can use a solid color placeholder or text-based icon.
