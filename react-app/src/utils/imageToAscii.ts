import { AsciiLattice, CharacterCell } from '@/types';

// Unicode block characters for ASCII art
export const BLOCKS = [' ', '░', '▒', '▓', '█'];

// Convert RGB to hex color
function rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

// Convert image to ASCII lattice structure
export function convertImageToAscii(img: HTMLImageElement, resolution: number = 100): AsciiLattice {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
        throw new Error('Could not get canvas context');
    }

    const width = resolution;
    const height = Math.floor((img.height / img.width) * width * 0.55);

    canvas.width = width;
    canvas.height = height;

    // Fill canvas with white background to ensure proper color rendering
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Draw image with proper alpha handling
    ctx.drawImage(img, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Create 2D array for cells
    const cells: CharacterCell[][] = [];

    for (let y = 0; y < height; y++) {
        cells[y] = [];
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // Normalize alpha to 0-1 range
            const alpha = a / 255;

            // Only treat actually transparent pixels as invisible
            const isTransparent = alpha < 0.1;

            if (isTransparent) {
                cells[y][x] = {
                    char: ' ',
                    textColor: '#000000',
                    bgColor: 'transparent',
                    alpha: 0
                };
            } else {
                // Use perceptual brightness calculation (weighted for human vision)
                const brightness = (0.299 * r + 0.587 * g + 0.114 * b);

                // Invert the block index mapping so darker colors get darker blocks
                const blockIndex = BLOCKS.length - 1 - Math.floor((brightness / 255) * (BLOCKS.length - 1));
                const char = BLOCKS[blockIndex];

                cells[y][x] = {
                    char,
                    textColor: rgbToHex(r, g, b),
                    bgColor: 'transparent',
                    alpha
                };
            }
        }
    }

    return {
        width,
        height,
        cells
    };
}

// Legacy function for backward compatibility - converts lattice to HTML string
export function latticeToHtml(lattice: AsciiLattice): string {
    let html = '';
    for (let y = 0; y < lattice.height; y++) {
        for (let x = 0; x < lattice.width; x++) {
            const cell = lattice.cells[y][x];
            const color = cell.alpha < 0.1
                ? 'transparent'
                : `${cell.textColor}`;
            const style = cell.alpha < 1
                ? `color: ${color}; opacity: ${cell.alpha};`
                : `color: ${color};`;
            html += `<span style="${style}">${cell.char}</span>`;
        }
        html += '\n';
    }
    return html;
}

// Convert lattice to HTML with class names preserved
export function latticeToHtmlWithClasses(lattice: AsciiLattice): string {
    let html = '';
    for (let y = 0; y < lattice.height; y++) {
        for (let x = 0; x < lattice.width; x++) {
            const cell = lattice.cells[y][x];

            // Skip plain spaces without styling
            if (cell.char === ' ' && !cell.className && cell.alpha >= 0.99 && cell.textColor === '#000000') {
                html += cell.char;
                continue;
            }

            // Build attributes
            const attrs: string[] = [];

            if (cell.className) {
                attrs.push(`class="${cell.className}"`);
            }

            // Build style string
            const styles: string[] = [];
            if (cell.textColor !== '#000000') {
                styles.push(`color: ${cell.textColor}`);
            }
            if (cell.bgColor && cell.bgColor !== 'transparent') {
                styles.push(`background-color: ${cell.bgColor}`);
            }
            if (cell.alpha < 1) {
                styles.push(`opacity: ${cell.alpha}`);
            }

            if (styles.length > 0) {
                attrs.push(`style="${styles.join('; ')}"`);
            }

            if (attrs.length > 0) {
                html += `<span ${attrs.join(' ')}>${cell.char}</span>`;
            } else {
                html += cell.char;
            }
        }
        html += '\n';
    }
    return html;
}

// Load image from file and return HTMLImageElement
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// Get data URL from file
export function getImageDataFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve(e.target?.result as string);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// Parse colored ASCII art from text (supports HTML spans with inline styles and classes)
export function parseColoredAscii(text: string): AsciiLattice {
    // Split into lines
    const lines = text.split('\n');
    const height = lines.length;
    const width = Math.max(...lines.map(line => {
        // Strip HTML tags to get actual character count
        return line.replace(/<[^>]*>/g, '').length;
    }));

    const cells: CharacterCell[][] = [];

    for (let y = 0; y < height; y++) {
        cells[y] = [];
        const line = lines[y];

        // Parse HTML spans with optional class and/or style attributes
        const spanRegex = /<span(?:\s+class="([^"]*)")?(?:\s+style="([^"]*)")?>([^<]*)<\/span>/g;
        let match;
        let x = 0;
        let lastIndex = 0;

        while ((match = spanRegex.exec(line)) !== null) {
            // Add any plain text before the span
            const plainText = line.substring(lastIndex, match.index);
            for (const char of plainText) {
                if (x < width) {
                    cells[y][x++] = {
                        char,
                        textColor: '#000000',
                        bgColor: 'transparent',
                        alpha: 1
                    };
                }
            }

            // Parse the span attributes
            const className = match[1] || undefined; // class attribute (optional)
            const styles = match[2] || ''; // style attribute (optional)
            const char = match[3]; // character content

            // Extract color and opacity from styles if present
            let textColor = '#000000';
            let alpha = 1;

            if (styles) {
                const colorMatch = styles.match(/color:\s*([^;]+)/);
                if (colorMatch) {
                    textColor = colorMatch[1].trim();
                }

                const opacityMatch = styles.match(/opacity:\s*([^;]+)/);
                if (opacityMatch) {
                    alpha = parseFloat(opacityMatch[1]);
                }
            }

            if (x < width) {
                cells[y][x++] = {
                    char,
                    textColor,
                    bgColor: 'transparent',
                    alpha,
                    className
                };
            }

            lastIndex = match.index + match[0].length;
        }

        // Add any remaining plain text
        const remainingText = line.substring(lastIndex);
        for (const char of remainingText) {
            if (x < width) {
                cells[y][x++] = {
                    char,
                    textColor: '#000000',
                    bgColor: 'transparent',
                    alpha: 1
                };
            }
        }

        // Pad the row with spaces if needed
        while (x < width) {
            cells[y][x++] = {
                char: ' ',
                textColor: '#000000',
                bgColor: 'transparent',
                alpha: 1
            };
        }
    }

    return {
        width,
        height,
        cells
    };
}

