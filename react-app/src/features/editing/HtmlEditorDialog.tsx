import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useLayerStore } from '@/stores';
import { HtmlLayer, OverflowType } from '@/types';
import Editor from '@monaco-editor/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface HtmlEditorDialogProps {
    layer: HtmlLayer;
    open: boolean;
    onClose: () => void;
}

export const HtmlEditorDialog = observer(({ layer, open, onClose }: HtmlEditorDialogProps) => {
    const layerStore = useLayerStore();

    // Get current layer data from store - this will reactively update
    const currentLayer = layerStore.getLayerData(layer.id);
    if (!currentLayer || currentLayer.type !== 'html') return null;

    const [localWidth, setLocalWidth] = useState<number | 'auto'>(currentLayer.width);
    const [localHeight, setLocalHeight] = useState<number | 'auto'>(currentLayer.height);
    const [useAutoWidth, setUseAutoWidth] = useState(currentLayer.width === 'auto');
    const [useAutoHeight, setUseAutoHeight] = useState(currentLayer.height === 'auto');

    const handleHtmlChange = (value: string | undefined) => {
        if (value !== undefined) {
            layerStore.setHtmlContent(layer.id, value);
        }
    };

    const handleWidthChange = (checked: boolean) => {
        setUseAutoWidth(checked);
        if (checked) {
            setLocalWidth('auto');
            layerStore.setHtmlDimensions(layer.id, 'auto', localHeight);
        } else {
            setLocalWidth(400);
            layerStore.setHtmlDimensions(layer.id, 400, localHeight);
        }
    };

    const handleHeightChange = (checked: boolean) => {
        setUseAutoHeight(checked);
        if (checked) {
            setLocalHeight('auto');
            layerStore.setHtmlDimensions(layer.id, localWidth, 'auto');
        } else {
            setLocalHeight(300);
            layerStore.setHtmlDimensions(layer.id, localWidth, 300);
        }
    };

    const handleWidthValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            setLocalWidth(value);
            layerStore.setHtmlDimensions(layer.id, value, localHeight);
        }
    };

    const handleHeightValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            setLocalHeight(value);
            layerStore.setHtmlDimensions(layer.id, localWidth, value);
        }
    };

    const handleOverflowChange = (value: OverflowType) => {
        layerStore.setHtmlOverflow(layer.id, value);
    };

    const handleSave = () => {
        layerStore.saveCurrentLayer();
        onClose();
    };

    const handleCancel = () => {
        // Discard changes by reloading layer from saved state
        layerStore.setActiveLayer(layer.id);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
            <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh] flex flex-col z-[9999]">
                <DialogHeader>
                    <DialogTitle>Edit HTML Layer: {currentLayer.name}</DialogTitle>
                    <DialogDescription>
                        Full HTML documents supported. Auto dimensions (width/height) stretch to 100% of canvas. HTML layers are always interactive, even behind other layers.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {/* Dimension and Overflow Controls */}
                    <div className="flex gap-4 flex-shrink-0">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="auto-width"
                                    checked={useAutoWidth}
                                    onCheckedChange={handleWidthChange}
                                />
                                <Label htmlFor="auto-width">Auto Width</Label>
                            </div>
                            {!useAutoWidth && (
                                <div className="space-y-1">
                                    <Label htmlFor="width-input">Width (px)</Label>
                                    <Input
                                        id="width-input"
                                        type="number"
                                        value={localWidth === 'auto' ? '' : localWidth}
                                        onChange={handleWidthValueChange}
                                        min={1}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="auto-height"
                                    checked={useAutoHeight}
                                    onCheckedChange={handleHeightChange}
                                />
                                <Label htmlFor="auto-height">Auto Height</Label>
                            </div>
                            {!useAutoHeight && (
                                <div className="space-y-1">
                                    <Label htmlFor="height-input">Height (px)</Label>
                                    <Input
                                        id="height-input"
                                        type="number"
                                        value={localHeight === 'auto' ? '' : localHeight}
                                        onChange={handleHeightValueChange}
                                        min={1}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-2">
                            <Label>Overflow Behavior</Label>
                            <Select value={currentLayer.overflow} onValueChange={handleOverflowChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="visible">Visible (no scroll)</SelectItem>
                                    <SelectItem value="scroll">Scroll (both)</SelectItem>
                                    <SelectItem value="scroll-x">Scroll X (horizontal)</SelectItem>
                                    <SelectItem value="scroll-y">Scroll Y (vertical)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* HTML Editor */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <Label className="mb-2">HTML Content</Label>
                        <div className="flex-1 border rounded-none overflow-hidden">
                            <Editor
                                height="100%"
                                defaultLanguage="html"
                                value={currentLayer.htmlContent}
                                onChange={handleHtmlChange}
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    wordWrap: 'on',
                                    automaticLayout: true,
                                }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Enter raw HTML. Full HTML documents are supported and will render in an isolated context.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
});

