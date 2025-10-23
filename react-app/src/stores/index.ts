import { LayerStore } from './LayerStore';
import { CanvasStore } from './CanvasStore';
import { EffectsStore } from './EffectsStore';
import { createContext, useContext } from 'react';

export class RootStore {
    layerStore: LayerStore;
    canvasStore: CanvasStore;
    effectsStore: EffectsStore;

    constructor() {
        this.layerStore = new LayerStore();
        this.canvasStore = new CanvasStore();
        this.effectsStore = new EffectsStore();
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

