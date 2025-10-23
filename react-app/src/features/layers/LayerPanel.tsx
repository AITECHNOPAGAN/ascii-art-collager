import { observer } from 'mobx-react-lite';
import { useLayerStore } from '@/stores';
import { LayerItem } from './LayerItem';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Image as ImageIcon } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export const LayerPanel = observer(() => {
    const layerStore = useLayerStore();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = layerStore.layers.findIndex(l => l.id === active.id);
            const newIndex = layerStore.layers.findIndex(l => l.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                layerStore.reorderLayers(oldIndex, newIndex);
            }
        }
    };

    // Prepare layers for display - reverse order so top layers appear first
    const displayLayers = [...layerStore.layers].reverse();

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Layers</CardTitle>
                    <div className="flex gap-2 mt-2">
                        <Button onClick={() => layerStore.createNewAsciiLayer()} className="flex-1">
                            <Plus className="mr-2 h-4 w-4" />
                            ASCII
                        </Button>
                        <Button onClick={() => layerStore.createNewImageLayer()} className="flex-1">
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Image
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                        {layerStore.layers.length === 0 ? (
                            <div className="text-center text-muted-foreground text-sm py-8 italic">
                                No layers yet. Click a button to create one!
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={displayLayers.map(l => l.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {/* Show layers in reverse order (top layers first in UI) */}
                                    {displayLayers.map((layer) => (
                                        <LayerItem
                                            key={layer.id}
                                            layerId={layer.id}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Unsaved Changes Dialog */}
            <UnsavedChangesDialog
                open={layerStore.pendingLayerSwitch !== null}
                onSave={() => layerStore.confirmLayerSwitch(true)}
                onDiscard={() => layerStore.confirmLayerSwitch(false)}
                onCancel={() => layerStore.cancelLayerSwitch()}
            />
        </>
    );
});

