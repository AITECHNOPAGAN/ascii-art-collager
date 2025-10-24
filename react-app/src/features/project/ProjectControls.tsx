import { observer } from 'mobx-react-lite';
import { useCanvasStore, useStores } from '@/stores';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Resolution } from '@/types';

export const ProjectControls = observer(() => {
    const stores = useStores();

    const canvasStore = useCanvasStore();


    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {/* Canvas Background Color */}
                <div className="space-y-2 pb-2 border-b">
                    <Label htmlFor="canvas-bg-color">Canvas Background</Label>
                    <Input
                        id="canvas-bg-color"
                        type="color"
                        value={stores.canvasStore.backgroundColor}
                        onChange={(e) => stores.canvasStore.setBackgroundColor(e.target.value)}
                        className="h-10 cursor-pointer"
                    />
                </div>

                <p className="text-xs text-muted-foreground text-center pt-2">
                    Your project auto-saves every minute
                </p>
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
                            <SelectItem value="responsive">Responsive</SelectItem>
                            <SelectItem value="square">Square</SelectItem>
                            <SelectItem value="landscape">Landscape</SelectItem>
                            <SelectItem value="portrait">Portrait</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
});

