import { observer } from 'mobx-react-lite';
import { useLayerStore } from '@/stores';
import { Eye, EyeOff, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LayerItemProps {
    layerId: number;
}

export const LayerItem = observer(({ layerId }: LayerItemProps) => {
    const layerStore = useLayerStore();
    const layer = layerStore.layers.find(l => l.id === layerId);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: layerId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    if (!layer) return null;

    const displayData = layerStore.getLayerData(layerId);
    if (!displayData) return null;

    const isActive = layer.id === layerStore.activeLayerId;
    const unsavedIndicator = (layer.id === layerStore.activeLayerId && layerStore.hasUnsavedChanges) ? ' *' : '';

    // Create preview based on layer type
    let preview: string;
    if (displayData.type === 'image') {
        const displayImage = displayData.editedPixels || displayData.imageData;
        preview = displayImage ? '🖼️ Image Layer' : '(no image)';
    } else {
        // ASCII layer
        const hasContent = displayData.lattice && displayData.lattice.cells.length > 0;
        if (hasContent) {
            // Get first few non-empty characters from lattice
            let previewText = '';
            for (let y = 0; y < Math.min(3, displayData.lattice.height); y++) {
                for (let x = 0; x < Math.min(20, displayData.lattice.width); x++) {
                    const cell = displayData.lattice.cells[y]?.[x];
                    if (cell && cell.char !== ' ') {
                        previewText += cell.char;
                    }
                }
            }
            preview = previewText ? '🎨 ' + previewText.substring(0, 25) + '...' : '(empty lattice)';
        } else {
            preview = '(empty)';
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
        bg-secondary/50 border p-3 cursor-pointer transition-all rounded-none
        ${isActive ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20' : 'border-border hover:border-border/60 hover:bg-secondary/70'}
      `}
            onClick={() => layerStore.setActiveLayer(layerId)}
        >
            <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 flex-1">
                    <div
                        className="cursor-grab active:cursor-grabbing touch-none"
                        {...attributes}
                        {...listeners}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-bold flex-1">
                        {layer.name}{unsavedIndicator}
                    </span>
                </div>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                            e.stopPropagation();
                            layerStore.toggleLayerVisibility(layerId);
                        }}
                        title="Toggle visibility"
                    >
                        {layer.visibility ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-destructive/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            layerStore.deleteLayer(layerId);
                        }}
                        title="Delete"
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2 font-mono truncate">
                {preview}
            </div>
        </div>
    );
});

