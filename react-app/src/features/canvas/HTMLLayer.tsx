import { observer } from 'mobx-react-lite';
import { HtmlLayer as HtmlLayerType } from '@/types';
import { useEffect, useRef } from 'react';

interface HTMLLayerProps {
    layer: HtmlLayerType;
    parallaxOffset?: { x: number; y: number };
    disablePointerEvents?: boolean; // Not used - HTML layers always receive events
}

export const HTMLLayer = observer(({ layer, parallaxOffset = { x: 0, y: 0 } }: HTMLLayerProps) => {
    const { position, offsetX, offsetY, scale, zIndex, htmlContent, width, height, overflow } = layer;
    const iframeRef = useRef<HTMLIFrameElement>(null);

    if (!htmlContent) return null;

    // Update iframe content when htmlContent changes
    useEffect(() => {
        if (iframeRef.current) {
            const iframeDoc = iframeRef.current.contentDocument;
            if (iframeDoc) {
                iframeDoc.open();
                iframeDoc.write(htmlContent);
                iframeDoc.close();
            }
        }
    }, [htmlContent]);

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

    // Determine overflow styles
    let overflowX: React.CSSProperties['overflowX'] = 'visible';
    let overflowY: React.CSSProperties['overflowY'] = 'visible';

    switch (overflow) {
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

    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        zIndex,
        transformOrigin,
        transform,
        width: width === 'auto' ? '100%' : `${width}px`, // Use 100% for auto to fill canvas
        height: height === 'auto' ? '100%' : `${height}px`, // Use 100% for auto to fill canvas
        overflowX,
        overflowY,
        pointerEvents: 'auto', // HTML layers always receive pointer events
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

    const iframeStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        border: 'none',
        display: 'block',
    };

    return (
        <div
            className="html-layer"
            style={containerStyle}
            data-parallax={layer.parallaxStrength}
            data-offset-x={offsetX}
            data-offset-y={offsetY}
            data-scale={scale}
            data-position={position}
        >
            <iframe
                ref={iframeRef}
                style={iframeStyle}
                title={`HTML Layer ${layer.id}`}
                sandbox="allow-scripts allow-same-origin"
            />
        </div>
    );
});

