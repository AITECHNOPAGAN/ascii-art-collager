export type ContentType = 'image' | 'hiresImage' | 'text';

export type Position = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type Resolution = 'responsive' | 'square' | 'landscape' | 'portrait';

export interface Layer {
    id: number;
    name: string;
    asciiArt: string;
    imageData: string | null;
    contentType: ContentType;
    position: Position;
    offsetX: number;
    offsetY: number;
    scale: number;
    fontSize: number;
    color: string;
    zIndex: number;
    visibility: boolean;
    parallaxStrength: number;
}

export interface ExportConfig {
    resolution: Resolution;
    parallaxEnabled: boolean;
    includeGeneratorLink: boolean;
}

export interface ResolutionStyles {
    containerStyles: string;
    bodyStyles: string;
}

