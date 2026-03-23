"use client";

import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Alert, AlertDescription } from './alert';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentId: string;
  entityName: string; // e.g., "Teacher", "Student", "Subject"
  onRename: (newId: string) => Promise<void>;
  validateId?: (id: string) => string | null; // Returns error message or null
}

export function RenameDialog({
  open,
  onOpenChange,
  currentId,
  entityName,
  onRename,
  validateId,
}: RenameDialogProps) {
  const [newId, setNewId] = useState(currentId);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (open) {
      setNewId(currentId);
      setError(null);
    }
  }, [open, currentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!newId.trim()) {
      setError(`${entityName} ID cannot be empty`);
      return;
    }

    if (newId.trim() === currentId) {
      setError(`New ${entityName} ID must be different from the current ID`);
      return;
    }

    // Custom validation
    if (validateId) {
      const validationError = validateId(newId.trim());
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    try {
      setIsLoading(true);
      await onRename(newId.trim());
      // Don't close immediately - let the parent handle it after showing success
    } catch (err: any) {
      setError(err.message || `Failed to rename ${entityName} ID`);
      setIsLoading(false);
    }
  };

  // Check if there's a validation error
  const trimmedNewId = newId.trim();
  const hasValidationError = error !== null || 
    !trimmedNewId || 
    trimmedNewId === currentId ||
    (validateId ? validateId(trimmedNewId) !== null : false);

  return (
    <Dialog open={open} onOpenChange={(open) => {
      // Prevent closing during loading
      if (!isLoading) {
        onOpenChange(open);
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Rename {entityName} ID
          </DialogTitle>
          <DialogDescription>
            <strong className="text-amber-600">⚠️ Critical Operation:</strong> Changing the {entityName.toLowerCase()} ID will update all related records. 
            This action cannot be easily undone. Please ensure the new ID is correct.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <Alert>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <AlertDescription>
                  <strong>Renaming in progress...</strong> Updating all related records. Please wait, this may take a moment.
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="current-id">Current {entityName} ID</Label>
            <Input
              id="current-id"
              value={currentId}
              disabled
              className="font-mono bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-id">
              New {entityName} ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="new-id"
              value={newId}
              onChange={(e) => {
                setNewId(e.target.value);
                // Clear error when user starts typing
                if (error) setError(null);
              }}
              disabled={isLoading}
              className="font-mono"
              placeholder={`Enter new ${entityName.toLowerCase()} ID`}
              required
            />
            <p className="text-xs text-gray-500">
              The new ID must be unique and will replace the current ID in all related records.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading || hasValidationError}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Renaming...
                </>
              ) : (
                `Rename ${entityName} ID`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
