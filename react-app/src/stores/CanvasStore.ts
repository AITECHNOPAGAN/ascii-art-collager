import { makeAutoObservable } from 'mobx';
import { Resolution } from '@/types';
import { getResolutionStyles } from '@/utils/htmlExporter';

export class CanvasStore {
    resolution: Resolution = 'responsive';

    constructor() {
        makeAutoObservable(this);
    }

    setResolution = (resolution: Resolution) => {
        this.resolution = resolution;
    };

    getContainerStyles = (): React.CSSProperties => {
        switch (this.resolution) {
            case 'square':
                return {
                    maxWidth: '800px',
                    maxHeight: '800px',
                    width: '100vmin',
                    height: '100vmin',
                    border: '2px solid #000000',
                    margin: 'auto',
                };
            case 'landscape':
                return {
                    maxWidth: '1200px',
                    maxHeight: '675px',
                    width: 'min(90vw, 1200px)',
                    height: 'calc(min(90vw, 1200px) * 9 / 16)',
                    border: '2px solid #000000',
                    margin: 'auto',
                };
            case 'portrait':
                return {
                    maxWidth: '675px',
                    maxHeight: '1200px',
                    width: 'calc(min(90vh, 1200px) * 9 / 16)',
                    height: 'min(90vh, 1200px)',
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
        return getResolutionStyles(this.resolution);
    }
}

