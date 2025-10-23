import { observer } from 'mobx-react-lite';
import { useLayerStore } from '@/stores';
import { Eye, EyeOff, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LayerItemProps {
    layerId: number;
    index: number;
    totalLayers: number;
}

export const LayerItem = observer(({ layerId, index, totalLayers }: LayerItemProps) => {
    const layerStore = useLayerStore();
    const layer = layerStore.layers.find(l => l.id === layerId);

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
            className={`
        bg-secondary/50 border-1 p-3 cursor-pointer transition-all
        ${isActive ? 'border-primary bg-primary/10 shadow-lg' : 'border-border hover:border-border/60 hover:bg-secondary/70'}
      `}
            onClick={() => layerStore.setActiveLayer(layerId)}
        >
            <div className="flex justify-between items-center gap-2">
                <span className="text-sm font-bold flex-1">
                    {layer.name}{unsavedIndicator}
                </span>
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
                        className="h-7 w-7"
                        onClick={(e) => {
                            e.stopPropagation();
                            layerStore.moveLayerUp(layerId);
                        }}
                        disabled={index === totalLayers - 1}
                        title="Move up"
                    >
                        <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                            e.stopPropagation();
                            layerStore.moveLayerDown(layerId);
                        }}
                        disabled={index === 0}
                        title="Move down"
                    >
                        <ChevronDown className="h-4 w-4" />
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

