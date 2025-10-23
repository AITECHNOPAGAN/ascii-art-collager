import { observer } from 'mobx-react-lite';
import { Layer } from '@/types';

interface ImageLayerProps {
    layer: Layer;
    parallaxOffset?: { x: number; y: number };
}

export const ImageLayer = observer(({ layer, parallaxOffset = { x: 0, y: 0 } }: ImageLayerProps) => {
    const { position, offsetX, offsetY, scale, zIndex, imageData } = layer;

    if (!imageData) return null;

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
        transition: 'transform 0.05s ease-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex,
        transformOrigin,
        transform,
        ...(position === 'top-left' && { top: 0, left: 0 }),
        ...(position === 'top-right' && { top: 0, right: 0 }),
        ...(position === 'bottom-left' && { bottom: 0, left: 0 }),
        ...(position === 'bottom-right' && { bottom: 0, right: 0 }),
        ...(position === 'center' && { top: '50%', left: '50%' }),
    };

    return (
        <div className="image-layer" style={style}>
            <img
                src={imageData}
                style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }}
                alt="Layer content"
            />
        </div>
    );
});

