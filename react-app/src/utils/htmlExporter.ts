import { Layer, ExportConfig, ResolutionStyles } from '@/types';

export function getResolutionStyles(resolution: string): ResolutionStyles {
    let containerStyles = '';
    let bodyStyles = '';

    switch (resolution) {
        case 'square':
            containerStyles = `
            max-width: 800px;
            max-height: 800px;
            width: 100vmin;
            height: 100vmin;
            border: 1px solid #000000;`;
            bodyStyles = `
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f0f0f0;`;
            break;
        case 'landscape':
            containerStyles = `
            max-width: 1200px;
            max-height: 675px;
            width: 90vw;
            height: calc(90vw * 9 / 16);
            border: 2px solid #000000;`;
            bodyStyles = `
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f0f0f0;`;
            break;
        case 'portrait':
            containerStyles = `
            max-width: 675px;
            max-height: 1200px;
            width: calc(90vh * 9 / 16);
            height: 90vh;
            border: 2px solid #000000;`;
            bodyStyles = `
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f0f0f0;`;
            break;
        case 'responsive':
        default:
            containerStyles = `
            width: 100%;
            height: 100%;`;
            bodyStyles = `
            width: 100vw;
            height: 100vh;
            overflow: hidden;`;
            break;
    }

    return { containerStyles, bodyStyles };
}

export function generateExportHTML(
    layers: Layer[],
    config: ExportConfig
): string {
    // Filter visible layers with content
    const visibleLayers = layers.filter(l => l.visibility && (l.asciiArt || l.imageData));
    if (visibleLayers.length === 0) return '';

    const { containerStyles, bodyStyles } = getResolutionStyles(config.resolution);

    // Generate layers HTML
    let layersHTML = '';
    visibleLayers.forEach(layer => {
        const positionClass = `position-${layer.position}`;

        if (layer.contentType === 'hiresImage' && layer.imageData) {
            // Render hi-res image layer
            layersHTML += `        <div class="image-layer ${positionClass}" data-layer-id="${layer.id}" data-parallax="${layer.parallaxStrength}" data-offset-x="${layer.offsetX}" data-offset-y="${layer.offsetY}" data-scale="${layer.scale}" style="z-index: ${layer.zIndex};">
            <img src="${layer.imageData}" style="max-width: 100%; max-height: 100%; display: block;">
        </div>\n`;
        } else if (layer.contentType === 'text' && layer.asciiArt) {
            // Render ASCII text layer
            const content = `<span style="color: ${layer.color};">${layer.asciiArt}</span>`;
            layersHTML += `        <div class="ascii-layer ${positionClass}" data-layer-id="${layer.id}" data-parallax="${layer.parallaxStrength}" data-offset-x="${layer.offsetX}" data-offset-y="${layer.offsetY}" data-scale="${layer.scale}" style="z-index: ${layer.zIndex}; font-size: ${layer.fontSize}px;">
${content}
        </div>\n`;
        } else if (layer.contentType === 'image' && layer.asciiArt) {
            // Render ASCII-converted image layer
            layersHTML += `        <div class="ascii-layer ${positionClass}" data-layer-id="${layer.id}" data-parallax="${layer.parallaxStrength}" data-offset-x="${layer.offsetX}" data-offset-y="${layer.offsetY}" data-scale="${layer.scale}" style="z-index: ${layer.zIndex}; font-size: ${layer.fontSize}px;">
${layer.asciiArt}
        </div>\n`;
        }
    });

    // Generate the complete HTML
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASCII Art</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background-color: #ffffff;
            font-family: 'Courier New', monospace;${bodyStyles}
        }
        
        .canvas-container {
            position: relative;
            background-color: #ffffff;
            overflow: hidden;${containerStyles}
        }
        
        .ascii-layer {
            position: absolute;
            line-height: 1;
            white-space: pre;
            font-family: 'Courier New', monospace;
            transition: transform 0.05s ease-out;
        }
        
        .image-layer {
            position: absolute;
            transition: transform 0.05s ease-out;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .image-layer img {
            max-width: 100%;
            max-height: 100%;
            display: block;
        }
        
        .ascii-layer.position-top-left,
        .image-layer.position-top-left {
            top: 0;
            left: 0;
        }
        
        .ascii-layer.position-top-right,
        .image-layer.position-top-right {
            top: 0;
            right: 0;
        }
        
        .ascii-layer.position-bottom-left,
        .image-layer.position-bottom-left {
            bottom: 0;
            left: 0;
        }
        
        .ascii-layer.position-bottom-right,
        .image-layer.position-bottom-right {
            bottom: 0;
            right: 0;
        }
        
        .ascii-layer.position-center,
        .image-layer.position-center {
            top: 50%;
            left: 50%;
        }
        
        /* Twinkle animation for special characters in ASCII art */
        .twinkle {
            display: inline;
            animation: twinkle 2s ease-in-out infinite;
        }
        
        @keyframes twinkle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }${config.includeGeneratorLink ? `
        
        /* Generator Link Styles */
        .generator-link {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-family: 'Courier New', monospace;
            font-size: 11px;
            color: #666;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 0, 0, 0.1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 9999;
        }
        
        .generator-link:hover {
            color: #4a9eff;
            border-color: #4a9eff;
            box-shadow: 0 4px 16px rgba(74, 158, 255, 0.3);
            transform: translateX(-50%) translateY(-2px);
        }
        
        .generator-link::before {
            content: '✨ ';
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .generator-link:hover::before {
            opacity: 1;
        }
        
        .generator-link::after {
            content: ' ✨';
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .generator-link:hover::after {
            opacity: 1;
        }` : ''}
    </style>
</head>
<body>
    <div class="canvas-container">
${layersHTML}
    </div>
    ${config.includeGeneratorLink ? '\n    <a href="https://aitechnopagan.github.io/sailormoonrpg/" class="generator-link" target="_blank">Made with ASCII Art Generator</a>\n' : ''}
    <script>
        // Parallax state
        const parallaxEnabled = ${config.parallaxEnabled};
        let mouseX = 0.5;
        let mouseY = 0.5;
        let animationFrameId = null;

        // Get all layers and their properties
        const layers = Array.from(document.querySelectorAll('.ascii-layer, .image-layer')).map(layerDiv => ({
            element: layerDiv,
            parallaxStrength: parseFloat(layerDiv.dataset.parallax),
            offsetX: parseInt(layerDiv.dataset.offsetX),
            offsetY: parseInt(layerDiv.dataset.offsetY),
            scale: parseFloat(layerDiv.dataset.scale),
            position: layerDiv.className.match(/position-([\\w-]+)/)[1]
        }));

        // Mouse movement handler
        if (parallaxEnabled) {
            document.addEventListener('mousemove', (e) => {
                const container = document.querySelector('.canvas-container');
                const rect = container.getBoundingClientRect();
                mouseX = (e.clientX - rect.left) / rect.width;
                mouseY = (e.clientY - rect.top) / rect.height;
            });
        }

        // Update layer transforms with or without parallax
        function updateLayerTransforms() {
            layers.forEach(layer => {
                const { element, parallaxStrength, offsetX, offsetY, scale, position } = layer;
                
                // Calculate transform origin
                let transformOrigin = 'center';
                switch(position) {
                    case 'top-left':
                        transformOrigin = 'top left';
                        break;
                    case 'top-right':
                        transformOrigin = 'top right';
                        break;
                    case 'bottom-left':
                        transformOrigin = 'bottom left';
                        break;
                    case 'bottom-right':
                        transformOrigin = 'bottom right';
                        break;
                    case 'center':
                        transformOrigin = 'center';
                        break;
                }
                
                element.style.transformOrigin = transformOrigin;
                
                // Apply parallax offset only if parallax is enabled
                let translateX = offsetX;
                let translateY = offsetY;
                
                if (parallaxEnabled) {
                    translateX += (mouseX - 0.5) * parallaxStrength * 100;
                    translateY += (mouseY - 0.5) * parallaxStrength * 100;
                }
                
                // Apply transform based on position
                if (position === 'center') {
                    element.style.transform = \`translate(calc(-50% + \${translateX}px), calc(-50% + \${translateY}px)) scale(\${scale})\`;
                } else {
                    element.style.transform = \`translate(\${translateX}px, \${translateY}px) scale(\${scale})\`;
                }
            });
        }

        // Animation loop
        function animate() {
            updateLayerTransforms();
            animationFrameId = requestAnimationFrame(animate);
        }

        // Start animation only if parallax is enabled, otherwise set transforms once
        if (parallaxEnabled) {
            animate();
        } else {
            updateLayerTransforms();
        }
    </script>
</body>
</html>`;

    return htmlContent;
}

export function downloadFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

