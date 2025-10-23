import { observer } from 'mobx-react-lite';
import { useRef, useState, useEffect } from 'react';
import { ImageLayer as ImageLayerType } from '@/types';
import { useEditingStore, useLayerStore } from '@/stores';
import { ImageLayer } from './ImageLayer';

interface EditableImageLayerProps {
    layer: ImageLayerType;
    parallaxOffset?: { x: number; y: number };
}

export const EditableImageLayer = observer(({ layer, parallaxOffset = { x: 0, y: 0 } }: EditableImageLayerProps) => {
    const editingStore = useEditingStore();
    const layerStore = useLayerStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);

    const { activeTool, brushSettings } = editingStore;
    const isActive = layerStore.activeLayerId === layer.id;

    const displayImage = layer.editedPixels || layer.imageData;

    // Load image to canvas
    useEffect(() => {
        if (!canvasRef.current || !displayImage) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            setImageLoaded(true);
        };
        img.src = displayImage;
    }, [displayImage]);

    // Convert mouse coordinates to canvas pixel coordinates
    const getCanvasCoords = (e: React.MouseEvent): { x: number, y: number } | null => {
        if (!canvasRef.current || !containerRef.current) return null;

        const canvas = canvasRef.current;
        const containerRect = containerRef.current.getBoundingClientRect();

        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;

        // Account for canvas scaling relative to container
        const scaleX = canvas.width / containerRect.width;
        const scaleY = canvas.height / containerRect.height;

        const canvasX = Math.floor(mouseX * scaleX);
        const canvasY = Math.floor(mouseY * scaleY);

        if (canvasX < 0 || canvasX >= canvas.width || canvasY < 0 || canvasY >= canvas.height) {
            return null;
        }

        return { x: canvasX, y: canvasY };
    };

    // Apply brush effect to canvas
    const applyBrush = (canvasX: number, canvasY: number) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const radius = brushSettings.radius;

        ctx.beginPath();
        ctx.arc(canvasX, canvasY, radius, 0, Math.PI * 2);

        if (activeTool === 'erase') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        } else if (activeTool === 'paint-color') {
            // Convert hex to rgba
            const color = brushSettings.currentTextColor;
            const alpha = brushSettings.currentAlpha;

            // Parse hex color
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.fill();
        } else if (activeTool === 'paint-alpha') {
            // Adjust alpha of existing pixels in brush area
            const imageData = ctx.getImageData(
                canvasX - radius,
                canvasY - radius,
                radius * 2,
                radius * 2
            );

            const data = imageData.data;
            for (let y = 0; y < radius * 2; y++) {
                for (let x = 0; x < radius * 2; x++) {
                    const dx = x - radius;
                    const dy = y - radius;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance <= radius) {
                        const i = (y * radius * 2 + x) * 4;
                        if (data[i + 3] > 0) { // Only modify non-transparent pixels
                            data[i + 3] = Math.floor(brushSettings.currentAlpha * 255);
                        }
                    }
                }
            }

            ctx.putImageData(imageData, canvasX - radius, canvasY - radius);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isActive || activeTool === 'select' || !imageLoaded) return;

        const coords = getCanvasCoords(e);
        if (!coords) return;

        if (activeTool === 'color-picker') {
            // Pick color from pixel
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const imageData = ctx.getImageData(coords.x, coords.y, 1, 1);
            const data = imageData.data;

            const r = data[0];
            const g = data[1];
            const b = data[2];
            const a = data[3] / 255;

            const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            editingStore.setCurrentTextColor(hexColor);
            editingStore.setCurrentAlpha(a);
        } else {
            setIsDrawing(true);
            applyBrush(coords.x, coords.y);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const coords = getCanvasCoords(e);
        setCursorPos(coords);

        if (!isActive || !isDrawing || activeTool === 'select' || activeTool === 'color-picker') return;

        if (coords) {
            applyBrush(coords.x, coords.y);
        }
    };

    const handleMouseUp = () => {
        if (isDrawing && canvasRef.current) {
            setIsDrawing(false);

            // Save edited canvas to layer
            const dataURL = canvasRef.current.toDataURL('image/png');
            layerStore.setEditedPixels(layer.id, dataURL);
            layerStore.saveCurrentLayer();
        }
    };

    const handleMouseLeave = () => {
        setCursorPos(null);
        if (isDrawing && canvasRef.current) {
            setIsDrawing(false);

            const dataURL = canvasRef.current.toDataURL('image/png');
            layerStore.setEditedPixels(layer.id, dataURL);
            layerStore.saveCurrentLayer();
        }
    };

    // Render cursor preview
    const renderCursorPreview = () => {
        if (!cursorPos || !isActive || activeTool === 'select' || !containerRef.current || !canvasRef.current) return null;

        const containerRect = containerRef.current.getBoundingClientRect();
        const canvas = canvasRef.current;

        const scaleX = containerRect.width / canvas.width;
        const scaleY = containerRect.height / canvas.height;

        const radius = brushSettings.radius;
        const scaledRadius = radius * scaleX;

        const cursorStyle: React.CSSProperties = {
            position: 'absolute',
            left: (cursorPos.x * scaleX) - scaledRadius,
            top: (cursorPos.y * scaleY) - scaledRadius,
            width: scaledRadius * 2,
            height: scaledRadius * 2,
            border: '2px solid #4a9eff',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 1000,
        };

        if (activeTool === 'erase') {
            cursorStyle.backgroundColor = 'rgba(255, 0, 0, 0.2)';
        } else if (activeTool === 'paint-color') {
            cursorStyle.backgroundColor = brushSettings.currentTextColor + '40';
        } else if (activeTool === 'paint-alpha') {
            cursorStyle.backgroundColor = 'rgba(74, 158, 255, 0.2)';
        } else if (activeTool === 'color-picker') {
            cursorStyle.width = 10;
            cursorStyle.height = 10;
            cursorStyle.left = (cursorPos.x * scaleX) - 5;
            cursorStyle.top = (cursorPos.y * scaleY) - 5;
            cursorStyle.backgroundColor = 'rgba(255, 255, 0, 0.5)';
        }

        return <div style={cursorStyle} />;
    };

    const isInteractive = isActive && activeTool !== 'select';

    const { position, offsetX, offsetY, scale, zIndex } = layer;

    let transformOrigin = 'center';
    switch (position) {
        case 'top-left': transformOrigin = 'top left'; break;
        case 'top-right': transformOrigin = 'top right'; break;
        case 'bottom-left': transformOrigin = 'bottom left'; break;
        case 'bottom-right': transformOrigin = 'bottom right'; break;
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex,
        transformOrigin,
        transform,
        cursor: isInteractive ? 'none' : 'default',
        ...(position === 'top-left' && { top: 0, left: 0 }),
        ...(position === 'top-right' && { top: 0, right: 0 }),
        ...(position === 'bottom-left' && { bottom: 0, left: 0 }),
        ...(position === 'bottom-right' && { bottom: 0, right: 0 }),
        ...(position === 'center' && { top: '50%', left: '50%' }),
    };

    if (!displayImage) return null;

    // If we have editing capabilities, render canvas overlay
    if (isActive && activeTool !== 'select') {
        return (
            <div
                ref={containerRef}
                className="image-layer"
                style={containerStyle}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                <canvas
                    ref={canvasRef}
                    style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }}
                />
                {layer.tintColor && layer.tintColor !== '#ffffff' && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: layer.tintColor,
                            mixBlendMode: 'multiply',
                            pointerEvents: 'none',
                        }}
                    />
                )}
                {renderCursorPreview()}
            </div>
        );
    }

    // Otherwise, render regular ImageLayer
    return <ImageLayer layer={layer} parallaxOffset={parallaxOffset} />;
});

