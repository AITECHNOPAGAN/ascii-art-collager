import { Layer, ExportConfig, ResolutionStyles, AsciiLayer, ImageLayer, HtmlLayer, CustomResolution } from '@/types';

export function getResolutionStyles(resolution: string, customResolution?: CustomResolution): ResolutionStyles {
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
        case 'custom':
            if (customResolution) {
                containerStyles = `
            width: ${customResolution.width}px;
            height: ${customResolution.height}px;
            max-width: 90vw;
            max-height: 90vh;
            border: 2px solid #000000;`;
                bodyStyles = `
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f0f0f0;`;
            } else {
                // Fallback to responsive if no custom resolution provided
                containerStyles = `
            width: 100%;
            height: 100%;`;
                bodyStyles = `
            width: 100vw;
            height: 100vh;
            overflow: hidden;`;
            }
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

function exportAsciiLayer(layer: AsciiLayer): string {
    // Export lattice as grid of styled characters
    let content = '';
    const { lattice, fontSize, tintColor } = layer;

    if (!lattice || lattice.cells.length === 0) return '';

    // Helper function to apply tint color
    const applyTintColor = (originalColor: string, tintColor: string): string => {
        // For black or near-black colors (#000000 or very dark), just use the tint directly
        // Otherwise use multiply blend
        const parseColor = (color: string): [number, number, number] => {
            const hex = color.replace('#', '');
            return [
                parseInt(hex.substr(0, 2), 16),
                parseInt(hex.substr(2, 2), 16),
                parseInt(hex.substr(4, 2), 16)
            ];
        };

        const toHex = (r: number, g: number, b: number): string => {
            return '#' + [r, g, b].map(x => {
                const hex = Math.round(x).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        };

        try {
            const [r1, g1, b1] = parseColor(originalColor);

            // If original color is black or very dark (sum of RGB < 30), just use tint color
            if (r1 + g1 + b1 < 30) {
                return tintColor;
            }

            // Otherwise use multiply blend for colored ASCII art
            const [r2, g2, b2] = parseColor(tintColor);
            const r = (r1 * r2) / 255;
            const g = (g1 * g2) / 255;
            const b = (b1 * b2) / 255;

            return toHex(r, g, b);
        } catch (e) {
            return originalColor;
        }
    };

    // Generate grid structure with inline styles for each cell
    for (let y = 0; y < lattice.height; y++) {
        for (let x = 0; x < lattice.width; x++) {
            const cell = lattice.cells[y][x];

            // Apply tint color to non-empty cells
            const isEmptyCell = cell.char === ' ' || cell.char === '' || cell.alpha === 0;
            const textColor = (!isEmptyCell && tintColor)
                ? applyTintColor(cell.textColor, tintColor)
                : cell.textColor;

            const bgStyle = cell.bgColor !== 'transparent' ? `background-color: ${cell.bgColor};` : '';
            const style = `color: ${textColor}; ${bgStyle} opacity: ${cell.alpha};`;
            content += `<span style="${style}">${cell.char}</span>`;
        }
        content += '\n';
    }

    const positionClass = `position-${layer.position}`;
    return `        <div class="ascii-layer ${positionClass}" data-layer-id="${layer.id}" data-parallax="${layer.parallaxStrength}" data-offset-x="${layer.offsetX}" data-offset-y="${layer.offsetY}" data-scale="${layer.scale}" style="z-index: ${layer.zIndex}; font-size: ${fontSize}px; pointer-events: ${layer.enablePointerEvents ? 'auto' : 'none'};">
${content}
        </div>\n`;
}

function exportImageLayer(layer: ImageLayer): string {
    const displayImage = layer.editedPixels || layer.imageData;
    if (!displayImage) return '';

    const positionClass = `position-${layer.position}`;
    const tintOverlay = (layer.tintColor && layer.tintColor !== '#ffffff')
        ? `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: ${layer.tintColor}; mix-blend-mode: multiply; pointer-events: none;"></div>`
        : '';

    return `        <div class="image-layer ${positionClass}" data-layer-id="${layer.id}" data-parallax="${layer.parallaxStrength}" data-offset-x="${layer.offsetX}" data-offset-y="${layer.offsetY}" data-scale="${layer.scale}" style="z-index: ${layer.zIndex}; pointer-events: ${layer.enablePointerEvents ? 'auto' : 'none'};">
            <img src="${displayImage}" style="max-width: 100%; max-height: 100%; display: block;">
            ${tintOverlay}
        </div>\n`;
}

function exportHtmlLayer(layer: HtmlLayer): string {
    if (!layer.htmlContent) return '';

    const positionClass = `position-${layer.position}`;

    // Determine overflow styles
    let overflowX = 'visible';
    let overflowY = 'visible';

    switch (layer.overflow) {
        case 'scroll':
            overflowX = 'auto';
            overflowY = 'auto';
            break;
        case 'scroll-x':
            overflowX = 'auto';
            overflowY = 'visible';
            break;
        case 'scroll-y':
            overflowX = 'visible';
            overflowY = 'auto';
            break;
        case 'visible':
        default:
            overflowX = 'visible';
            overflowY = 'visible';
            break;
    }

    const width = layer.width === 'auto' ? '100%' : `${layer.width}px`;
    const height = layer.height === 'auto' ? '100%' : `${layer.height}px`;

    // For exported HTML, we need to embed the content in a way that supports localStorage
    // We'll use srcdoc which has better storage support than data: URLs
    // Need to escape the HTML content for use in srcdoc attribute
    const escapedHtml = layer.htmlContent
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return `        <div class="html-layer ${positionClass}" data-layer-id="${layer.id}" data-parallax="${layer.parallaxStrength}" data-offset-x="${layer.offsetX}" data-offset-y="${layer.offsetY}" data-scale="${layer.scale}" style="z-index: ${layer.zIndex}; width: ${width}; height: ${height}; overflow-x: ${overflowX}; overflow-y: ${overflowY}; pointer-events: auto;">
            <iframe style="width: 100%; height: 100%; border: none; display: block;" srcdoc="${escapedHtml}" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"></iframe>
        </div>\n`;
}

export function generateExportHTML(
    layers: Layer[],
    config: ExportConfig
): string {
    // Filter visible layers with content
    const visibleLayers = layers.filter(l => {
        if (!l.visibility) return false;
        if (l.type === 'ascii') {
            return l.lattice && l.lattice.cells.length > 0;
        } else if (l.type === 'image') {
            return l.imageData !== '';
        } else if (l.type === 'html') {
            return l.htmlContent !== '';
        }
        return false;
    });

    if (visibleLayers.length === 0) return '';

    const { containerStyles, bodyStyles } = getResolutionStyles(config.resolution, config.customResolution);
    const bgColor = config.backgroundColor || '#ffffff';

    // Generate layers HTML
    let layersHTML = '';
    visibleLayers.forEach(layer => {
        if (layer.type === 'ascii') {
            layersHTML += exportAsciiLayer(layer);
        } else if (layer.type === 'image') {
            layersHTML += exportImageLayer(layer);
        } else if (layer.type === 'html') {
            layersHTML += exportHtmlLayer(layer);
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
            background-color: ${bgColor};
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
        
        .html-layer {
            position: absolute;
            transition: transform 0.05s ease-out;
        }
        
        .ascii-layer.position-top-left,
        .image-layer.position-top-left,
        .html-layer.position-top-left {
            top: 0;
            left: 0;
        }
        
        .ascii-layer.position-top-center,
        .image-layer.position-top-center,
        .html-layer.position-top-center {
            top: 0;
            left: 50%;
        }
        
        .ascii-layer.position-top-right,
        .image-layer.position-top-right,
        .html-layer.position-top-right {
            top: 0;
            right: 0;
        }
        
        .ascii-layer.position-center-left,
        .image-layer.position-center-left,
        .html-layer.position-center-left {
            top: 50%;
            left: 0;
        }
        
        .ascii-layer.position-center-right,
        .image-layer.position-center-right,
        .html-layer.position-center-right {
            top: 50%;
            right: 0;
        }
        
        .ascii-layer.position-bottom-left,
        .image-layer.position-bottom-left,
        .html-layer.position-bottom-left {
            bottom: 0;
            left: 0;
        }
        
        .ascii-layer.position-bottom-center,
        .image-layer.position-bottom-center,
        .html-layer.position-bottom-center {
            bottom: 0;
            left: 50%;
        }
        
        .ascii-layer.position-bottom-right,
        .image-layer.position-bottom-right,
        .html-layer.position-bottom-right {
            bottom: 0;
            right: 0;
        }
        
        .ascii-layer.position-center,
        .image-layer.position-center,
        .html-layer.position-center {
            top: 50%;
            left: 50%;
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
        const layers = Array.from(document.querySelectorAll('.ascii-layer, .image-layer, .html-layer')).map(layerDiv => ({
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
                    case 'top-center':
                        transformOrigin = 'top center';
                        break;
                    case 'top-right':
                        transformOrigin = 'top right';
                        break;
                    case 'center-left':
                        transformOrigin = 'center left';
                        break;
                    case 'center-right':
                        transformOrigin = 'center right';
                        break;
                    case 'bottom-left':
                        transformOrigin = 'bottom left';
                        break;
                    case 'bottom-center':
                        transformOrigin = 'bottom center';
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
                } else if (position === 'top-center') {
                    element.style.transform = \`translate(calc(-50% + \${translateX}px), \${translateY}px) scale(\${scale})\`;
                } else if (position === 'bottom-center') {
                    element.style.transform = \`translate(calc(-50% + \${translateX}px), \${translateY}px) scale(\${scale})\`;
                } else if (position === 'center-left') {
                    element.style.transform = \`translate(\${translateX}px, calc(-50% + \${translateY}px)) scale(\${scale})\`;
                } else if (position === 'center-right') {
                    element.style.transform = \`translate(\${translateX}px, calc(-50% + \${translateY}px)) scale(\${scale})\`;
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
