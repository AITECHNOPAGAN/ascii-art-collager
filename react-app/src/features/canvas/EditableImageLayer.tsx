import { observer } from 'mobx-react-lite';
import { useRef, useState, useEffect, useCallback } from 'react';
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
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number, y: number, offsetX: number, offsetY: number } | null>(null);
    const [isScaling, setIsScaling] = useState(false);
    const [scaleHandle, setScaleHandle] = useState<string | null>(null);
    const [scaleStart, setScaleStart] = useState<{ x: number, y: number, scale: number } | null>(null);

    const { activeTool, brushSettings } = editingStore;
    const isActive = layerStore.activeLayerId === layer.id;

    const displayImage = layer.editedPixels || layer.imageData;

    // Handle window mouse events for scaling (to prevent losing the handle on fast drags)
    const handleWindowMouseMove = useCallback((e: MouseEvent) => {
        if (!isScaling || !scaleStart || !scaleHandle) return;

        const deltaX = e.clientX - scaleStart.x;
        const deltaY = e.clientY - scaleStart.y;

        let scaleFactorX = 1;
        let scaleFactorY = 1;

        // Calculate scale factor based on handle position and direction
        // Dragging away from center = increase scale, toward center = decrease scale
        if (scaleHandle.includes('e')) {
            scaleFactorX = 1 + (deltaX / 200);
        } else if (scaleHandle.includes('w')) {
            scaleFactorX = 1 + (-deltaX / 200);
        }

        if (scaleHandle.includes('s')) {
            scaleFactorY = 1 + (deltaY / 200);
        } else if (scaleHandle.includes('n')) {
            scaleFactorY = 1 + (-deltaY / 200);
        }

        // For corner handles, use average of both factors; for side handles, use the relevant one
        let scaleFactor = 1;
        if (scaleHandle.length === 2) {
            // Corner handle - average both directions
            scaleFactor = (scaleFactorX + scaleFactorY) / 2;
        } else {
            // Side handle - use the relevant direction
            scaleFactor = scaleHandle.includes('e') || scaleHandle.includes('w') ? scaleFactorX : scaleFactorY;
        }

        const newScale = Math.max(0.1, Math.min(5, scaleStart.scale * scaleFactor));
        layerStore.setScale(newScale);
    }, [isScaling, scaleStart, scaleHandle, layerStore]);

    const handleWindowMouseUp = useCallback(() => {
        if (isScaling && activeTool === 'scale') {
            setIsScaling(false);
            setScaleHandle(null);
            setScaleStart(null);
            layerStore.saveCurrentLayer();
        }
    }, [isScaling, activeTool, layerStore]);

    // Attach/detach window event listeners for scaling
    useEffect(() => {
        if (isScaling) {
            window.addEventListener('mousemove', handleWindowMouseMove);
            window.addEventListener('mouseup', handleWindowMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleWindowMouseMove);
                window.removeEventListener('mouseup', handleWindowMouseUp);
            };
        }
    }, [isScaling, handleWindowMouseMove, handleWindowMouseUp]);

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
        const canvasRect = canvasRef.current.getBoundingClientRect();

        // Mouse position relative to the canvas element (which is inside the scaled container)
        const mouseX = e.clientX - canvasRect.left;
        const mouseY = e.clientY - canvasRect.top;

        // canvasRect gives us the actual displayed size of the canvas element
        // We need to map from displayed size to canvas pixel dimensions
        const scaleX = canvas.width / canvasRect.width;
        const scaleY = canvas.height / canvasRect.height;

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
        if (!isActive || activeTool === 'select') return;

        // Handle move tool
        if (activeTool === 'move') {
            e.preventDefault(); // Prevent text selection during drag
            setIsDragging(true);
            // Capture the current editing state offsets at drag start
            const currentLayer = layerStore.editingState || layer;
            setDragStart({
                x: e.clientX,
                y: e.clientY,
                offsetX: currentLayer.offsetX,
                offsetY: currentLayer.offsetY
            });
            return;
        }

        // Handle scale tool - handled by scale handles
        if (activeTool === 'scale') {
            return;
        }

        if (!imageLoaded) return;

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
        // Handle drag for move tool
        if (isDragging && activeTool === 'move' && dragStart) {
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;

            // Calculate new offset relative to the original starting position
            layerStore.setOffsetX(dragStart.offsetX + deltaX);
            layerStore.setOffsetY(dragStart.offsetY + deltaY);
            return;
        }

        // Scaling is handled by window event listeners, not here

        const coords = getCanvasCoords(e);
        setCursorPos(coords);

        if (!isActive || !isDrawing || activeTool === 'select' || activeTool === 'color-picker' || activeTool === 'move' || activeTool === 'scale') return;

        if (coords) {
            applyBrush(coords.x, coords.y);
        }
    };

    const handleMouseUp = () => {
        if (isDragging && activeTool === 'move') {
            setIsDragging(false);
            setDragStart(null);
            layerStore.saveCurrentLayer();
            return;
        }

        // Scaling mouseup is handled by window event listener

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
        if (isDragging && activeTool === 'move') {
            setIsDragging(false);
            setDragStart(null);
        }
        // Don't stop scaling on mouse leave - let window event handle it
        if (isDrawing && canvasRef.current) {
            setIsDrawing(false);

            const dataURL = canvasRef.current.toDataURL('image/png');
            layerStore.setEditedPixels(layer.id, dataURL);
            layerStore.saveCurrentLayer();
        }
    };

    // Render cursor preview
    const renderCursorPreview = () => {
        if (!cursorPos || !isActive || activeTool === 'select' || activeTool === 'move' || activeTool === 'scale' || !containerRef.current || !canvasRef.current) return null;

        const canvas = canvasRef.current;
        const canvasRect = canvas.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        // Convert canvas pixel coordinates back to display coordinates
        const scaleX = canvasRect.width / canvas.width;
        const scaleY = canvasRect.height / canvas.height;

        const radius = brushSettings.radius;
        const scaledRadius = radius * scaleX;

        // The preview div is positioned inside the scaled container, so we need to account for:
        // 1. Canvas position relative to container (in screen space)
        // 2. The container's scale transform (positions inside are in pre-transform space)
        const canvasOffsetX = canvasRect.left - containerRect.left;
        const canvasOffsetY = canvasRect.top - containerRect.top;

        // Divide by the layer's scale because the preview div's position gets multiplied by it
        const currentScale = layer.scale;
        const left = ((cursorPos.x * scaleX) - scaledRadius + canvasOffsetX) / currentScale;
        const top = ((cursorPos.y * scaleY) - scaledRadius + canvasOffsetY) / currentScale;
        const previewWidth = (scaledRadius * 2) / currentScale;
        const previewHeight = (scaledRadius * 2) / currentScale;

        const cursorStyle: React.CSSProperties = {
            position: 'absolute',
            left,
            top,
            width: previewWidth,
            height: previewHeight,
            border: '2px solid #4a9eff',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 1,
        };

        if (activeTool === 'erase') {
            cursorStyle.backgroundColor = 'rgba(255, 0, 0, 0.2)';
        } else if (activeTool === 'paint-color') {
            cursorStyle.backgroundColor = brushSettings.currentTextColor + '40';
        } else if (activeTool === 'paint-alpha') {
            cursorStyle.backgroundColor = 'rgba(74, 158, 255, 0.2)';
        } else if (activeTool === 'color-picker') {
            const pickerSize = 10 / currentScale;
            cursorStyle.width = pickerSize;
            cursorStyle.height = pickerSize;
            cursorStyle.left = ((cursorPos.x * scaleX) - (5) + canvasOffsetX) / currentScale;
            cursorStyle.top = ((cursorPos.y * scaleY) - (5) + canvasOffsetY) / currentScale;
            cursorStyle.backgroundColor = 'rgba(255, 255, 0, 0.5)';
        }

        return <div style={cursorStyle} />;
    };

    // Render scale handles
    const renderScaleHandles = () => {
        if (!isActive || activeTool !== 'scale' || !containerRef.current) return null;

        const handleSize = 12;
        const handleStyle = (position: string, cursor: string): React.CSSProperties => ({
            position: 'absolute',
            width: `${handleSize}px`,
            height: `${handleSize}px`,
            backgroundColor: '#4a9eff',
            border: '2px solid white',
            borderRadius: '50%',
            cursor,
            zIndex: 2,
            ...(position === 'nw' && { top: `-${handleSize / 2}px`, left: `-${handleSize / 2}px` }),
            ...(position === 'n' && { top: `-${handleSize / 2}px`, left: '50%', transform: 'translateX(-50%)' }),
            ...(position === 'ne' && { top: `-${handleSize / 2}px`, right: `-${handleSize / 2}px` }),
            ...(position === 'e' && { top: '50%', right: `-${handleSize / 2}px`, transform: 'translateY(-50%)' }),
            ...(position === 'se' && { bottom: `-${handleSize / 2}px`, right: `-${handleSize / 2}px` }),
            ...(position === 's' && { bottom: `-${handleSize / 2}px`, left: '50%', transform: 'translateX(-50%)' }),
            ...(position === 'sw' && { bottom: `-${handleSize / 2}px`, left: `-${handleSize / 2}px` }),
            ...(position === 'w' && { top: '50%', left: `-${handleSize / 2}px`, transform: 'translateY(-50%)' }),
        });

        const handleMouseDown = (position: string) => (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsScaling(true);
            setScaleHandle(position);
            const currentLayer = layerStore.editingState || layer;
            setScaleStart({
                x: e.clientX,
                y: e.clientY,
                scale: currentLayer.scale
            });
        };

        return (
            <>
                <div style={handleStyle('nw', 'nw-resize')} onMouseDown={handleMouseDown('nw')} />
                <div style={handleStyle('n', 'n-resize')} onMouseDown={handleMouseDown('n')} />
                <div style={handleStyle('ne', 'ne-resize')} onMouseDown={handleMouseDown('ne')} />
                <div style={handleStyle('e', 'e-resize')} onMouseDown={handleMouseDown('e')} />
                <div style={handleStyle('se', 'se-resize')} onMouseDown={handleMouseDown('se')} />
                <div style={handleStyle('s', 's-resize')} onMouseDown={handleMouseDown('s')} />
                <div style={handleStyle('sw', 'sw-resize')} onMouseDown={handleMouseDown('sw')} />
                <div style={handleStyle('w', 'w-resize')} onMouseDown={handleMouseDown('w')} />
            </>
        );
    };

    const isInteractive = isActive && activeTool !== 'select';
    const isMoveMode = isActive && activeTool === 'move';

    const { position, offsetX, offsetY, scale, zIndex } = layer;

    let transformOrigin = 'center';
    switch (position) {
        case 'top-left': transformOrigin = 'top left'; break;
        case 'top-center': transformOrigin = 'top center'; break;
        case 'top-right': transformOrigin = 'top right'; break;
        case 'center-left': transformOrigin = 'center left'; break;
        case 'center-right': transformOrigin = 'center right'; break;
        case 'bottom-left': transformOrigin = 'bottom left'; break;
        case 'bottom-center': transformOrigin = 'bottom center'; break;
        case 'bottom-right': transformOrigin = 'bottom right'; break;
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

    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        transition: isDragging || isScaling ? 'none' : 'transform 0.05s ease-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex, // Keep original z-index for consistent layer ordering
        transformOrigin,
        transform,
        cursor: isMoveMode ? (isDragging ? 'grabbing' : 'grab') : (isInteractive ? 'none' : 'default'),
        userSelect: 'none', // Prevent text selection
        WebkitUserSelect: 'none', // Safari
        MozUserSelect: 'none', // Firefox
        msUserSelect: 'none', // IE/Edge
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
                {activeTool === 'scale' && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: '2px dashed #4a9eff',
                            pointerEvents: 'none',
                            zIndex: 0,
                        }}
                    />
                )}
                <canvas
                    ref={canvasRef}
                    style={{ display: 'block' }}
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
                {renderScaleHandles()}
            </div>
        );
    }

    // Otherwise, render regular ImageLayer
    return <ImageLayer layer={layer} parallaxOffset={parallaxOffset} />;
});

