import { observer } from 'mobx-react-lite';
import { useLayerStore, useSettingsStore } from '@/stores';
import { Position } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { HtmlEditorDialog } from '@/features/editing';
import { useState } from 'react';

export const LayerControls = observer(() => {
    const layerStore = useLayerStore();
    const settingsStore = useSettingsStore();
    const { editingState } = layerStore;
    const [htmlEditorOpen, setHtmlEditorOpen] = useState(false);

    if (!editingState) return null;

    const autoSaveSetting = settingsStore.getSetting('auto-save-on-layer-change');
    const showSaveButton = autoSaveSetting !== 'always-save';

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingState) return;

        try {
            if (editingState.type === 'ascii') {
                await layerStore.setLatticeFromImage(editingState.id, file);
            } else if (editingState.type === 'image') {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageData = event.target?.result as string;
                    layerStore.setImageData(editingState.id, imageData);
                };
                reader.readAsDataURL(file);
            }
        } catch (error) {
            alert('Failed to load image');
            console.error(error);
        }

        e.target.value = '';
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Layer Settings</CardTitle>
                    <Badge variant={editingState.type === 'ascii' ? 'default' : editingState.type === 'html' ? 'outline' : 'secondary'}>
                        {editingState.type === 'ascii' ? 'ASCII' : editingState.type === 'html' ? 'HTML' : 'Image'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Layer Type Specific Controls */}
                {editingState.type === 'ascii' ? (
                    <>
                        {/* Resolution Control */}
                        <div className="space-y-2">
                            <Label>
                                Resolution: {editingState.resolution} chars
                                {editingState.lattice && ` (${editingState.lattice.width}×${editingState.lattice.height})`}
                            </Label>
                            <Slider
                                value={[editingState.resolution]}
                                onValueChange={([value]: number[]) => {
                                    // Only allow changes if there's an original image
                                    if (!editingState.originalImage) return;
                                    layerStore.setLatticeResolution(editingState.id, value);
                                }}
                                min={20}
                                max={200}
                                step={10}
                                disabled={!editingState.originalImage}
                            />
                            {!editingState.originalImage && (
                                <p className="text-xs text-muted-foreground italic">
                                    Resolution control is only available for image-to-ASCII conversion. Upload an image to enable.
                                </p>
                            )}
                        </div>

                        {/* Upload Image or Text Input - Only show if layer is empty */}
                        {!editingState.lattice?.cells?.length && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="image-upload">Upload Image</Label>
                                    <Input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ascii-textarea">Or Paste ASCII Art</Label>
                                    <Textarea
                                        id="ascii-textarea"
                                        value=""
                                        onChange={(e) => layerStore.setLatticeFromText(editingState.id, e.target.value)}
                                        placeholder="Paste colored ASCII art here..."
                                        rows={4}
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </>
                        )}
                    </>
                ) : editingState.type === 'html' ? (
                    <>
                        {/* HTML Layer Controls */}
                        <div className="space-y-2">
                            <Label>Dimensions</Label>
                            <div className="text-sm text-muted-foreground">
                                Width: {editingState.width === 'auto' ? 'auto' : `${editingState.width}px`},
                                Height: {editingState.height === 'auto' ? 'auto' : `${editingState.height}px`}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Overflow</Label>
                            <div className="text-sm text-muted-foreground capitalize">
                                {editingState.overflow.replace('-', ' ')}
                            </div>
                        </div>
                        <Button onClick={() => setHtmlEditorOpen(true)} className="w-full">
                            Edit HTML
                        </Button>
                    </>
                ) : (
                    <>
                        {/* Image Layer Controls - Only show upload if no image exists */}
                        {!editingState.imageData && (
                            <div className="space-y-2">
                                <Label htmlFor="image-upload">Upload Image</Label>
                                <Input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Position */}
                <div className="space-y-2">
                    <Label>Anchor Position</Label>
                    <Select value={editingState.position} onValueChange={(value: string) => layerStore.setPosition(value as Position)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="top-left">Top Left</SelectItem>
                            <SelectItem value="top-center">Top Center</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="center-left">Center Left</SelectItem>
                            <SelectItem value="center-right">Center Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="bottom-center">Bottom Center</SelectItem>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Parallax Strength */}
                <div className="space-y-2">
                    <Label>Parallax Strength: {editingState.parallaxStrength.toFixed(1)}</Label>
                    <Slider
                        value={[editingState.parallaxStrength]}
                        onValueChange={([value]: number[]) => layerStore.setParallaxStrength(value)}
                        min={0}
                        max={1}
                        step={0.1}
                    />
                </div>

                {/* Pointer Events Toggle - Only for ASCII and Image layers */}
                {(editingState.type === 'ascii' || editingState.type === 'image') && (
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="pointer-events">Capture Pointer Events</Label>
                            <p className="text-xs text-muted-foreground">
                                Enable if layer needs to be clickable/interactive
                            </p>
                        </div>
                        <Switch
                            id="pointer-events"
                            checked={editingState.enablePointerEvents ?? false}
                            onCheckedChange={(checked: boolean) => layerStore.setEnablePointerEvents(checked)}
                        />
                    </div>
                )}

                {/* Save Button - Only show if auto-save is not set to always-save */}
                {showSaveButton && (
                    <Button onClick={() => layerStore.saveCurrentLayer()} className="w-full">
                        Save Layer
                    </Button>
                )}
            </CardContent>

            {/* HTML Editor Dialog */}
            {editingState.type === 'html' && (
                <HtmlEditorDialog
                    layer={editingState}
                    open={htmlEditorOpen}
                    onClose={() => setHtmlEditorOpen(false)}
                />
            )}
        </Card>
    );
});
