import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useLayerStore } from '@/stores';
import { AsciiLayer } from '@/types';
import { latticeToHtmlWithClasses } from '@/utils/imageToAscii';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

interface AsciiEditorDialogProps {
    layer: AsciiLayer;
    open: boolean;
    onClose: () => void;
}

export const AsciiEditorDialog = observer(({ layer, open, onClose }: AsciiEditorDialogProps) => {
    const layerStore = useLayerStore();
    const [activeTab, setActiveTab] = useState<'text' | 'html'>('text');

    // Get current layer data from store - this will reactively update
    const currentLayer = layerStore.getLayerData(layer.id);
    if (!currentLayer || currentLayer.type !== 'ascii') return null;

    // Convert lattice to plain text - reactively computed from store
    const textContent = currentLayer.lattice.cells.map(row =>
        row.map(cell => cell.char).join('')
    ).join('\n');

    // Convert lattice to HTML with classes - reactively computed from store
    const htmlContent = latticeToHtmlWithClasses(currentLayer.lattice);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Update the store directly - MobX will handle reactivity
        layerStore.setLatticeFromText(layer.id, e.target.value);
    };

    const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Update the store directly - MobX will handle reactivity
        layerStore.setLatticeFromText(layer.id, e.target.value);
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
                    <DialogTitle>Edit ASCII Layer: {currentLayer.name}</DialogTitle>
                    <DialogDescription>
                        Edit as plain text or as HTML with custom classes and styles.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'text' | 'html')} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                        <TabsTrigger value="text">Plain Text</TabsTrigger>
                        <TabsTrigger value="html">HTML</TabsTrigger>
                    </TabsList>

                    <TabsContent value="text" className="flex-1 flex flex-col space-y-2 mt-0 data-[state=active]:flex data-[state=inactive]:hidden overflow-hidden">
                        <Label className="pt-4">Plain ASCII Text</Label>
                        <Textarea
                            value={textContent}
                            onChange={handleTextChange}
                            placeholder="Paste ASCII art here..."
                            className="font-mono text-sm flex-1 resize-none overflow-auto"
                            style={{ whiteSpace: 'pre', overflowWrap: 'normal' }}
                            spellCheck={false}
                            wrap="off"
                        />
                        <p className="text-xs text-muted-foreground flex-shrink-0">
                            Edit ASCII art as plain text. Each line represents a row in the lattice.
                        </p>
                    </TabsContent>

                    <TabsContent value="html" className="flex-1 flex flex-col space-y-2 mt-0 data-[state=active]:flex data-[state=inactive]:hidden overflow-hidden">
                        <Label className="pt-4">HTML with Classes & Styles</Label>
                        <Textarea
                            value={htmlContent}
                            onChange={handleHtmlChange}
                            placeholder='<span class="twinkle">☆</span>'
                            className="font-mono text-sm flex-1 resize-none overflow-auto"
                            style={{ whiteSpace: 'pre', overflowWrap: 'normal' }}
                            spellCheck={false}
                            wrap="off"
                        />
                        <p className="text-xs text-muted-foreground flex-shrink-0">
                            Use HTML spans with class names (e.g., <code className="bg-muted px-1 rounded">{'<span class="twinkle">☆</span>'}</code>)
                            and inline styles. Define CSS for classes in the Custom CSS panel.
                        </p>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4 border-t">
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

