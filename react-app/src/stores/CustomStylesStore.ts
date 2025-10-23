import { makeAutoObservable } from 'mobx';

export class CustomStylesStore {
    customCSS: string = `/* Custom CSS for ASCII art classes */
.twinkle {
    animation: twinkle 1.5s ease-in-out infinite;
}

@keyframes twinkle {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}
`;
    styleElementId = 'ascii-custom-styles';

    constructor() {
        makeAutoObservable(this);
        this.injectStyles();
    }

    setCustomCSS = (css: string) => {
        this.customCSS = css;
        this.injectStyles();
    };

    // Inject or update styles in document head
    injectStyles = () => {
        if (typeof document === 'undefined') return;

        let styleElement = document.getElementById(this.styleElementId) as HTMLStyleElement;

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = this.styleElementId;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = this.customCSS;
    };

    resetToDefault = () => {
        this.customCSS = `/* Custom CSS for ASCII art classes */
.twinkle {
    animation: twinkle 1.5s ease-in-out infinite;
}

@keyframes twinkle {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}
`;
        this.injectStyles();
    };

    // For project serialization
    toJSON = () => {
        return {
            customCSS: this.customCSS
        };
    };

    loadFromJSON = (data: { customCSS: string }) => {
        this.customCSS = data.customCSS;
        this.injectStyles();
    };
}

