import { observer } from 'mobx-react-lite';
import { useEffectsStore } from '@/stores';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const EffectsPanel = observer(() => {
    const effectsStore = useEffectsStore();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Effects</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <Label htmlFor="parallax-toggle" className="cursor-pointer">
                        Enable Parallax Effect
                    </Label>
                    <Switch
                        id="parallax-toggle"
                        checked={effectsStore.parallaxEnabled}
                        onCheckedChange={() => effectsStore.toggleParallax()}
                    />
                </div>
            </CardContent>
        </Card>
    );
});

