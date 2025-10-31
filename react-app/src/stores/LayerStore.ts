import { makeAutoObservable } from 'mobx';
import { Layer, AsciiLayer, ImageLayer, HtmlLayer, Position, CharacterCell, OverflowType } from '@/types';
import { convertImageToAscii, parseColoredAscii, loadImageFromFile } from '@/utils/imageToAscii';

export class LayerStore {
    layers: Layer[] = [];
    activeLayerId: number | null = null;
    editingState: Layer | null = null;
    hasUnsavedChanges = false;
    nextLayerId = 1;
    pendingLayerSwitch: number | null = null; // Track pending layer switch for dialog

    constructor() {
        makeAutoObservable(this);

        // One-time migration: Check for incorrect localStorage values and fix them
        const savedPreference = localStorage.getItem('layer-autosave-preference');
        if (savedPreference && savedPreference !== 'always-save' && savedPreference !== 'never-save') {
            // Invalid value found, clear it
            localStorage.removeItem('layer-autosave-preference');
            console.warn('Invalid layer-autosave-preference value found and cleared:', savedPreference);
        }
    }

    // Layer creation
    createNewAsciiLayer = (resolution: number = 100) => {
        if (this.hasUnsavedChanges && !this.promptSaveChanges()) {
            return;
        }

        const layer: AsciiLayer = {
            id: this.nextLayerId++,
            name: `ASCII Layer ${this.nextLayerId - 1}`,
            type: 'ascii',
            lattice: {
                width: 0,
                height: 0,
                cells: []
            },
            resolution,
            position: 'center',
            offsetX: 0,
            offsetY: 0,
            scale: 1,
            fontSize: 12,
            zIndex: this.layers.length + 2,
            visibility: true,
            parallaxStrength: 0.3 + (this.layers.length * 0.1)
        };

        this.layers.push(layer);
        this.activeLayerId = layer.id;
        this.editingState = { ...layer, lattice: { ...layer.lattice, cells: [] } };
        this.hasUnsavedChanges = false;
    };

    createNewImageLayer = () => {
        if (this.hasUnsavedChanges && !this.promptSaveChanges()) {
            return;
        }

        const layer: ImageLayer = {
            id: this.nextLayerId++,
            name: `Image Layer ${this.nextLayerId - 1}`,
            type: 'image',
            imageData: '',
            position: 'center',
            offsetX: 0,
            offsetY: 0,
            scale: 1,
            fontSize: 12,
            zIndex: this.layers.length + 2,
            visibility: true,
            parallaxStrength: 0.3 + (this.layers.length * 0.1)
        };

        this.layers.push(layer);
        this.activeLayerId = layer.id;
        this.editingState = { ...layer };
        this.hasUnsavedChanges = false;
    };

    createNewHtmlLayer = () => {
        if (this.hasUnsavedChanges && !this.promptSaveChanges()) {
            return;
        }

        const layer: HtmlLayer = {
            id: this.nextLayerId++,
            name: `HTML Layer ${this.nextLayerId - 1}`,
            type: 'html',
            htmlContent: '<div style="color: white; font-size: 24px; padding: 20px;">HTML Content</div>',
            width: 'auto', // 'auto' will stretch to 100% of canvas
            height: 'auto', // 'auto' will stretch to 100% of canvas
            overflow: 'scroll-y', // Enable vertical scrolling by default
            position: 'center',
            offsetX: 0,
            offsetY: 0,
            scale: 1,
            fontSize: 12,
            zIndex: this.layers.length + 2,
            visibility: true,
            parallaxStrength: 0.3 + (this.layers.length * 0.1)
        };

        this.layers.push(layer);
        this.activeLayerId = layer.id;
        this.editingState = { ...layer };
        this.hasUnsavedChanges = false;
    };

    // ASCII layer methods
    setLatticeFromImage = async (layerId: number, file: File, resolution?: number) => {
        const layer = this.layers.find(l => l.id === layerId);
        if (!layer || layer.type !== 'ascii') return;

        try {
            const img = await loadImageFromFile(file);
            const imageDataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(file);
            });

            const lattice = convertImageToAscii(img, resolution || layer.resolution);

            if (this.editingState?.id === layerId && this.editingState.type === 'ascii') {
                this.editingState.lattice = lattice;
                this.editingState.originalImage = imageDataUrl;
                this.hasUnsavedChanges = true;
            }
        } catch (error) {
            console.error('Failed to convert image to ASCII:', error);
            throw error;
        }
    };

    setLatticeFromText = (layerId: number, text: string) => {
        const layer = this.layers.find(l => l.id === layerId);
        if (!layer || layer.type !== 'ascii') return;

        const lattice = parseColoredAscii(text);

        if (this.editingState?.id === layerId && this.editingState.type === 'ascii') {
            this.editingState.lattice = lattice;
            // Clear originalImage when pasting text, so resolution slider gets disabled
            this.editingState.originalImage = undefined;
            this.hasUnsavedChanges = true;
        }
    };

    updateLatticeCell = (layerId: number, x: number, y: number, updates: Partial<CharacterCell>) => {
        // Update editingState if this is the active layer
        if (this.editingState?.id === layerId && this.editingState.type === 'ascii') {
            if (y < 0 || y >= this.editingState.lattice.height || x < 0 || x >= this.editingState.lattice.width) return;

            this.editingState.lattice.cells[y][x] = {
                ...this.editingState.lattice.cells[y][x],
                ...updates
            };
            this.hasUnsavedChanges = true;
            return;
        }

        // Fallback to updating main layers (for non-active layers)
        const layer = this.layers.find(l => l.id === layerId);
        if (!layer || layer.type !== 'ascii') return;

        if (y < 0 || y >= layer.lattice.height || x < 0 || x >= layer.lattice.width) return;

        layer.lattice.cells[y][x] = {
            ...layer.lattice.cells[y][x],
            ...updates
        };
    };

    eraseLatticeCell = (layerId: number, x: number, y: number) => {
        this.updateLatticeCell(layerId, x, y, {
            char: ' ',
            textColor: '#000000',
            bgColor: 'transparent',
            alpha: 0
        });
    };

    setLatticeResolution = async (layerId: number, resolution: number) => {
        // Check editingState first since that's where active changes are
        if (this.editingState?.id !== layerId || this.editingState.type !== 'ascii') {
            return;
        }

        // Now TypeScript knows editingState is AsciiLayer
        const asciiEditingState = this.editingState;

        if (!asciiEditingState.originalImage) {
            return;
        }

        try {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.src = asciiEditingState.originalImage!;
            });

            const newLattice = convertImageToAscii(img, resolution);

            if (this.editingState?.id === layerId && this.editingState.type === 'ascii') {
                this.editingState.resolution = resolution;
                this.editingState.lattice = newLattice;
                this.hasUnsavedChanges = true;
            }
        } catch (error) {
            console.error('Failed to regenerate lattice:', error);
        }
    };

    // Image layer methods
    setImageData = (layerId: number, imageData: string) => {
        const layer = this.layers.find(l => l.id === layerId);
        if (!layer || layer.type !== 'image') return;

        if (this.editingState?.id === layerId && this.editingState.type === 'image') {
            this.editingState.imageData = imageData;
            this.hasUnsavedChanges = true;
        }
    };

    setEditedPixels = (layerId: number, editedPixels: string) => {
        const layer = this.layers.find(l => l.id === layerId);
        if (!layer || layer.type !== 'image') return;

        if (this.editingState?.id === layerId && this.editingState.type === 'image') {
            this.editingState.editedPixels = editedPixels;
            this.hasUnsavedChanges = true;
        }
    };

    // HTML layer methods
    setHtmlContent = (layerId: number, htmlContent: string) => {
        const layer = this.layers.find(l => l.id === layerId);
        if (!layer || layer.type !== 'html') return;

        if (this.editingState?.id === layerId && this.editingState.type === 'html') {
            this.editingState.htmlContent = htmlContent;
            this.hasUnsavedChanges = true;
        }
    };

    setHtmlDimensions = (layerId: number, width: number | 'auto', height: number | 'auto') => {
        const layer = this.layers.find(l => l.id === layerId);
        if (!layer || layer.type !== 'html') return;

        if (this.editingState?.id === layerId && this.editingState.type === 'html') {
            this.editingState.width = width;
            this.editingState.height = height;
            this.hasUnsavedChanges = true;
        }
    };

    setHtmlOverflow = (layerId: number, overflow: OverflowType) => {
        const layer = this.layers.find(l => l.id === layerId);
        if (!layer || layer.type !== 'html') return;

        if (this.editingState?.id === layerId && this.editingState.type === 'html') {
            this.editingState.overflow = overflow;
            this.hasUnsavedChanges = true;
        }
    };

    // Layer management
    setActiveLayer = (layerId: number) => {
        if (this.hasUnsavedChanges && this.activeLayerId !== layerId) {
            // Check for saved preference
            const savedPreference = localStorage.getItem('layer-autosave-preference');

            if (savedPreference === 'always-save') {
                // Auto-save without prompting
                this.saveCurrentLayer();
            } else if (savedPreference === 'never-save') {
                // Discard changes without prompting
                this.hasUnsavedChanges = false;
            } else {
                // No saved preference, need to show dialog
                this.pendingLayerSwitch = layerId;
                return; // Don't switch yet, wait for dialog response
            }
        }

        this.activeLayerId = layerId;

        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            // Deep copy to avoid reference issues
            if (layer.type === 'ascii') {
                this.editingState = {
                    ...layer,
                    lattice: {
                        ...layer.lattice,
                        cells: layer.lattice.cells.map(row => row.map(cell => ({ ...cell })))
                    }
                };
            } else if (layer.type === 'html') {
                this.editingState = { ...layer };
            } else {
                this.editingState = { ...layer };
            }
            this.hasUnsavedChanges = false;
        }
        this.pendingLayerSwitch = null;
    };

    // Handle dialog response for pending layer switch
    confirmLayerSwitch = (shouldSave: boolean) => {
        if (this.pendingLayerSwitch === null) return;

        if (shouldSave) {
            this.saveCurrentLayer();
        } else {
            this.hasUnsavedChanges = false;
        }

        // Now complete the layer switch
        const layerId = this.pendingLayerSwitch;
        this.pendingLayerSwitch = null;
        this.setActiveLayer(layerId);
    };

    // Cancel pending layer switch
    cancelLayerSwitch = () => {
        this.pendingLayerSwitch = null;
    };

    // Reset auto-save preference
    resetAutoSavePreference = () => {
        localStorage.removeItem('layer-autosave-preference');
    };

    saveCurrentLayer = () => {
        if (!this.editingState || !this.activeLayerId) return;

        const layerIndex = this.layers.findIndex(l => l.id === this.activeLayerId);
        if (layerIndex === -1) return;

        // Deep copy editingState to layer
        if (this.editingState.type === 'ascii') {
            this.layers[layerIndex] = {
                ...this.editingState,
                lattice: {
                    ...this.editingState.lattice,
                    cells: this.editingState.lattice.cells.map(row => row.map(cell => ({ ...cell })))
                }
            };
        } else {
            this.layers[layerIndex] = { ...this.editingState };
        }

        this.hasUnsavedChanges = false;
    };

    promptSaveChanges = (): boolean => {
        // Check for saved preference
        const savedPreference = localStorage.getItem('layer-autosave-preference');

        if (savedPreference === 'always-save') {
            // Auto-save without prompting
            this.saveCurrentLayer();
            return true;
        } else if (savedPreference === 'never-save') {
            // Discard changes without prompting
            this.hasUnsavedChanges = false;
            return true;
        }

        // No saved preference, show prompt
        const result = confirm('You have unsaved changes. Do you want to save them?\n\nOK = Save changes\nCancel = Discard changes');

        if (result) {
            this.saveCurrentLayer();
        } else {
            this.hasUnsavedChanges = false;
        }

        return true;
    };

    deleteLayer = (layerId: number) => {
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

            if (this.activeLayerId) {
                const newActiveLayer = this.layers.find(l => l.id === this.activeLayerId);
                if (newActiveLayer) {
                    if (newActiveLayer.type === 'ascii') {
                        this.editingState = {
                            ...newActiveLayer,
                            lattice: {
                                ...newActiveLayer.lattice,
                                cells: newActiveLayer.lattice.cells.map(row => row.map(cell => ({ ...cell })))
                            }
                        };
                    } else {
                        this.editingState = { ...newActiveLayer };
                    }
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

    reorderLayers = (oldIndex: number, newIndex: number) => {
        if (oldIndex === newIndex) return;

        const newLayers = [...this.layers];
        const [movedLayer] = newLayers.splice(oldIndex, 1);
        newLayers.splice(newIndex, 0, movedLayer);

        // Update zIndex values to match new order
        newLayers.forEach((layer, idx) => {
            layer.zIndex = idx + 2;
        });

        this.layers = newLayers;
    };

    // Editing state updates
    updateEditingState = (updates: Partial<Layer>) => {
        if (!this.editingState) return;
        this.editingState = { ...this.editingState, ...updates } as Layer;
        this.hasUnsavedChanges = true;
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

    setFontSize = (fontSize: number) => {
        this.updateEditingState({ fontSize });
    };

    setParallaxStrength = (parallaxStrength: number) => {
        this.updateEditingState({ parallaxStrength });
    };

    setEnablePointerEvents = (enablePointerEvents: boolean) => {
        this.updateEditingState({ enablePointerEvents });
    };

    setTintColor = (tintColor: string | undefined) => {
        if (!this.editingState) return;

        if (this.editingState.type === 'ascii') {
            this.editingState.tintColor = tintColor;
            this.hasUnsavedChanges = true;
        } else if (this.editingState.type === 'image') {
            this.editingState.tintColor = tintColor;
            this.hasUnsavedChanges = true;
        }
    };

    // Apply color to all non-empty cells in the ASCII layer
    applyColorToAllCells = (layerId: number, textColor: string, bgColor?: string, alpha?: number) => {
        if (this.editingState?.id !== layerId || this.editingState.type !== 'ascii') return;

        const updates: Partial<CharacterCell> = { textColor };
        if (bgColor !== undefined) updates.bgColor = bgColor;
        if (alpha !== undefined) updates.alpha = alpha;

        // Update all non-empty cells
        for (let y = 0; y < this.editingState.lattice.height; y++) {
            for (let x = 0; x < this.editingState.lattice.width; x++) {
                const cell = this.editingState.lattice.cells[y][x];
                // Only update non-empty cells
                if (cell.char !== ' ' && cell.char !== '') {
                    this.editingState.lattice.cells[y][x] = {
                        ...cell,
                        ...updates
                    };
                }
            }
        }

        this.hasUnsavedChanges = true;
    };

    // Getters
    get activeLayer(): Layer | undefined {
        return this.layers.find(l => l.id === this.activeLayerId);
    }

    get hasLayers(): boolean {
        return this.layers.length > 0 && this.layers.some(l => {
            if (l.type === 'ascii') {
                return l.lattice.cells.length > 0;
            } else if (l.type === 'image') {
                return l.imageData !== '';
            } else if (l.type === 'html') {
                return l.htmlContent !== '';
            }
            return false;
        });
    }

    getLayerData = (layerId: number): Layer | undefined => {
        const layer = this.layers.find(l => l.id === layerId);
        if (!layer) return undefined;

        return (layer.id === this.activeLayerId && this.editingState) ? this.editingState : layer;
    };

    // Project serialization helpers
    toJSON = () => {
        return {
            layers: this.layers,
            nextLayerId: this.nextLayerId
        };
    };

    loadFromJSON = (data: { layers: Layer[], nextLayerId: number }) => {
        this.layers = data.layers;
        this.nextLayerId = data.nextLayerId;
        this.activeLayerId = null;
        this.editingState = null;
        this.hasUnsavedChanges = false;
    };
}
