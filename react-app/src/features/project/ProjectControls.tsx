import { observer } from 'mobx-react-lite';
import { useStores } from '@/stores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Download, Upload } from 'lucide-react';
import { downloadProjectFile, loadProjectFile, loadProjectIntoStores } from '@/utils/projectSerializer';
import { useRef } from 'react';

export const ProjectControls = observer(() => {
    const stores = useStores();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownload = () => {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            downloadProjectFile(stores, `ascii-art-${timestamp}.json`);
        } catch (error) {
            alert('Failed to download project file');
            console.error(error);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const projectState = await loadProjectFile(file);

            if (stores.layerStore.hasUnsavedChanges) {
                const confirm = window.confirm('You have unsaved changes. Loading a project will discard them. Continue?');
                if (!confirm) return;
            }

            loadProjectIntoStores(projectState, stores);
            alert('Project loaded successfully!');
        } catch (error) {
            alert('Failed to load project file');
            console.error(error);
        }

        e.target.value = '';
    };

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

                <Button onClick={handleDownload} className="w-full" variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Export Project
                </Button>

                <Button onClick={() => fileInputRef.current?.click()} className="w-full" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Import Project
                </Button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                <p className="text-xs text-muted-foreground text-center pt-2">
                    Your project auto-saves every minute
                </p>
            </CardContent>
        </Card>
    );
});

