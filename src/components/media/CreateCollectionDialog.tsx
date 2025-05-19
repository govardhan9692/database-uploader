
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { createCollection, getUserCollections, Collection } from '../../services/firebase';
import { useToast } from '@/hooks/use-toast';

interface CreateCollectionDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onCollectionCreated: (collections: Collection[]) => void;
}

const CreateCollectionDialog: React.FC<CreateCollectionDialogProps> = ({
  open,
  onClose,
  userId,
  onCollectionCreated
}) => {
  const [newCollectionName, setNewCollectionName] = useState('');
  const { toast } = useToast();

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    
    try {
      const result = await createCollection(userId, newCollectionName);
      if (result.error) {
        throw new Error(result.error);
      }
      
      toast({
        title: "Collection created",
        description: `"${newCollectionName}" collection has been created`
      });
      
      // Refresh collections
      const collectionsResult = await getUserCollections(userId);
      if (!collectionsResult.error) {
        onCollectionCreated(collectionsResult.collections);
      }
      
      setNewCollectionName('');
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to create collection"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <label htmlFor="collection-name" className="text-sm font-medium mb-2 block">
            Collection Name
          </label>
          <input
            id="collection-name"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="Enter collection name"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateCollection} disabled={!newCollectionName.trim()}>
            Create Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCollectionDialog;
