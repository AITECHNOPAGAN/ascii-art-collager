import { ProjectState } from '@/types';
import { RootStore } from '@/stores';
import localforage from 'localforage';

const PROJECT_VERSION = '1.0.0';
const DB_KEY = 'ascii-art-project-autosave';

// Configure localforage to use IndexedDB
localforage.config({
    driver: localforage.INDEXEDDB,
    name: 'AsciiArtDB',
    version: 1.0,
    storeName: 'projects',
    description: 'ASCII Art Project Storage'
});

export function serializeProject(rootStore: RootStore): ProjectState {
    return {
        version: PROJECT_VERSION,
        layers: rootStore.layerStore.layers,
        canvasResolution: rootStore.canvasStore.resolution,
        customResolution: rootStore.canvasStore.resolution === 'custom'
            ? rootStore.canvasStore.customResolution
            : undefined,
        canvasBackgroundColor: rootStore.canvasStore.backgroundColor,
        customCSS: rootStore.customStylesStore.customCSS,
        parallaxEnabled: rootStore.effectsStore.parallaxEnabled,
        metadata: {
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            name: 'Untitled Project'
        }
    };
}

export function deserializeProject(data: any): ProjectState {
    try {
        // Validate structure
        if (!data.version || !data.layers || !Array.isArray(data.layers)) {
            throw new Error('Invalid project format');
        }

        return data as ProjectState;
    } catch (error) {
        throw new Error(`Failed to parse project: ${error}`);
    }
}

/**
 * Auto-save project to IndexedDB (asynchronous, non-blocking)
 */
export async function autoSaveProject(rootStore: RootStore): Promise<void> {
    try {
        const projectState = serializeProject(rootStore);
        projectState.metadata.modifiedAt = new Date().toISOString();

        // Convert to JSON and back to create a plain object (remove MobX observables)
        const plainData = JSON.parse(JSON.stringify(projectState));

        await localforage.setItem(DB_KEY, plainData);
        console.log('Project auto-saved at', new Date().toLocaleTimeString());
    } catch (error) {
        console.error('Failed to auto-save project:', error);
        // Don't throw - auto-save should be silent
    }
}

/**
 * Load project from IndexedDB (asynchronous)
 */
export async function loadAutoSavedProject(): Promise<ProjectState | null> {
    try {
        const data = await localforage.getItem<ProjectState>(DB_KEY);
        if (!data) return null;

        return deserializeProject(data);
    } catch (error) {
        console.error('Failed to load auto-saved project:', error);
        return null;
    }
}

/**
 * Clear auto-saved project from IndexedDB
 */
export async function clearAutoSavedProject(): Promise<void> {
    try {
        await localforage.removeItem(DB_KEY);
    } catch (error) {
        console.error('Failed to clear auto-saved project:', error);
    }
}

export function downloadProjectFile(rootStore: RootStore, filename: string = 'project.json'): void {
    try {
        const projectState = serializeProject(rootStore);
        projectState.metadata.modifiedAt = new Date().toISOString();

        const json = JSON.stringify(projectState, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Failed to download project file:', error);
        throw error;
    }
}

export function loadProjectFile(file: File): Promise<ProjectState> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const json = e.target?.result as string;
                const data = JSON.parse(json);
                const projectState = deserializeProject(data);
                resolve(projectState);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

export function loadProjectIntoStores(projectState: ProjectState, rootStore: RootStore): void {
    try {
        // Load canvas settings
        rootStore.canvasStore.setResolution(projectState.canvasResolution);

        // Load custom resolution if present
        if (projectState.customResolution !== undefined) {
            rootStore.canvasStore.setCustomResolution(projectState.customResolution);
        }

        // Load canvas background color (with default fallback for older projects)
        if (projectState.canvasBackgroundColor !== undefined) {
            rootStore.canvasStore.setBackgroundColor(projectState.canvasBackgroundColor);
        }

        // Load layers
        rootStore.layerStore.loadFromJSON({
            layers: projectState.layers,
            nextLayerId: Math.max(...projectState.layers.map(l => l.id), 0) + 1
        });

        // Load custom CSS if present
        if (projectState.customCSS !== undefined) {
            rootStore.customStylesStore.loadFromJSON({ customCSS: projectState.customCSS });
        }

        // Load parallax effect if present
        if (projectState.parallaxEnabled !== undefined) {
            rootStore.effectsStore.loadFromJSON({ parallaxEnabled: projectState.parallaxEnabled });
        }
    } catch (error) {
        console.error('Failed to load project into stores:', error);
        throw error;
    }
}

