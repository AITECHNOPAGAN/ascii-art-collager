import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useEditingStore, useLayerStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { MousePointer, Move, Eraser, Paintbrush, Droplet, Pipette, Code } from 'lucide-react';
import { AsciiEditorDialog } from './AsciiEditorDialog';
import { Separator } from '@/components/ui/separator';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export const EditingFooter = observer(() => {
    const editingStore = useEditingStore();
    const layerStore = useLayerStore();
    const [showEditorDialog, setShowEditorDialog] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const activeLayer = layerStore.activeLayer;
    const editingState = layerStore.editingState;
    const { activeTool, brushSettings } = editingStore;

    if (!activeLayer) {
        return (
            <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t shadow-lg">
                <div className="px-6 py-3 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground italic">
                        Select a layer to start editing
                    </p>
                </div>
            </div>
        );
    }

    const isAsciiLayer = activeLayer.type === 'ascii';
    const maxBrushRadius = isAsciiLayer ? 10 : 50;

    const toolTips = {
        select: 'Select (no editing)',
        move: 'Move (drag to reposition)',
        erase: 'Erase',
        'paint-color': 'Paint Color',
        'paint-alpha': 'Paint Alpha',
        'color-picker': 'Color Picker'
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t shadow-lg z-50">
            <div className="px-6 py-3">
                <div className="flex items-center gap-6 justify-between max-w-screen-2xl mx-auto">
                    {/* Layer Type Badge */}
                    <div className="flex items-center gap-3">
                        <Badge variant={isAsciiLayer ? 'default' : 'secondary'} className="h-8 px-3">
                            {isAsciiLayer ? 'ASCII' : 'Image'}
                        </Badge>

                        {/* ASCII Editor Button */}
                        {isAsciiLayer && (
                            <>
                                <Separator orientation="vertical" className="h-8" />
                                <Button
                                    onClick={() => setShowEditorDialog(true)}
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                >
                                    <Code className="mr-2 h-3.5 w-3.5" />
                                    Edit Code
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Tool Buttons */}
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant={activeTool === 'select' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => editingStore.setActiveTool('select')}
                            title={toolTips.select}
                            className="h-8 w-8 p-0"
                        >
                            <MousePointer className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={activeTool === 'move' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => editingStore.setActiveTool('move')}
                            title={toolTips.move}
                            className="h-8 w-8 p-0"
                        >
                            <Move className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={activeTool === 'erase' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => editingStore.setActiveTool('erase')}
                            title={toolTips.erase}
                            className="h-8 w-8 p-0"
                        >
                            <Eraser className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={activeTool === 'paint-color' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => editingStore.setActiveTool('paint-color')}
                            title={toolTips['paint-color']}
                            className="h-8 w-8 p-0"
                        >
                            <Paintbrush className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={activeTool === 'paint-alpha' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => editingStore.setActiveTool('paint-alpha')}
                            title={toolTips['paint-alpha']}
                            className="h-8 w-8 p-0"
                        >
                            <Droplet className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={activeTool === 'color-picker' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => editingStore.setActiveTool('color-picker')}
                            title={toolTips['color-picker']}
                            className="h-8 w-8 p-0"
                        >
                            <Pipette className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Brush Radius Slider - Compact */}
                    {(activeTool === 'erase' || activeTool === 'paint-color' || activeTool === 'paint-alpha') && (
                        <>
                            <Separator orientation="vertical" className="h-8" />
                            <div className="flex items-center gap-3 min-w-[180px]">
                                <Label className="text-xs whitespace-nowrap">Radius: {brushSettings.radius}</Label>
                                <Slider
                                    value={[brushSettings.radius]}
                                    onValueChange={([value]: number[]) => editingStore.setBrushRadius(value)}
                                    min={1}
                                    max={maxBrushRadius}
                                    step={1}
                                    className="w-24"
                                />
                            </div>
                        </>
                    )}

                    {/* Color Pickers - Compact Squares */}
                    {(activeTool === 'paint-color' || activeTool === 'color-picker') && (
                        <>
                            <Separator orientation="vertical" className="h-8" />
                            <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 px-3 gap-2">
                                        <div className="flex gap-1.5 items-center">
                                            {/* Text Color Square */}
                                            <div
                                                className="w-5 h-5 rounded border-2 border-border cursor-pointer transition-transform hover:scale-110"
                                                style={{ backgroundColor: brushSettings.currentTextColor }}
                                                title="Text Color"
                                            />
                                            {/* Background Color Square */}
                                            {isAsciiLayer && (
                                                <div
                                                    className="w-5 h-5 rounded border-2 border-border cursor-pointer transition-transform hover:scale-110"
                                                    style={{
                                                        backgroundColor: brushSettings.currentBgColor === 'transparent' ? 'transparent' : brushSettings.currentBgColor,
                                                        backgroundImage: brushSettings.currentBgColor === 'transparent'
                                                            ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                                                            : 'none',
                                                        backgroundSize: brushSettings.currentBgColor === 'transparent' ? '8px 8px' : 'auto',
                                                        backgroundPosition: brushSettings.currentBgColor === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : '0 0'
                                                    }}
                                                    title="Background Color"
                                                />
                                            )}
                                        </div>
                                        <span className="text-xs">Colors</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64" side="top" align="center">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="text-color-picker" className="text-xs">Text Color</Label>
                                            <input
                                                id="text-color-picker"
                                                type="color"
                                                value={brushSettings.currentTextColor}
                                                onChange={(e) => editingStore.setCurrentTextColor(e.target.value)}
                                                className="w-full h-12 rounded cursor-pointer border border-input"
                                            />
                                        </div>

                                        {isAsciiLayer && (
                                            <div className="space-y-2">
                                                <Label htmlFor="bg-color-picker" className="text-xs">Background Color</Label>
                                                <div className="flex gap-2">
                                                    <input
                                                        id="bg-color-picker"
                                                        type="color"
                                                        value={brushSettings.currentBgColor === 'transparent' ? '#ffffff' : brushSettings.currentBgColor}
                                                        onChange={(e) => editingStore.setCurrentBgColor(e.target.value)}
                                                        disabled={brushSettings.currentBgColor === 'transparent'}
                                                        className="flex-1 h-12 rounded cursor-pointer border border-input disabled:opacity-50"
                                                    />
                                                    <Button
                                                        variant={brushSettings.currentBgColor === 'transparent' ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => editingStore.setCurrentBgColor(
                                                            brushSettings.currentBgColor === 'transparent' ? '#ffffff' : 'transparent'
                                                        )}
                                                        className="h-12 px-3"
                                                    >
                                                        {brushSettings.currentBgColor === 'transparent' ? 'Color' : 'Clear'}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </>
                    )}

                    {/* Alpha Slider */}
                    {(activeTool === 'paint-alpha' || activeTool === 'paint-color') && (
                        <>
                            <Separator orientation="vertical" className="h-8" />
                            <div className="flex items-center gap-3 min-w-[160px]">
                                <Label className="text-xs whitespace-nowrap">Alpha: {brushSettings.currentAlpha.toFixed(2)}</Label>
                                <Slider
                                    value={[brushSettings.currentAlpha]}
                                    onValueChange={([value]: number[]) => editingStore.setCurrentAlpha(value)}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    className="w-20"
                                />
                            </div>
                        </>
                    )}

                    {/* Full Image Tint */}
                    {editingState && (
                        <>
                            <Separator orientation="vertical" className="h-8" />
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 px-3 gap-2">
                                        <div
                                            className="w-5 h-5 rounded border-2 border-border"
                                            style={{ backgroundColor: editingState.tintColor || '#ffffff' }}
                                        />
                                        <span className="text-xs">Tint</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64" side="top" align="end">
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-xs font-semibold">
                                                {editingState.type === 'ascii' ? 'Full Image Tint' : 'Image Tint'}
                                            </Label>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {editingState.type === 'ascii'
                                                    ? 'Apply a color tint to all non-empty cells'
                                                    : 'Apply a color tint to the entire image'
                                                }
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={editingState.tintColor || '#ffffff'}
                                                onChange={(e) => layerStore.setTintColor(e.target.value)}
                                                disabled={!editingState.tintColor}
                                                className="flex-1 h-12 rounded cursor-pointer border border-input disabled:opacity-50"
                                            />
                                            <Button
                                                variant={editingState.tintColor ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => {
                                                    if (editingState.tintColor) {
                                                        layerStore.setTintColor(undefined);
                                                    } else {
                                                        layerStore.setTintColor('#ffffff');
                                                    }
                                                }}
                                                className="h-12 px-3"
                                            >
                                                {editingState.tintColor ? 'Remove' : 'Enable'}
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </>
                    )}

                    {/* Current Tool Info */}
                    <div className="flex-1 text-right">
                        <p className="text-xs text-muted-foreground">
                            {activeTool === 'select'
                                ? 'No tool selected'
                                : activeTool === 'move'
                                    ? 'Use the Move tool by dragging on the canvas'
                                    : activeTool === 'erase'
                                        ? 'Click and drag to erase'
                                        : activeTool === 'paint-color'
                                            ? 'Click and drag to paint color'
                                            : activeTool === 'paint-alpha'
                                                ? 'Click and drag to adjust transparency'
                                                : 'Click to pick a color from the canvas'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* ASCII Editor Dialog */}
            {isAsciiLayer && activeLayer.type === 'ascii' && (
                <AsciiEditorDialog
                    layer={activeLayer}
                    open={showEditorDialog}
                    onClose={() => setShowEditorDialog(false)}
                />
            )}
        </div>
    );
});

