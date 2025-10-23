import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useEditingStore, useLayerStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MousePointer, Eraser, Paintbrush, Droplet, Pipette, Code } from 'lucide-react';
import { AsciiEditorDialog } from './AsciiEditorDialog';

export const EditingToolbar = observer(() => {
    const editingStore = useEditingStore();
    const layerStore = useLayerStore();
    const [showEditorDialog, setShowEditorDialog] = useState(false);

    const activeLayer = layerStore.activeLayer;
    const editingState = layerStore.editingState;
    const { activeTool, brushSettings } = editingStore;

    if (!activeLayer) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Editing Tools</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground italic">
                        Select a layer to start editing
                    </p>
                </CardContent>
            </Card>
        );
    }

    const isAsciiLayer = activeLayer.type === 'ascii';
    const maxBrushRadius = isAsciiLayer ? 10 : 50;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Editing Tools</CardTitle>
                    <Badge variant={isAsciiLayer ? 'default' : 'secondary'}>
                        {isAsciiLayer ? 'ASCII' : 'Image'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Text/HTML Edit Button for ASCII layers */}
                {isAsciiLayer && (
                    <div className="space-y-2">
                        <Button
                            onClick={() => setShowEditorDialog(true)}
                            variant="outline"
                            className="w-full"
                        >
                            <Code className="mr-2 h-4 w-4" />
                            Edit ASCII / HTML
                        </Button>
                    </div>
                )}

                {/* Tool Selector */}
                <div className="space-y-2">
                    <Label>Tool</Label>
                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            variant={activeTool === 'select' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => editingStore.setActiveTool('select')}
                            title="Select (no editing)"
                        >
                            <MousePointer className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={activeTool === 'erase' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => editingStore.setActiveTool('erase')}
                            title="Erase"
                        >
                            <Eraser className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={activeTool === 'paint-color' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => editingStore.setActiveTool('paint-color')}
                            title="Paint Color"
                        >
                            <Paintbrush className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={activeTool === 'paint-alpha' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => editingStore.setActiveTool('paint-alpha')}
                            title="Paint Alpha"
                        >
                            <Droplet className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={activeTool === 'color-picker' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => editingStore.setActiveTool('color-picker')}
                            title="Color Picker"
                        >
                            <Pipette className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Brush Radius */}
                {(activeTool === 'erase' || activeTool === 'paint-color' || activeTool === 'paint-alpha') && (
                    <div className="space-y-2">
                        <Label>Brush Radius: {brushSettings.radius}</Label>
                        <Slider
                            value={[brushSettings.radius]}
                            onValueChange={([value]: number[]) => editingStore.setBrushRadius(value)}
                            min={1}
                            max={maxBrushRadius}
                            step={1}
                        />
                    </div>
                )}

                {/* Color Pickers */}
                {(activeTool === 'paint-color' || activeTool === 'color-picker') && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="text-color-picker">Text Color</Label>
                            <Input
                                id="text-color-picker"
                                type="color"
                                value={brushSettings.currentTextColor}
                                onChange={(e) => editingStore.setCurrentTextColor(e.target.value)}
                                className="h-10 cursor-pointer"
                            />
                        </div>

                        {isAsciiLayer && (
                            <div className="space-y-2">
                                <Label htmlFor="bg-color-picker">Background Color</Label>
                                <Input
                                    id="bg-color-picker"
                                    type="color"
                                    value={brushSettings.currentBgColor === 'transparent' ? '#ffffff' : brushSettings.currentBgColor}
                                    onChange={(e) => editingStore.setCurrentBgColor(e.target.value)}
                                    className="h-10 cursor-pointer"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => editingStore.setCurrentBgColor('transparent')}
                                    className="w-full"
                                >
                                    Transparent BG
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {/* Alpha Slider */}
                {(activeTool === 'paint-alpha' || activeTool === 'paint-color') && (
                    <div className="space-y-2">
                        <Label>Alpha: {brushSettings.currentAlpha.toFixed(2)}</Label>
                        <Slider
                            value={[brushSettings.currentAlpha]}
                            onValueChange={([value]: number[]) => editingStore.setCurrentAlpha(value)}
                            min={0}
                            max={1}
                            step={0.05}
                        />
                    </div>
                )}

                {/* Full Image Tint Color (All Layers) */}
                {editingState && (
                    <div className="space-y-2 pt-2 border-t">
                        <Label htmlFor="tint-color-picker">
                            {editingState.type === 'ascii' ? 'Full Image Tint' : 'Image Tint'}
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="tint-color-picker"
                                type="color"
                                value={editingState.tintColor || '#ffffff'}
                                onChange={(e) => layerStore.setTintColor(e.target.value)}
                                className="h-10 cursor-pointer flex-1"
                                disabled={!editingState.tintColor}
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
                                className="flex-shrink-0"
                            >
                                {editingState.tintColor ? 'Remove' : 'Enable'}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {editingState.type === 'ascii'
                                ? 'Apply a color tint to all non-empty cells'
                                : 'Apply a color tint to the entire image'
                            }
                        </p>
                    </div>
                )}

                {/* Current Tool Info */}
                <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                        {activeTool === 'select'
                            ? 'No tool selected'
                            : activeTool === 'erase'
                                ? 'Click and drag to erase'
                                : activeTool === 'paint-color'
                                    ? 'Click and drag to paint color'
                                    : activeTool === 'paint-alpha'
                                        ? 'Click and drag to adjust transparency'
                                        : 'Click to pick a color'
                        }
                    </p>
                </div>

                {/* ASCII Editor Dialog */}
                {isAsciiLayer && activeLayer.type === 'ascii' && (
                    <AsciiEditorDialog
                        layer={activeLayer}
                        open={showEditorDialog}
                        onClose={() => setShowEditorDialog(false)}
                    />
                )}
            </CardContent>
        </Card>
    );
});

