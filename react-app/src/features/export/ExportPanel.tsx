import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useLayerStore, useCanvasStore, useEffectsStore } from '@/stores';
import { generateExportHTML, downloadFile } from '@/utils/htmlExporter';
import { Resolution } from '@/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';

export const ExportPanel = observer(() => {
    const layerStore = useLayerStore();
    const canvasStore = useCanvasStore();
    const effectsStore = useEffectsStore();
    const [includeGeneratorLink, setIncludeGeneratorLink] = useState(true);

    const handleExport = () => {
        // Auto-save any unsaved changes before exporting
        if (layerStore.hasUnsavedChanges && layerStore.activeLayerId && layerStore.editingState) {
            layerStore.saveCurrentLayer();
        }

        const htmlContent = generateExportHTML(layerStore.layers, {
            resolution: canvasStore.resolution,
            parallaxEnabled: effectsStore.parallaxEnabled,
            includeGeneratorLink,
            backgroundColor: canvasStore.backgroundColor,
        });

        if (htmlContent) {
            downloadFile(htmlContent, 'ascii-art.html');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Resolution</Label>
                    <Select
                        value={canvasStore.resolution}
                        onValueChange={(value: string) => canvasStore.setResolution(value as Resolution)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="responsive">Responsive (currently used)</SelectItem>
                            <SelectItem value="square">Square</SelectItem>
                            <SelectItem value="landscape">Landscape</SelectItem>
                            <SelectItem value="portrait">Portrait</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between">
                    <Label htmlFor="generator-link-toggle" className="cursor-pointer">
                        Include Generator Link
                    </Label>
                    <Switch
                        id="generator-link-toggle"
                        checked={includeGeneratorLink}
                        onCheckedChange={setIncludeGeneratorLink}
                    />
                </div>

                <Button
                    onClick={handleExport}
                    disabled={!layerStore.hasLayers}
                    className="w-full"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Export HTML
                </Button>
            </CardContent>
        </Card>
    );
});

