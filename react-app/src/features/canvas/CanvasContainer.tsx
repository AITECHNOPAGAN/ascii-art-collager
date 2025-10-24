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
    const mousePositionRef = useRef({ x: 0.5, y: 0.5 });
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!effectsStore.parallaxEnabled || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            mousePositionRef.current.x = (e.clientX - rect.left) / rect.width;
            mousePositionRef.current.y = (e.clientY - rect.top) / rect.height;
        };

        if (effectsStore.parallaxEnabled) {
            document.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, [effectsStore.parallaxEnabled]);

    // Separate effect for parallax animation using requestAnimationFrame
    useEffect(() => {
        if (!effectsStore.parallaxEnabled) {
            return;
        }

        const updateParallax = () => {
            if (!containerRef.current) return;

            const layers = containerRef.current.querySelectorAll('.ascii-layer, .image-layer');
            layers.forEach((layerElement) => {
                const htmlElement = layerElement as HTMLElement;
                const parallaxStrength = parseFloat(htmlElement.dataset.parallax || '0');
                const offsetX = parseFloat(htmlElement.dataset.offsetX || '0');
                const offsetY = parseFloat(htmlElement.dataset.offsetY || '0');
                const scale = parseFloat(htmlElement.dataset.scale || '1');
                const position = htmlElement.dataset.position || 'center';

                const translateX = offsetX + (mousePositionRef.current.x - 0.5) * parallaxStrength * 100;
                const translateY = offsetY + (mousePositionRef.current.y - 0.5) * parallaxStrength * 100;

                if (position === 'center') {
                    htmlElement.style.transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})`;
                } else {
                    htmlElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
                }
            });

            animationFrameRef.current = requestAnimationFrame(updateParallax);
        };

        animationFrameRef.current = requestAnimationFrame(updateParallax);

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
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

                // No parallax offset in React - handled by requestAnimationFrame
                const parallaxOffset = { x: 0, y: 0 };

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

