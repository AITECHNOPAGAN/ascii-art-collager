#!/bin/bash

# Build the React app
echo "Building React app..."
cd react-app
npm run build

# Move dist to root for GitHub Pages
echo "Preparing deployment..."
cd ..
rm -rf docs
mkdir -p docs
cp -r react-app/dist/* docs/

echo "✅ Build complete! The docs/ folder is ready for GitHub Pages deployment."
echo ""
echo "To deploy:"
echo "1. Go to your GitHub repository settings"
echo "2. Navigate to Pages section"
echo "3. Set source to 'main' branch and '/docs' folder"
echo "4. Commit and push the docs/ folder"

