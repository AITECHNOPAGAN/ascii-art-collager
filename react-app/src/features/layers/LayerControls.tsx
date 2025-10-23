import { observer } from 'mobx-react-lite';
import { useLayerStore } from '@/stores';
import { convertImageToAscii, loadImageFromFile, getImageDataFromFile } from '@/utils/imageToAscii';
import { ContentType, Position } from '@/types';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const LayerControls = observer(() => {
    const layerStore = useLayerStore();
    const { editingState } = layerStore;

    if (!editingState) return null;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            if (editingState.contentType === 'hiresImage') {
                const imageData = await getImageDataFromFile(file);
                layerStore.setImageData(imageData);
            } else {
                const img = await loadImageFromFile(file);
                const asciiArt = convertImageToAscii(img);
                layerStore.setAsciiArt(asciiArt);
                layerStore.setContentType('image');
            }
        } catch (error) {
            alert('Failed to load image');
            console.error(error);
        }

        e.target.value = '';
    };

    const handleContentTypeChange = (value: string) => {
        layerStore.setContentType(value as ContentType);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Layer Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Content Type */}
                <div className="space-y-2">
                    <Label>Content Type</Label>
                    <RadioGroup value={editingState.contentType} onValueChange={handleContentTypeChange}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="image" id="type-image" />
                            <Label htmlFor="type-image" className="font-normal cursor-pointer">ASCII Image</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="hiresImage" id="type-hires" />
                            <Label htmlFor="type-hires" className="font-normal cursor-pointer">Hi-Res Image</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="text" id="type-text" />
                            <Label htmlFor="type-text" className="font-normal cursor-pointer">ASCII Text</Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Upload or Text Input */}
                {editingState.contentType === 'text' ? (
                    <div className="space-y-2">
                        <Label htmlFor="ascii-textarea">ASCII Art</Label>
                        <Textarea
                            id="ascii-textarea"
                            value={editingState.asciiArt}
                            onChange={(e) => layerStore.setAsciiArt(e.target.value)}
                            placeholder="Paste or type your ASCII art here..."
                            rows={6}
                            className="font-mono text-xs"
                        />
                    </div>
                ) : (
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

                {/* Text Color */}
                <div className="space-y-2">
                    <Label htmlFor="color-picker">Text Color</Label>
                    <Input
                        id="color-picker"
                        type="color"
                        value={editingState.color}
                        onChange={(e) => layerStore.setColor(e.target.value)}
                        className="h-10 cursor-pointer"
                    />
                </div>

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

