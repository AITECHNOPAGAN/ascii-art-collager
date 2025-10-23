import { observer } from 'mobx-react-lite';
import { useRef, useState } from 'react';
import { AsciiLayer as AsciiLayerType } from '@/types';
import { useEditingStore, useLayerStore } from '@/stores';

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

interface EditableAsciiLayerProps {
    layer: AsciiLayerType;
    parallaxOffset?: { x: number; y: number };
}

export const EditableAsciiLayer = observer(({ layer, parallaxOffset = { x: 0, y: 0 } }: EditableAsciiLayerProps) => {
    const editingStore = useEditingStore();
    const layerStore = useLayerStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number, y: number, offsetX: number, offsetY: number } | null>(null);

    const { activeTool, brushSettings } = editingStore;
    const isActive = layerStore.activeLayerId === layer.id;

    // Convert mouse coordinates to lattice grid coordinates
    const getGridCoords = (e: React.MouseEvent): { x: number, y: number } | null => {
        if (!containerRef.current) return null;

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const cellWidth = rect.width / layer.lattice.width;
        const cellHeight = rect.height / layer.lattice.height;

        const gridX = Math.floor(mouseX / cellWidth);
        const gridY = Math.floor(mouseY / cellHeight);

        if (gridX < 0 || gridX >= layer.lattice.width || gridY < 0 || gridY >= layer.lattice.height) {
            return null;
        }

        return { x: gridX, y: gridY };
    };

    // Apply brush effect to cells
    const applyBrush = (gridX: number, gridY: number) => {
        const radius = brushSettings.radius;

        for (let dy = -radius + 1; dy < radius; dy++) {
            for (let dx = -radius + 1; dx < radius; dx++) {
                const x = gridX + dx;
                const y = gridY + dy;

                if (x >= 0 && x < layer.lattice.width && y >= 0 && y < layer.lattice.height) {
                    if (activeTool === 'erase') {
                        layerStore.eraseLatticeCell(layer.id, x, y);
                    } else if (activeTool === 'paint-color') {
                        layerStore.updateLatticeCell(layer.id, x, y, {
                            textColor: brushSettings.currentTextColor,
                            bgColor: brushSettings.currentBgColor,
                            alpha: brushSettings.currentAlpha,
                        });
                    } else if (activeTool === 'paint-alpha') {
                        layerStore.updateLatticeCell(layer.id, x, y, {
                            alpha: brushSettings.currentAlpha,
                        });
                    }
                }
            }
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

        const coords = getGridCoords(e);
        if (!coords) return;

        if (activeTool === 'color-picker') {
            // Pick color from cell
            const cell = layer.lattice.cells[coords.y]?.[coords.x];
            if (cell) {
                editingStore.setCurrentTextColor(cell.textColor);
                editingStore.setCurrentBgColor(cell.bgColor);
                editingStore.setCurrentAlpha(cell.alpha);
            }
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

        const coords = getGridCoords(e);
        setCursorPos(coords);

        if (!isActive || !isDrawing || activeTool === 'select' || activeTool === 'color-picker' || activeTool === 'move') return;

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

        if (isDrawing) {
            setIsDrawing(false);
            layerStore.saveCurrentLayer();
        }
    };

    const handleMouseLeave = () => {
        setCursorPos(null);
        if (isDragging && activeTool === 'move') {
            setIsDragging(false);
            setDragStart(null);
        }
        if (isDrawing) {
            setIsDrawing(false);
            layerStore.saveCurrentLayer();
        }
    };

    // Render cursor preview
    const renderCursorPreview = () => {
        if (!cursorPos || !isActive || activeTool === 'select' || activeTool === 'move' || !containerRef.current) return null;

        const rect = containerRef.current.getBoundingClientRect();

        const cellWidth = rect.width / layer.lattice.width;
        const cellHeight = rect.height / layer.lattice.height;

        const radius = brushSettings.radius;
        const previewSize = radius * 2 - 1;

        const cursorStyle: React.CSSProperties = {
            position: 'absolute',
            left: (cursorPos.x - radius + 1) * cellWidth,
            top: (cursorPos.y - radius + 1) * cellHeight,
            width: previewSize * cellWidth,
            height: previewSize * cellHeight,
            border: '2px solid #4a9eff',
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
            cursorStyle.backgroundColor = 'rgba(255, 255, 0, 0.3)';
            cursorStyle.width = cellWidth;
            cursorStyle.height = cellHeight;
            cursorStyle.left = cursorPos.x * cellWidth;
            cursorStyle.top = cursorPos.y * cellHeight;
        }

        return <div style={cursorStyle} />;
    };

    const isInteractive = isActive && activeTool !== 'select';
    const isMoveMode = isActive && activeTool === 'move';

    // When interactive, we need to render the layer ourselves with proper event handlers
    // instead of wrapping the AsciiLayer component
    const { position, offsetX, offsetY, scale, fontSize, zIndex, lattice } = layer;

    if (!lattice || lattice.cells.length === 0) return null;

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
        transition: isDragging ? 'none' : 'transform 0.05s ease-out',
        zIndex: isActive && isInteractive ? 9999 : zIndex, // Boost z-index when actively editing
        transformOrigin,
        transform,
        fontFamily: "'Courier New', monospace",
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        whiteSpace: 'pre',
        letterSpacing: 0,
        wordSpacing: 0,
        cursor: isMoveMode ? (isDragging ? 'grabbing' : 'grab') : (isInteractive ? 'none' : 'default'),
        userSelect: 'none', // Prevent text selection
        WebkitUserSelect: 'none', // Safari
        MozUserSelect: 'none', // Firefox
        msUserSelect: 'none', // IE/Edge
        ...(position === 'top-left' && { top: 0, left: 0 }),
        ...(position === 'top-right' && { top: 0, right: 0 }),
        ...(position === 'bottom-left' && { bottom: 0, left: 0 }),
        ...(position === 'bottom-right' && { bottom: 0, right: 0 }),
        ...(position === 'center' && { top: '50%', left: '50%' }),
    };

    return (
        <div
            ref={containerRef}
            className="ascii-layer editable"
            style={containerStyle}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
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

                        // If cell has a className or styling, wrap in span
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
            {renderCursorPreview()}
        </div>
    );
});

