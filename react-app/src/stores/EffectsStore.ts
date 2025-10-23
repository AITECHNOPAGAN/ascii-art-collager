import { makeAutoObservable } from 'mobx';

export class EffectsStore {
    parallaxEnabled = false;
    mouseX = 0.5;
    mouseY = 0.5;

    constructor() {
        makeAutoObservable(this);
    }

    toggleParallax = () => {
        this.parallaxEnabled = !this.parallaxEnabled;
    };

    updateMousePosition = (x: number, y: number) => {
        this.mouseX = x;
        this.mouseY = y;
    };
}

