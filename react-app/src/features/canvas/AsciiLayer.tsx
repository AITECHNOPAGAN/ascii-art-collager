import { observer } from 'mobx-react-lite';
import { Layer } from '@/types';

interface AsciiLayerProps {
    layer: Layer;
    parallaxOffset?: { x: number; y: number };
}

export const AsciiLayer = observer(({ layer, parallaxOffset = { x: 0, y: 0 } }: AsciiLayerProps) => {
    const { position, offsetX, offsetY, scale, fontSize, zIndex, contentType, asciiArt, color } = layer;

    if (!asciiArt) return null;

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

    const style: React.CSSProperties = {
        position: 'absolute',
        lineHeight: 1,
        whiteSpace: 'pre',
        fontFamily: "'Courier New', monospace",
        transition: 'transform 0.05s ease-out',
        fontSize: `${fontSize}px`,
        zIndex,
        transformOrigin,
        transform,
        ...(position === 'top-left' && { top: 0, left: 0 }),
        ...(position === 'top-right' && { top: 0, right: 0 }),
        ...(position === 'bottom-left' && { bottom: 0, left: 0 }),
        ...(position === 'bottom-right' && { bottom: 0, right: 0 }),
        ...(position === 'center' && { top: '50%', left: '50%' }),
    };

    // For text content, wrap in a span with color
    const content = contentType === 'text'
        ? `<span style="color: ${color};">${asciiArt}</span>`
        : asciiArt;

    return (
        <div
            className="ascii-layer"
            style={style}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
});

