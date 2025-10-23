import { observer } from 'mobx-react-lite';
import { AsciiLayer as AsciiLayerType } from '@/types';

interface AsciiLayerProps {
    layer: AsciiLayerType;
    parallaxOffset?: { x: number; y: number };
}

export const AsciiLayer = observer(({ layer, parallaxOffset = { x: 0, y: 0 } }: AsciiLayerProps) => {
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
        transition: 'transform 0.05s ease-out',
        zIndex,
        transformOrigin,
        transform,
        fontFamily: "'Courier New', monospace",
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        whiteSpace: 'pre',
        letterSpacing: 0,
        wordSpacing: 0,
        ...(position === 'top-left' && { top: 0, left: 0 }),
        ...(position === 'top-right' && { top: 0, right: 0 }),
        ...(position === 'bottom-left' && { bottom: 0, left: 0 }),
        ...(position === 'bottom-right' && { bottom: 0, right: 0 }),
        ...(position === 'center' && { top: '50%', left: '50%' }),
    };

    return (
        <div className="ascii-layer" style={containerStyle}>
            {lattice.cells.map((row, y) => (
                <div key={y} style={{ height: `${fontSize}px`, lineHeight: 1, display: 'block' }}>
                    {row.map((cell, x) => {
                        const cellStyle: React.CSSProperties = {
                            color: cell.textColor,
                            backgroundColor: cell.bgColor,
                            opacity: cell.alpha,
                        };

                        // If cell has a className, wrap in span
                        if (cell.className || cell.bgColor !== 'transparent' || cell.textColor !== '#000000' || cell.alpha < 1) {
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

