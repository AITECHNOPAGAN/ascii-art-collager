import { useEffect, useState } from 'react';
import { StoreProvider, RootStore } from './stores';
import { LayerPanel, LayerControls } from './features/layers';
import { CanvasContainer } from './features/canvas';
import { EffectsPanel } from './features/effects';
import { ProjectControls } from './features/project';
import { EditingFooter } from './features/editing';
import { Header } from './features/header';
import { CustomStylesPanel } from './features/styles';
import { autoSaveProject, loadAutoSavedProject, loadProjectIntoStores } from './utils/projectSerializer';

const rootStore = new RootStore();

// Auto-save interval: 1 minute (60000ms)
const AUTO_SAVE_INTERVAL = 60000;

function App() {
    const [isLoading, setIsLoading] = useState(true);

    // Load auto-saved project on mount
    useEffect(() => {
        const loadSavedProject = async () => {
            try {
                const savedProject = await loadAutoSavedProject();
                if (savedProject) {
                    loadProjectIntoStores(savedProject, rootStore);
                    console.log('Auto-saved project loaded successfully');
                }
            } catch (error) {
                console.error('Failed to load auto-saved project:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSavedProject();
    }, []);

    // Auto-save every minute
    useEffect(() => {
        if (isLoading) return;

        const intervalId = setInterval(() => {
            // Only auto-save if there are layers
            if (rootStore.layerStore.layers.length > 0) {
                autoSaveProject(rootStore);
            }
        }, AUTO_SAVE_INTERVAL);

        return () => clearInterval(intervalId);
    }, [isLoading]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-foreground">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg">Loading your project...</p>
                </div>
            </div>
        );
    }

    return (
        <StoreProvider value={rootStore}>
            <div className="flex h-screen bg-background text-foreground">
                {/* Header */}
                <Header />

                {/* Left Sidebar - Controls */}
                <div className="w-80 bg-card border-r overflow-y-auto p-4 space-y-4 mt-[57px]">
                    <ProjectControls />

                    <LayerPanel />

                    <LayerControls />

                    <CustomStylesPanel />

                    <EffectsPanel />
                </div>

                {/* Main Canvas Area */}
                <div className="flex-1 p-6 pt-20 pb-20 flex items-center justify-center">
                    <CanvasContainer />
                </div>

                {/* Editing Footer */}
                <EditingFooter />
            </div>
        </StoreProvider>
    );
}

export default App;

