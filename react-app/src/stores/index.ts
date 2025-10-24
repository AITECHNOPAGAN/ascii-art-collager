import { LayerStore } from './LayerStore';
import { CanvasStore } from './CanvasStore';
import { EffectsStore } from './EffectsStore';
import { EditingStore } from './EditingStore';
import { CustomStylesStore } from './CustomStylesStore';
import { SettingsStore } from './SettingsStore';
import { createContext, useContext } from 'react';

export class RootStore {
    layerStore: LayerStore;
    canvasStore: CanvasStore;
    effectsStore: EffectsStore;
    editingStore: EditingStore;
    customStylesStore: CustomStylesStore;
    settingsStore: SettingsStore;

    constructor() {
        this.layerStore = new LayerStore();
        this.canvasStore = new CanvasStore();
        this.effectsStore = new EffectsStore();
        this.editingStore = new EditingStore();
        this.customStylesStore = new CustomStylesStore();
        this.settingsStore = new SettingsStore();
    }
}

const StoreContext = createContext<RootStore | null>(null);

export const StoreProvider = StoreContext.Provider;

export const useStores = () => {
    const store = useContext(StoreContext);
    if (!store) {
        throw new Error('useStores must be used within a StoreProvider');
    }
    return store;
};

export const useLayerStore = () => useStores().layerStore;
export const useCanvasStore = () => useStores().canvasStore;
export const useEffectsStore = () => useStores().effectsStore;
export const useEditingStore = () => useStores().editingStore;
export const useCustomStylesStore = () => useStores().customStylesStore;
export const useSettingsStore = () => useStores().settingsStore;

