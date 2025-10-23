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

    return (
        <div
            ref={containerRef}
            className="canvas-container"
            style={{
                ...containerStyles,
                position: 'relative',
                backgroundColor: canvasStore.backgroundColor,
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            }}
        >
            {layerStore.layers.map(layer => {
                const layerData = layerStore.getLayerData(layer.id);
                if (!layerData || !layerData.visibility) return null;

                const parallaxOffset = effectsStore.parallaxEnabled ? {
                    x: (effectsStore.mouseX - 0.5) * layerData.parallaxStrength * 100,
                    y: (effectsStore.mouseY - 0.5) * layerData.parallaxStrength * 100,
                } : { x: 0, y: 0 };

                const isActive = layerStore.activeLayerId === layer.id;
                const isEditMode = editingStore.activeTool !== 'select';

                // Render editable layer if active and in edit mode
                if (isActive && isEditMode) {
                    if (layerData.type === 'image') {
                        return <EditableImageLayer key={layer.id} layer={layerData} parallaxOffset={parallaxOffset} />;
                    } else {
                        return <EditableAsciiLayer key={layer.id} layer={layerData} parallaxOffset={parallaxOffset} />;
                    }
                }

                // Otherwise render regular layer
                if (layerData.type === 'image') {
                    return <ImageLayer key={layer.id} layer={layerData} parallaxOffset={parallaxOffset} />;
                } else {
                    return <AsciiLayer key={layer.id} layer={layerData} parallaxOffset={parallaxOffset} />;
                }
            })}
        </div>
    );
});

