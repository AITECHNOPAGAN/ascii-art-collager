import { observer } from 'mobx-react-lite';
import { useState, useRef } from 'react';
import { useStores } from '@/stores';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Upload, FileCode, Settings, Menu } from 'lucide-react';
import { downloadProjectFile, loadProjectFile, loadProjectIntoStores } from '@/utils/projectSerializer';
import { generateExportHTML, downloadFile } from '@/utils/htmlExporter';
import { SettingsDialog } from './SettingsDialog';

export const Header = observer(() => {
    const stores = useStores();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);

    const handleExportProject = () => {
        try {
            // Auto-save any unsaved changes before exporting
            if (stores.layerStore.hasUnsavedChanges && stores.layerStore.activeLayerId && stores.layerStore.editingState) {
                stores.layerStore.saveCurrentLayer();
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            downloadProjectFile(stores, `ascii-art-${timestamp}.json`);
        } catch (error) {
            alert('Failed to export project file');
            console.error(error);
        }
    };

    const handleImportProject = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const projectState = await loadProjectFile(file);

            if (stores.layerStore.hasUnsavedChanges) {
                const confirm = window.confirm(
                    'You have unsaved changes. Loading a project will discard them. Continue?'
                );
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

    const handleExportHTML = () => {
        try {
            if (!stores.layerStore.hasLayers) {
                alert('Please create and add content to at least one layer before exporting to HTML.');
                return;
            }

            // Auto-save any unsaved changes before exporting
            if (stores.layerStore.hasUnsavedChanges && stores.layerStore.activeLayerId && stores.layerStore.editingState) {
                stores.layerStore.saveCurrentLayer();
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const html = generateExportHTML(stores.layerStore.layers, {
                resolution: stores.canvasStore.resolution,
                backgroundColor: stores.canvasStore.backgroundColor,
                parallaxEnabled: stores.effectsStore.parallaxEnabled,
                includeGeneratorLink: stores.settingsStore.getSetting('include-generator-link'),
            });

            if (!html) {
                alert('No visible layers with content to export.');
                return;
            }

            downloadFile(html, `ascii-art-${timestamp}.html`);
        } catch (error) {
            alert('Failed to export to HTML');
            console.error(error);
        }
    };

    return (
        <>
            <div className="fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-b shadow-lg z-50">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold hidden sm:block">ASCII Art Generator</h1>
                        <h1 className="text-xl font-bold sm:hidden">ASCII Art</h1>

                        {/* Project Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Menu className="h-4 w-4" />
                                    <span className="hidden sm:inline">Project</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                                <DropdownMenuItem onClick={handleExportProject}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Export Project (.json)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleImportProject}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Import Project (.json)
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleExportHTML}>
                                    <FileCode className="mr-2 h-4 w-4" />
                                    Export to HTML
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Settings Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSettingsDialog(true)}
                        className="gap-2"
                    >
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Settings</span>
                    </Button>
                </div>
            </div>

            {/* Settings Dialog */}
            <SettingsDialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)} />
        </>
    );
});

