import { makeAutoObservable } from 'mobx';
import { Layer, ContentType, Position } from '@/types';

export class LayerStore {
    layers: Layer[] = [];
    activeLayerId: number | null = null;
    editingState: Layer | null = null;
    hasUnsavedChanges = false;
    nextLayerId = 1;

    constructor() {
        makeAutoObservable(this);
    }

    createNewLayer = () => {
        // Check for unsaved changes before creating new layer
        if (this.hasUnsavedChanges) {
            if (!this.promptSaveChanges()) {
                return;
            }
        }

        const layer: Layer = {
            id: this.nextLayerId++,
            name: `Layer ${this.nextLayerId - 1}`,
            asciiArt: '',
            imageData: null,
            contentType: 'image',
            position: 'center',
            offsetX: 0,
            offsetY: 0,
            scale: 1,
            fontSize: 12,
            color: '#000000',
            zIndex: this.layers.length + 2,
            visibility: true,
            parallaxStrength: 0.3 + (this.layers.length * 0.1)
        };

        this.layers.push(layer);
        this.activeLayerId = layer.id;
        this.editingState = { ...layer };
        this.hasUnsavedChanges = false;
    };

    setActiveLayer = (layerId: number) => {
        // Check for unsaved changes before switching
        if (this.hasUnsavedChanges && this.activeLayerId !== layerId) {
            if (!this.promptSaveChanges()) {
                return;
            }
        }

        this.activeLayerId = layerId;

        // Initialize editingState with the new active layer
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            this.editingState = { ...layer };
            this.hasUnsavedChanges = false;
        }
    };

    saveCurrentLayer = () => {
        if (!this.editingState || !this.activeLayerId) return;

        const layer = this.layers.find(l => l.id === this.activeLayerId);
        if (!layer) return;

        // Copy editingState to the layer
        Object.assign(layer, this.editingState);

        this.hasUnsavedChanges = false;
    };

    promptSaveChanges = (): boolean => {
        const result = confirm('You have unsaved changes. Do you want to save them?\n\nOK = Save changes\nCancel = Discard changes');

        if (result) {
            // User clicked OK - save changes
            this.saveCurrentLayer();
        } else {
            // User clicked Cancel - discard changes
            this.hasUnsavedChanges = false;
        }

        return true; // Always proceed with the action
    };

    deleteLayer = (layerId: number) => {
        // Check for unsaved changes if deleting active layer
        if (layerId === this.activeLayerId && this.hasUnsavedChanges) {
            const result = confirm('This layer has unsaved changes. Are you sure you want to delete it?');
            if (!result) return;
        } else {
            const confirmDelete = confirm('Are you sure you want to delete this layer?');
            if (!confirmDelete) return;
        }

        this.layers = this.layers.filter(l => l.id !== layerId);
        if (this.activeLayerId === layerId) {
            this.activeLayerId = this.layers.length > 0 ? this.layers[this.layers.length - 1].id : null;
            this.editingState = null;
            this.hasUnsavedChanges = false;

            // Load editingState for the new active layer
            if (this.activeLayerId) {
                const newActiveLayer = this.layers.find(l => l.id === this.activeLayerId);
                if (newActiveLayer) {
                    this.editingState = { ...newActiveLayer };
                }
            }
        }
    };

    toggleLayerVisibility = (layerId: number) => {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            layer.visibility = !layer.visibility;
        }
    };

    moveLayerUp = (layerId: number) => {
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index < this.layers.length - 1) {
            const temp = this.layers[index].zIndex;
            this.layers[index].zIndex = this.layers[index + 1].zIndex;
            this.layers[index + 1].zIndex = temp;

            [this.layers[index], this.layers[index + 1]] = [this.layers[index + 1], this.layers[index]];
        }
    };

    moveLayerDown = (layerId: number) => {
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index > 0) {
            const temp = this.layers[index].zIndex;
            this.layers[index].zIndex = this.layers[index - 1].zIndex;
            this.layers[index - 1].zIndex = temp;

            [this.layers[index], this.layers[index - 1]] = [this.layers[index - 1], this.layers[index]];
        }
    };

    // Editing state updates
    updateEditingState = (updates: Partial<Layer>) => {
        if (!this.editingState) return;
        this.editingState = { ...this.editingState, ...updates };
        this.hasUnsavedChanges = true;
    };

    setContentType = (contentType: ContentType) => {
        this.updateEditingState({ contentType });
    };

    setAsciiArt = (asciiArt: string) => {
        this.updateEditingState({ asciiArt });
    };

    setImageData = (imageData: string) => {
        this.updateEditingState({ imageData });
    };

    setColor = (color: string) => {
        this.updateEditingState({ color });
    };

    setFontSize = (fontSize: number) => {
        this.updateEditingState({ fontSize });
    };

    setPosition = (position: Position) => {
        this.updateEditingState({ position });
    };

    setOffsetX = (offsetX: number) => {
        this.updateEditingState({ offsetX });
    };

    setOffsetY = (offsetY: number) => {
        this.updateEditingState({ offsetY });
    };

    setScale = (scale: number) => {
        this.updateEditingState({ scale });
    };

    setParallaxStrength = (parallaxStrength: number) => {
        this.updateEditingState({ parallaxStrength });
    };

    // Getters
    get activeLayer(): Layer | undefined {
        return this.layers.find(l => l.id === this.activeLayerId);
    }

    get hasLayers(): boolean {
        return this.layers.length > 0 && this.layers.some(l => l.asciiArt || l.imageData);
    }

    getLayerData = (layerId: number): Layer | undefined => {
        const layer = this.layers.find(l => l.id === layerId);
        if (!layer) return undefined;

        // Use editingState for active layer, saved layer for others
        return (layer.id === this.activeLayerId && this.editingState) ? this.editingState : layer;
    };
}

