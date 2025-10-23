import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface UnsavedChangesDialogProps {
    open: boolean;
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}

export const UnsavedChangesDialog = ({ open, onSave, onDiscard, onCancel }: UnsavedChangesDialogProps) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleSave = () => {
        if (dontShowAgain) {
            localStorage.setItem('layer-autosave-preference', 'always-save');
        }
        onSave();
    };

    const handleDiscard = () => {
        if (dontShowAgain) {
            localStorage.setItem('layer-autosave-preference', 'never-save');
        }
        onDiscard();
    };

    return (
        <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                    <AlertDialogDescription>
                        You have unsaved changes in the current layer. What would you like to do?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex items-center space-x-2 py-4">
                    <Checkbox
                        id="dont-show-again"
                        checked={dontShowAgain}
                        onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                    />
                    <Label
                        htmlFor="dont-show-again"
                        className="text-sm font-normal cursor-pointer"
                    >
                        Don't show me this again (remember my choice)
                    </Label>
                </div>

                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel onClick={onCancel}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDiscard}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        Discard Changes
                    </AlertDialogAction>
                    <AlertDialogAction onClick={handleSave}>
                        Save Changes
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

