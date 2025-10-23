import { observer } from 'mobx-react-lite';
import { useRef, useState } from 'react';
import { AsciiLayer as AsciiLayerType } from '@/types';
import { useEditingStore, useLayerStore } from '@/stores';

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
        const coords = getGridCoords(e);
        setCursorPos(coords);

        if (!isActive || !isDrawing || activeTool === 'select' || activeTool === 'color-picker') return;

        if (coords) {
            applyBrush(coords.x, coords.y);
        }
    };

    const handleMouseUp = () => {
        if (isDrawing) {
            setIsDrawing(false);
            layerStore.saveCurrentLayer();
        }
    };

    const handleMouseLeave = () => {
        setCursorPos(null);
        if (isDrawing) {
            setIsDrawing(false);
            layerStore.saveCurrentLayer();
        }
    };

    // Render cursor preview
    const renderCursorPreview = () => {
        if (!cursorPos || !isActive || activeTool === 'select' || !containerRef.current) return null;

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
        transition: 'transform 0.05s ease-out',
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

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: `repeat(${lattice.width}, ${fontSize}px)`,
        gridTemplateRows: `repeat(${lattice.height}, ${fontSize}px)`,
        gap: 0,
        lineHeight: 1,
        fontFamily: "'Courier New', monospace",
        fontSize: `${fontSize}px`,
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
            <div style={gridStyle}>
                {lattice.cells.map((row, y) =>
                    row.map((cell, x) => {
                        const cellStyle: React.CSSProperties = {
                            color: cell.textColor,
                            backgroundColor: cell.bgColor,
                            opacity: cell.alpha,
                            width: `${fontSize}px`,
                            height: `${fontSize}px`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1,
                            overflow: 'hidden',
                        };

                        return (
                            <div
                                key={`${y}-${x}`}
                                style={cellStyle}
                                className={cell.className}
                            >
                                {cell.char}
                            </div>
                        );
                    })
                )}
            </div>
            {renderCursorPreview()}
        </div>
    );
});

