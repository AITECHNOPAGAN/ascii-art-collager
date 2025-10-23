import { observer } from 'mobx-react-lite';
import { useLayerStore } from '@/stores';
import { Position } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const LayerControls = observer(() => {
    const layerStore = useLayerStore();
    const { editingState } = layerStore;

    if (!editingState) return null;

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
                    <Badge variant={editingState.type === 'ascii' ? 'default' : 'secondary'}>
                        {editingState.type === 'ascii' ? 'ASCII' : 'Image'}
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

                        {/* Upload Image or Text Input */}
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
                                value={editingState.lattice ? '' : ''}
                                onChange={(e) => layerStore.setLatticeFromText(editingState.id, e.target.value)}
                                placeholder="Paste colored ASCII art here..."
                                rows={4}
                                className="font-mono text-xs"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        {/* Image Layer Controls */}
                        <div className="space-y-2">
                            <Label htmlFor="image-upload">Upload Image</Label>
                            <Input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </div>
                    </>
                )}

                {/* Font Size */}
                <div className="space-y-2">
                    <Label>Font Size: {editingState.fontSize}px</Label>
                    <Slider
                        value={[editingState.fontSize]}
                        onValueChange={([value]: number[]) => layerStore.setFontSize(value)}
                        min={6}
                        max={24}
                        step={1}
                    />
                </div>

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
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Offset X */}
                <div className="space-y-2">
                    <Label>Offset X: {editingState.offsetX}px</Label>
                    <Slider
                        value={[editingState.offsetX]}
                        onValueChange={([value]: number[]) => layerStore.setOffsetX(value)}
                        min={-500}
                        max={500}
                        step={10}
                    />
                </div>

                {/* Offset Y */}
                <div className="space-y-2">
                    <Label>Offset Y: {editingState.offsetY}px</Label>
                    <Slider
                        value={[editingState.offsetY]}
                        onValueChange={([value]: number[]) => layerStore.setOffsetY(value)}
                        min={-500}
                        max={500}
                        step={10}
                    />
                </div>

                {/* Scale */}
                <div className="space-y-2">
                    <Label>Scale: {editingState.scale.toFixed(1)}x</Label>
                    <Slider
                        value={[editingState.scale]}
                        onValueChange={([value]: number[]) => layerStore.setScale(value)}
                        min={0.5}
                        max={3}
                        step={0.1}
                    />
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

                {/* Save Button */}
                <Button onClick={() => layerStore.saveCurrentLayer()} className="w-full">
                    Save Layer
                </Button>
            </CardContent>
        </Card>
    );
});
