import { observer } from 'mobx-react-lite';
import { useLayerStore } from '@/stores';
import { LayerItem } from './LayerItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export const LayerPanel = observer(() => {
    const layerStore = useLayerStore();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Layers</CardTitle>
                <Button onClick={() => layerStore.createNewLayer()} className="w-full mt-2">
                    <Plus className="mr-2 h-4 w-4" />
                    New Layer
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {layerStore.layers.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm py-8 italic">
                            No layers yet. Click "New Layer" to start!
                        </div>
                    ) : (
                        layerStore.layers.map((layer, index) => (
                            <LayerItem
                                key={layer.id}
                                layerId={layer.id}
                                index={index}
                                totalLayers={layerStore.layers.length}
                            />
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
});

