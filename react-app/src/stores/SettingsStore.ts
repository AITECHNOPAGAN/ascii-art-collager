import { makeAutoObservable } from 'mobx';

export interface Setting {
    id: string;
    name: string;
    description: string;
    category: string;
    type: 'boolean' | 'number' | 'string' | 'select';
    value: any;
    defaultValue: any;
    options?: { label: string; value: any }[];
}

export class SettingsStore {
    settings: Setting[] = [
        {
            id: 'auto-save-on-layer-change',
            name: 'Auto-save on Layer Change',
            description: 'Automatically save changes when switching between layers',
            category: 'Editor',
            type: 'select',
            value: this.loadSetting('auto-save-on-layer-change', 'ask'),
            defaultValue: 'ask',
            options: [
                { label: 'Always Ask', value: 'ask' },
                { label: 'Always Save', value: 'always-save' },
                { label: 'Never Save', value: 'never-save' },
            ],
        },
        {
            id: 'include-generator-link',
            name: 'Include Generator Link',
            description: 'Add a link to the ASCII Art Generator in exported HTML files',
            category: 'Export',
            type: 'boolean',
            value: this.loadSetting('include-generator-link', true),
            defaultValue: true,
        },
    ];

    constructor() {
        makeAutoObservable(this);
        this.loadAllSettings();
    }

    private loadSetting(id: string, defaultValue: any): any {
        try {
            // Special handling for layer auto-save preference
            if (id === 'auto-save-on-layer-change') {
                const savedPref = localStorage.getItem('layer-autosave-preference');
                if (savedPref === 'always-save') return 'always-save';
                if (savedPref === 'never-save') return 'never-save';
                return 'ask';
            }

            const saved = localStorage.getItem(`setting-${id}`);
            return saved ? JSON.parse(saved) : defaultValue;
        } catch (error) {
            console.error(`Failed to load setting ${id}:`, error);
            return defaultValue;
        }
    }

    private saveSetting(id: string, value: any): void {
        try {
            // Special handling for layer auto-save preference
            if (id === 'auto-save-on-layer-change') {
                localStorage.removeItem('layer-autosave-preference');
                if (value === 'always-save') {
                    localStorage.setItem('layer-autosave-preference', 'always-save');
                } else if (value === 'never-save') {
                    localStorage.setItem('layer-autosave-preference', 'never-save');
                }
                return;
            }

            localStorage.setItem(`setting-${id}`, JSON.stringify(value));
        } catch (error) {
            console.error(`Failed to save setting ${id}:`, error);
        }
    }

    loadAllSettings(): void {
        this.settings.forEach((setting) => {
            setting.value = this.loadSetting(setting.id, setting.defaultValue);
        });
    }

    updateSetting(id: string, value: any): void {
        const setting = this.settings.find((s) => s.id === id);
        if (!setting) return;

        setting.value = value;
        this.saveSetting(id, value);
    }

    resetSetting(id: string): void {
        const setting = this.settings.find((s) => s.id === id);
        if (!setting) return;

        setting.value = setting.defaultValue;
        this.saveSetting(id, setting.defaultValue);
    }

    resetAllSettings(): void {
        this.settings.forEach((setting) => {
            setting.value = setting.defaultValue;
            this.saveSetting(setting.id, setting.defaultValue);
        });
    }

    getSetting(id: string): any {
        const setting = this.settings.find((s) => s.id === id);
        return setting?.value;
    }

    get categorizedSettings(): Record<string, Setting[]> {
        return this.settings.reduce((acc, setting) => {
            if (!acc[setting.category]) {
                acc[setting.category] = [];
            }
            acc[setting.category].push(setting);
            return acc;
        }, {} as Record<string, Setting[]>);
    }
}

