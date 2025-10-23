import { observer } from 'mobx-react-lite';
import { useStores } from '@/stores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, Save } from 'lucide-react';
import { downloadProjectFile, loadProjectFile, loadProjectIntoStores, saveToLocalStorage } from '@/utils/projectSerializer';
import { useRef } from 'react';

export const ProjectControls = observer(() => {
    const stores = useStores();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveToLocalStorage = () => {
        try {
            saveToLocalStorage(stores);
            alert('Project saved successfully!');
        } catch (error) {
            alert('Failed to save project');
            console.error(error);
        }
    };

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
                <Button onClick={handleSaveToLocalStorage} className="w-full" variant="outline">
                    <Save className="mr-2 h-4 w-4" />
                    Save to Browser
                </Button>

                <Button onClick={handleDownload} className="w-full" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download Project
                </Button>

                <Button onClick={() => fileInputRef.current?.click()} className="w-full" variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Load Project
                </Button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
            </CardContent>
        </Card>
    );
});

