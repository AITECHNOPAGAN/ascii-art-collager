import { observer } from 'mobx-react-lite';
import { ImageLayer as ImageLayerType } from '@/types';

interface ImageLayerProps {
    layer: ImageLayerType;
    parallaxOffset?: { x: number; y: number };
    disablePointerEvents?: boolean;
}

export const ImageLayer = observer(({ layer, parallaxOffset = { x: 0, y: 0 }, disablePointerEvents = false }: ImageLayerProps) => {
    const { position, offsetX, offsetY, scale, zIndex, imageData, editedPixels, tintColor } = layer;

    // Use edited pixels if available, otherwise use original image
    const displayImage = editedPixels || imageData;

    if (!displayImage) return null;

    let transformOrigin = 'center';
    switch (position) {
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
    }

    const translateX = offsetX + parallaxOffset.x;
    const translateY = offsetY + parallaxOffset.y;

    let transform = '';
    if (position === 'center') {
        transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})`;
    } else if (position === 'top-center') {
        transform = `translate(calc(-50% + ${translateX}px), ${translateY}px) scale(${scale})`;
    } else if (position === 'bottom-center') {
        transform = `translate(calc(-50% + ${translateX}px), ${translateY}px) scale(${scale})`;
    } else if (position === 'center-left') {
        transform = `translate(${translateX}px, calc(-50% + ${translateY}px)) scale(${scale})`;
    } else if (position === 'center-right') {
        transform = `translate(${translateX}px, calc(-50% + ${translateY}px)) scale(${scale})`;
    } else {
        transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    const style: React.CSSProperties = {
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex,
        transformOrigin,
        transform,
        pointerEvents: disablePointerEvents ? 'none' : (layer.enablePointerEvents ? 'auto' : 'none'),
        ...(position === 'top-left' && { top: 0, left: 0 }),
        ...(position === 'top-center' && { top: 0, left: '50%' }),
        ...(position === 'top-right' && { top: 0, right: 0 }),
        ...(position === 'center-left' && { top: '50%', left: 0 }),
        ...(position === 'center-right' && { top: '50%', right: 0 }),
        ...(position === 'bottom-left' && { bottom: 0, left: 0 }),
        ...(position === 'bottom-center' && { bottom: 0, left: '50%' }),
        ...(position === 'bottom-right' && { bottom: 0, right: 0 }),
        ...(position === 'center' && { top: '50%', left: '50%' }),
    };

    // Apply tint using CSS filter if tintColor is set
    const imgStyle: React.CSSProperties = {
        display: 'block',
        width: 'auto',
        height: 'auto',
        maxWidth: 'none',
        maxHeight: 'none',
    };

    return (
        <div
            className="image-layer"
            style={style}
            data-parallax={layer.parallaxStrength}
            data-offset-x={offsetX}
            data-offset-y={offsetY}
            data-scale={scale}
            data-position={position}
        >
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

