import { makeAutoObservable } from 'mobx';
import { EditingTool, BrushSettings } from '@/types';

export class EditingStore {
    activeTool: EditingTool = 'select';
    brushSettings: BrushSettings = {
        radius: 1,
        currentChar: '█',
        currentTextColor: '#000000',
        currentBgColor: 'transparent',
        currentAlpha: 1,
    };
    isEditing = false;

    constructor() {
        makeAutoObservable(this);
    }

    setActiveTool = (tool: EditingTool) => {
        this.activeTool = tool;
    };

    setBrushRadius = (radius: number) => {
        this.brushSettings.radius = Math.max(1, Math.min(10, radius));
    };

    setCurrentChar = (char: string) => {
        this.brushSettings.currentChar = char.charAt(0) || '█';
    };

    setCurrentTextColor = (color: string) => {
        this.brushSettings.currentTextColor = color;
    };

    setCurrentBgColor = (color: string) => {
        this.brushSettings.currentBgColor = color;
    };

    setCurrentAlpha = (alpha: number) => {
        this.brushSettings.currentAlpha = Math.max(0, Math.min(1, alpha));
    };

    setIsEditing = (isEditing: boolean) => {
        this.isEditing = isEditing;
    };

    get isDrawingTool(): boolean {
        return this.activeTool === 'erase' || this.activeTool === 'paint-color' || this.activeTool === 'paint-alpha';
    }
}

