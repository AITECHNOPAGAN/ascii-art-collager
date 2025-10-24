import { observer } from 'mobx-react-lite';
import { AsciiLayer as AsciiLayerType } from '@/types';

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

interface AsciiLayerProps {
    layer: AsciiLayerType;
    parallaxOffset?: { x: number; y: number };
    disablePointerEvents?: boolean;
}

export const AsciiLayer = observer(({ layer, parallaxOffset = { x: 0, y: 0 }, disablePointerEvents = false }: AsciiLayerProps) => {
    const { position, offsetX, offsetY, scale, fontSize, zIndex, lattice } = layer;

    if (!lattice || lattice.cells.length === 0) return null;

    let transformOrigin = 'center';
    switch (position) {
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
    }

    const translateX = offsetX + parallaxOffset.x;
    const translateY = offsetY + parallaxOffset.y;

    let transform = '';
    if (position === 'center') {
        transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})`;
    } else {
        transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        zIndex,
        transformOrigin,
        transform,
        fontFamily: "'Courier New', monospace",
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        whiteSpace: 'pre',
        letterSpacing: 0,
        wordSpacing: 0,
        pointerEvents: disablePointerEvents ? 'none' : 'auto',
        ...(position === 'top-left' && { top: 0, left: 0 }),
        ...(position === 'top-right' && { top: 0, right: 0 }),
        ...(position === 'bottom-left' && { bottom: 0, left: 0 }),
        ...(position === 'bottom-right' && { bottom: 0, right: 0 }),
        ...(position === 'center' && { top: '50%', left: '50%' }),
    };

    return (
        <div
            className="ascii-layer"
            style={containerStyle}
            data-parallax={layer.parallaxStrength}
            data-offset-x={offsetX}
            data-offset-y={offsetY}
            data-scale={scale}
            data-position={position}
        >
            {lattice.cells.map((row, y) => (
                <div key={y} style={{ height: `${fontSize}px`, lineHeight: 1, display: 'block' }}>
                    {row.map((cell, x) => {
                        // Apply tint color to non-empty cells
                        const isEmptyCell = cell.char === ' ' || cell.char === '' || cell.alpha === 0;
                        const textColor = (!isEmptyCell && layer.tintColor)
                            ? applyTintColor(cell.textColor, layer.tintColor)
                            : cell.textColor;

                        const cellStyle: React.CSSProperties = {
                            color: textColor,
                            backgroundColor: cell.bgColor,
                            opacity: cell.alpha,
                        };

                        // If cell has a className, wrap in span
                        if (cell.className || cell.bgColor !== 'transparent' || textColor !== '#000000' || cell.alpha < 1) {
                            return (
                                <span
                                    key={x}
                                    style={cellStyle}
                                    className={cell.className}
                                >
                                    {cell.char}
                                </span>
                            );
                        }

                        // Otherwise just output the character directly
                        return cell.char;
                    })}
                </div>
            ))}
        </div>
    );
});

