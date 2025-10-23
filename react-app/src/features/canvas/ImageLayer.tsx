import { observer } from 'mobx-react-lite';
import { ImageLayer as ImageLayerType } from '@/types';

interface ImageLayerProps {
    layer: ImageLayerType;
    parallaxOffset?: { x: number; y: number };
}

export const ImageLayer = observer(({ layer, parallaxOffset = { x: 0, y: 0 } }: ImageLayerProps) => {
    const { position, offsetX, offsetY, scale, zIndex, imageData, editedPixels, tintColor } = layer;

    // Use edited pixels if available, otherwise use original image
    const displayImage = editedPixels || imageData;

    if (!displayImage) return null;

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

    // Apply tint using CSS filter if tintColor is set
    const imgStyle: React.CSSProperties = {
        maxWidth: '100%',
        maxHeight: '100%',
        display: 'block',
    };

    return (
        <div className="image-layer" style={style}>
            <img
                src={displayImage}
                style={imgStyle}
                alt="Layer content"
            />
            {tintColor && tintColor !== '#ffffff' && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: tintColor,
                        mixBlendMode: 'multiply',
                        pointerEvents: 'none',
                    }}
                />
            )}
        </div>
    );
});

