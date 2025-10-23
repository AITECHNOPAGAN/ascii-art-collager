import { ProjectState } from '@/types';
import { RootStore } from '@/stores';

const PROJECT_VERSION = '1.0.0';
const LOCAL_STORAGE_KEY = 'ascii-art-project';

export function serializeProject(rootStore: RootStore): ProjectState {
    return {
        version: PROJECT_VERSION,
        layers: rootStore.layerStore.layers,
        canvasResolution: rootStore.canvasStore.resolution,
        customCSS: rootStore.customStylesStore.customCSS,
        metadata: {
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            name: 'Untitled Project'
        }
    };
}

export function deserializeProject(json: string): ProjectState {
    try {
        const data = JSON.parse(json);

        // Validate structure
        if (!data.version || !data.layers || !Array.isArray(data.layers)) {
            throw new Error('Invalid project format');
        }

        return data as ProjectState;
    } catch (error) {
        throw new Error(`Failed to parse project: ${error}`);
    }
}

export function saveToLocalStorage(rootStore: RootStore): void {
    try {
        const projectState = serializeProject(rootStore);
        const json = JSON.stringify(projectState);
        localStorage.setItem(LOCAL_STORAGE_KEY, json);
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        throw error;
    }
}

export function loadFromLocalStorage(): ProjectState | null {
    try {
        const json = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!json) return null;

        return deserializeProject(json);
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return null;
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
                const projectState = deserializeProject(json);
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

        // Load layers
        rootStore.layerStore.loadFromJSON({
            layers: projectState.layers,
            nextLayerId: Math.max(...projectState.layers.map(l => l.id), 0) + 1
        });

        // Load custom CSS if present
        if (projectState.customCSS !== undefined) {
            rootStore.customStylesStore.loadFromJSON({ customCSS: projectState.customCSS });
        }
    } catch (error) {
        console.error('Failed to load project into stores:', error);
        throw error;
    }
}

