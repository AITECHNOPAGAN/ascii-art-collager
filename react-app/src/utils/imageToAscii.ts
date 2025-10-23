// Unicode block characters for ASCII art
export const BLOCKS = [' ', '░', '▒', '▓', '█'];

export function convertImageToAscii(img: HTMLImageElement): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
        throw new Error('Could not get canvas context');
    }

    const width = 100;
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

    let asciiArt = '';
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Normalize alpha to 0-1 range
        const alpha = a / 255;

        // Only treat actually transparent pixels as invisible
        // Don't guess based on color - respect the source image's alpha channel
        const isTransparent = alpha < 0.1;

        if (isTransparent) {
            asciiArt += `<span style="opacity: 0;"> </span>`;
        } else {
            // Use perceptual brightness calculation (weighted for human vision)
            // This gives more accurate results than simple average
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b);

            // Invert the block index mapping so darker colors get darker blocks
            const blockIndex = BLOCKS.length - 1 - Math.floor((brightness / 255) * (BLOCKS.length - 1));
            const block = BLOCKS[blockIndex];

            // Use rgba with actual alpha value for proper transparency handling
            const color = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            asciiArt += `<span style="color: ${color};">${block}</span>`;
        }

        if ((Math.floor(i / 4) + 1) % width === 0) {
            asciiArt += '\n';
        }
    }

    return asciiArt;
}

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

