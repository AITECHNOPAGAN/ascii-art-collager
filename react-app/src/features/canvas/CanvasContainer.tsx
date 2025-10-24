import { observer } from 'mobx-react-lite';
import { useLayerStore, useCanvasStore, useEffectsStore, useEditingStore } from '@/stores';
import { AsciiLayer } from './AsciiLayer';
import { ImageLayer } from './ImageLayer';
import { EditableAsciiLayer } from './EditableAsciiLayer';
import { EditableImageLayer } from './EditableImageLayer';
import { useEffect, useRef } from 'react';

export const CanvasContainer = observer(() => {
    const layerStore = useLayerStore();
    const canvasStore = useCanvasStore();
    const effectsStore = useEffectsStore();
    const editingStore = useEditingStore();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!effectsStore.parallaxEnabled || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            effectsStore.updateMousePosition(x, y);
        };

        if (effectsStore.parallaxEnabled) {
            document.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, [effectsStore.parallaxEnabled]);

    const containerStyles = canvasStore.getContainerStyles();

    // Sort layers by zIndex for consistent visual rendering
    const sortedLayers = [...layerStore.layers].sort((a, b) => a.zIndex - b.zIndex);

    // Check if any layer is being actively edited (not just selected)
    const isAnyLayerBeingEdited = layerStore.activeLayerId !== null && editingStore.activeTool !== 'select';

    return (
        <div
            ref={containerRef}
            className="canvas-container"
            style={{
                ...containerStyles,
                position: 'relative',
                backgroundColor: canvasStore.backgroundColor,
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                zIndex: 0,
            }}
        >
            {sortedLayers.map(layer => {
                const layerData = layerStore.getLayerData(layer.id);
                if (!layerData || !layerData.visibility) return null;

                const parallaxOffset = effectsStore.parallaxEnabled ? {
                    x: (effectsStore.mouseX - 0.5) * layerData.parallaxStrength * 100,
                    y: (effectsStore.mouseY - 0.5) * layerData.parallaxStrength * 100,
                } : { x: 0, y: 0 };

                const isActive = layerStore.activeLayerId === layer.id;
                const isEditMode = editingStore.activeTool !== 'select';

                // Disable pointer events on non-active layers when editing
                const disablePointerEvents = isAnyLayerBeingEdited && !isActive;

                // Render editable layer if active and in edit mode (including move tool)
                if (isActive && isEditMode) {
                    if (layerData.type === 'image') {
                        return <EditableImageLayer key={layer.id} layer={layerData} parallaxOffset={parallaxOffset} />;
                    } else {
                        return <EditableAsciiLayer key={layer.id} layer={layerData} parallaxOffset={parallaxOffset} />;
                    }
                }

                // Otherwise render regular layer (with pointer events disabled if needed)
                if (layerData.type === 'image') {
                    return <ImageLayer key={layer.id} layer={layerData} parallaxOffset={parallaxOffset} disablePointerEvents={disablePointerEvents} />;
                } else {
                    return <AsciiLayer key={layer.id} layer={layerData} parallaxOffset={parallaxOffset} disablePointerEvents={disablePointerEvents} />;
                }
            })}
        </div>
    );
});

