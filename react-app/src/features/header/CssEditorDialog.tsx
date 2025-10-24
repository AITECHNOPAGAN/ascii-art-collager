import { observer } from 'mobx-react-lite';
import { useCustomStylesStore } from '@/stores';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface CssEditorDialogProps {
    open: boolean;
    onClose: () => void;
}

export const CssEditorDialog = observer(({ open, onClose }: CssEditorDialogProps) => {
    const customStylesStore = useCustomStylesStore();

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-4">
                <DialogHeader>
                    <DialogTitle>Custom CSS</DialogTitle>
                    <DialogDescription>
                        Define styles for custom classes used in your ASCII art.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
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
                            Use HTML spans with class attributes like:
                        </p>
                        <pre className="text-xs bg-muted p-2 rounded-none overflow-x-auto">
                            {`<span class="twinkle">☆</span>`}
                        </pre>
                        <p className="text-xs text-muted-foreground">
                            Styles update in real-time on the canvas.
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => customStylesStore.resetToDefault()}
                        className="gap-2"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                    </Button>
                    <Button onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
});
