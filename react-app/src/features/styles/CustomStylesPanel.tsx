import { observer } from 'mobx-react-lite';
import { useCustomStylesStore } from '@/stores';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export const CustomStylesPanel = observer(() => {
    const customStylesStore = useCustomStylesStore();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Custom CSS</CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => customStylesStore.resetToDefault()}
                        title="Reset to default"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="custom-css-editor">CSS Rules</Label>
                    <Textarea
                        id="custom-css-editor"
                        value={customStylesStore.customCSS}
                        onChange={(e) => customStylesStore.setCustomCSS(e.target.value)}
                        placeholder="Enter custom CSS for class names..."
                        rows={12}
                        className="font-mono text-xs"
                        spellCheck={false}
                    />
                </div>

                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Define styles for custom classes used in your ASCII art.
                        Use HTML spans with class attributes like:
                    </p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {`<span class="twinkle">☆</span>`}
                    </pre>
                    <p className="text-xs text-muted-foreground">
                        Styles update in real-time on the canvas.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
});

