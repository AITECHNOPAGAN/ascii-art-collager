import { observer } from 'mobx-react-lite';
import { useState, useMemo } from 'react';
import { useSettingsStore } from '@/stores';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SettingsDialogProps {
    open: boolean;
    onClose: () => void;
}

export const SettingsDialog = observer(({ open, onClose }: SettingsDialogProps) => {
    const settingsStore = useSettingsStore();
    const [searchQuery, setSearchQuery] = useState('');

    // Fuzzy search implementation
    const filteredSettings = useMemo(() => {
        if (!searchQuery.trim()) {
            return settingsStore.settings;
        }

        const query = searchQuery.toLowerCase();
        return settingsStore.settings.filter((setting) => {
            const searchText = `${setting.name} ${setting.description} ${setting.category}`.toLowerCase();
            
            // Simple fuzzy matching: check if all characters in query appear in order
            let queryIndex = 0;
            for (let i = 0; i < searchText.length && queryIndex < query.length; i++) {
                if (searchText[i] === query[queryIndex]) {
                    queryIndex++;
                }
            }
            return queryIndex === query.length;
        });
    }, [searchQuery, settingsStore.settings]);

    // Group filtered settings by category
    const categorizedFilteredSettings = useMemo(() => {
        return filteredSettings.reduce((acc, setting) => {
            if (!acc[setting.category]) {
                acc[setting.category] = [];
            }
            acc[setting.category].push(setting);
            return acc;
        }, {} as Record<string, typeof filteredSettings>);
    }, [filteredSettings]);

    const handleResetAll = () => {
        const confirm = window.confirm(
            'Are you sure you want to reset all settings to their default values?'
        );
        if (confirm) {
            settingsStore.resetAllSettings();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-4">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Customize your ASCII Art Generator experience. Use the search bar to quickly find settings.
                    </DialogDescription>
                </DialogHeader>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search settings... (fuzzy search enabled)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Settings List */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {filteredSettings.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No settings found matching "{searchQuery}"</p>
                            <p className="text-sm mt-2">Try a different search term</p>
                        </div>
                    ) : (
                        Object.entries(categorizedFilteredSettings).map(([category, settings]) => (
                            <div key={category} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{category}</Badge>
                                    <Separator className="flex-1" />
                                </div>

                                {settings.map((setting) => (
                                    <div
                                        key={setting.id}
                                        className="flex items-start justify-between gap-4 p-3 border bg-card hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <Label htmlFor={setting.id} className="font-medium cursor-pointer">
                                                {setting.name}
                                            </Label>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {setting.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {setting.type === 'boolean' && (
                                                <Switch
                                                    id={setting.id}
                                                    checked={setting.value}
                                                    onCheckedChange={(checked) =>
                                                        settingsStore.updateSetting(setting.id, checked)
                                                    }
                                                />
                                            )}

                                            {setting.type === 'number' && (
                                                <Input
                                                    id={setting.id}
                                                    type="number"
                                                    value={setting.value}
                                                    onChange={(e) =>
                                                        settingsStore.updateSetting(
                                                            setting.id,
                                                            parseFloat(e.target.value)
                                                        )
                                                    }
                                                    className="w-20"
                                                />
                                            )}

                                            {setting.type === 'string' && (
                                                <Input
                                                    id={setting.id}
                                                    type="text"
                                                    value={setting.value}
                                                    onChange={(e) =>
                                                        settingsStore.updateSetting(setting.id, e.target.value)
                                                    }
                                                    className="w-40"
                                                />
                                            )}

                                            {setting.type === 'select' && setting.options && (
                                                <Select
                                                    value={setting.value}
                                                    onValueChange={(value) =>
                                                        settingsStore.updateSetting(setting.id, value)
                                                    }
                                                >
                                                    <SelectTrigger className="w-40">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {setting.options.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}

                                            {setting.value !== setting.defaultValue && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => settingsStore.resetSetting(setting.id)}
                                                    title="Reset to default"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <Button variant="outline" onClick={handleResetAll}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset All Settings
                    </Button>
                    <Button onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
});

