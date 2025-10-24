import { makeAutoObservable } from 'mobx';
import { Resolution, CustomResolution } from '@/types';
import { getResolutionStyles } from '@/utils/htmlExporter';

export class CanvasStore {
    resolution: Resolution = 'responsive';
    customResolution: CustomResolution = { width: 1920, height: 1080 };
    backgroundColor: string = '#ffffff';

    constructor() {
        makeAutoObservable(this);
    }

    setResolution = (resolution: Resolution) => {
        this.resolution = resolution;
    };

    setCustomResolution = (dimensions: CustomResolution) => {
        this.customResolution = dimensions;
    };

    setBackgroundColor = (color: string) => {
        this.backgroundColor = color;
    };

    getContainerStyles = (): React.CSSProperties => {
        switch (this.resolution) {
            case 'square':
                return {
                    maxWidth: '800px',
                    maxHeight: '800px',
                    width: 'min(calc(100vw - 400px), 800px)',
                    height: 'min(calc(100vh - 200px), 800px)',
                    aspectRatio: '1 / 1',
                    border: '2px solid #000000',
                    margin: 'auto',
                };
            case 'landscape':
                return {
                    maxWidth: '1200px',
                    maxHeight: '675px',
                    width: 'min(calc(100vw - 400px), 1200px)',
                    height: 'calc(min(calc(100vw - 400px), 1200px) * 9 / 16)',
                    border: '2px solid #000000',
                    margin: 'auto',
                };
            case 'portrait':
                return {
                    maxWidth: '675px',
                    maxHeight: '1200px',
                    width: 'min(calc(100vw - 400px), 675px)',
                    height: 'min(calc(100vh - 200px), 1200px)',
                    border: '2px solid #000000',
                    margin: 'auto',
                };
            case 'custom':
                return {
                    width: `${this.customResolution.width}px`,
                    height: `${this.customResolution.height}px`,
                    maxWidth: 'calc(100vw - 400px)',
                    maxHeight: 'calc(100vh - 200px)',
                    border: '2px solid #000000',
                    margin: 'auto',
                };
            case 'responsive':
            default:
                return {
                    width: '100%',
                    height: '100%',
                };
        }
    };

    get resolutionStyles() {
        return getResolutionStyles(this.resolution, this.customResolution);
    }
}

