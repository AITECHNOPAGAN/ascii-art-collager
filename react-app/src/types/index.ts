// Layer Types
export type LayerType = 'ascii' | 'image';

export type Position = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type Resolution = 'responsive' | 'square' | 'landscape' | 'portrait';

// Character cell for ASCII lattice layers
export interface CharacterCell {
    char: string;
    textColor: string;
    bgColor: string;
    alpha: number;
    className?: string; // For custom CSS classes
}

// ASCII Lattice structure
export interface AsciiLattice {
    width: number;
    height: number;
    cells: CharacterCell[][];
}

// Base layer properties shared by all layers
interface BaseLayer {
    id: number;
    name: string;
    position: Position;
    offsetX: number;
    offsetY: number;
    scale: number;
    fontSize: number;
    zIndex: number;
    visibility: boolean;
    parallaxStrength: number;
}

// ASCII Layer (character-based lattice)
export interface AsciiLayer extends BaseLayer {
    type: 'ascii';
    lattice: AsciiLattice;
    resolution: number;
    originalImage?: string; // data URL for re-conversion at different resolutions
    tintColor?: string; // Optional tint color to apply to all non-empty cells
}

// Image Layer (pixel-based)
export interface ImageLayer extends BaseLayer {
    type: 'image';
    imageData: string; // data URL
    editedPixels?: string; // data URL of edited canvas
    tintColor?: string; // Optional tint color to apply to the image
}

// Discriminated union for layers
export type Layer = AsciiLayer | ImageLayer;

// Editing Tools
export type EditingTool = 'select' | 'erase' | 'paint-color' | 'paint-alpha' | 'color-picker';

export interface BrushSettings {
    radius: number;
    currentChar: string;
    currentTextColor: string;
    currentBgColor: string;
    currentAlpha: number;
}

// Project state for serialization
export interface ProjectState {
    version: string;
    layers: Layer[];
    canvasResolution: Resolution;
    canvasBackgroundColor?: string; // Optional for backwards compatibility
    customCSS?: string; // Custom CSS for class names
    metadata: {
        createdAt: string;
        modifiedAt: string;
        name?: string;
    };
}

export interface ExportConfig {
    resolution: Resolution;
    parallaxEnabled: boolean;
    includeGeneratorLink: boolean;
    backgroundColor?: string;
}

export interface ResolutionStyles {
    containerStyles: string;
    bodyStyles: string;
}

