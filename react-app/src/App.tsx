import { StoreProvider, RootStore } from './stores';
import { LayerPanel, LayerControls } from './features/layers';
import { CanvasContainer } from './features/canvas';
import { EffectsPanel } from './features/effects';
import { ExportPanel } from './features/export';
import { ProjectControls } from './features/project';
import { EditingToolbar } from './features/editing';
import { CustomStylesPanel } from './features/styles';

const rootStore = new RootStore();

function App() {
    return (
        <StoreProvider value={rootStore}>
            <div className="flex h-screen bg-background text-foreground">
                {/* Left Sidebar - Controls */}
                <div className="w-80 bg-card border-r overflow-y-auto p-4 space-y-4">
                    <h1 className="text-2xl font-bold mb-4">ASCII Art Generator</h1>

                    <ProjectControls />

                    <LayerPanel />

                    <LayerControls />

                    <EditingToolbar />

                    <CustomStylesPanel />

                    <EffectsPanel />

                    <ExportPanel />
                </div>

                {/* Main Canvas Area */}
                <div className="flex-1 p-6">
                    <CanvasContainer />
                </div>
            </div>
        </StoreProvider>
    );
}

export default App;

