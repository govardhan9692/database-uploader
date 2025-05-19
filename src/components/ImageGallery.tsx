
import React, { useState, useEffect } from 'react';
import { getUserMedia, updateMediaCollection, getUserCollections, createCollection, Collection } from '../services/firebase';
import { Copy, X, Folder, FolderPlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Image {
  id: string;
  mediaUrl: string;
  resourceType: string;
  collectionId?: string | null;
  createdAt: any;
}

interface ImageGalleryProps {
  userId: string;
  refreshTrigger: number;
  filter: 'image' | 'video' | null;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ userId, refreshTrigger, filter }) => {
  const [images, setImages] = useState<Image[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch media and collections in parallel
        const [mediaResult, collectionsResult] = await Promise.all([
          getUserMedia(userId),
          getUserCollections(userId)
        ]);
        
        if (mediaResult.error) {
          setError(mediaResult.error);
        } else {
          setImages(mediaResult.media as unknown as Image[]);
        }
        
        if (collectionsResult.error) {
          console.error('Error fetching collections:', collectionsResult.error);
        } else {
          setCollections(collectionsResult.collections);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId, refreshTrigger]);
  
  const filteredImages = filter 
    ? images.filter(img => img.resourceType === filter)
    : selectedCollection 
      ? images.filter(img => img.collectionId === selectedCollection)
      : images;
  
  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "URL Copied",
        description: "Image URL copied to clipboard!"
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy URL"
      });
    }
  };
  
  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    
    try {
      const result = await createCollection(userId, newCollectionName);
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Refresh collections
      const collectionsResult = await getUserCollections(userId);
      if (!collectionsResult.error) {
        setCollections(collectionsResult.collections);
        toast({
          title: "Collection Created",
          description: `Collection "${newCollectionName}" created successfully`
        });
      }
      
      setNewCollectionName('');
      setShowNewCollectionDialog(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to create collection'
      });
    }
  };
  
  const moveToCollection = async (mediaId: string, collectionId: string | null) => {
    try {
      const result = await updateMediaCollection(mediaId, collectionId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Update local state
      setImages(prevImages => {
        return prevImages.map(img => {
          if (img.id === mediaId) {
            return { ...img, collectionId };
          }
          return img;
        });
      });
      
      const collectionName = collections.find(c => c.id === collectionId)?.name || 'Uncategorized';
      
      toast({
        title: "Media Moved",
        description: `Moved to ${collectionName}`
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to move media to collection'
      });
    }
  };
  
  return (
    <div className="animate-fade">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Media</h2>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                {selectedCollection 
                  ? collections.find(c => c.id === selectedCollection)?.name || 'Collection'
                  : 'Collections'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedCollection(null)}>
                All Media
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {collections.map(collection => (
                <DropdownMenuItem 
                  key={collection.id}
                  onClick={() => setSelectedCollection(collection.id)}
                >
                  {collection.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowNewCollectionDialog(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Create New Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-r-transparent animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading images...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/20 border border-destructive/50 rounded-md text-destructive">
          {error}
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="text-center py-12 glass card-gradient rounded-xl">
          <p className="text-lg text-muted-foreground">No media found</p>
          <p className="mt-2">Upload your first media or select a different collection</p>
        </div>
      ) : (
        <div className="image-grid">
          {filteredImages.map((image) => (
            <div 
              key={image.id}
              className="relative rounded-lg overflow-hidden aspect-square hover-scale group"
            >
              {image.resourceType === 'video' ? (
                <div 
                  className="w-full h-full flex items-center justify-center bg-black/50 cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <span className="text-white text-4xl">▶️</span>
                </div>
              ) : (
                <img 
                  src={image.mediaUrl} 
                  alt="Uploaded image" 
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                />
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full">
                  Click to view
                </span>
              </div>
              
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                      ...
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => copyToClipboard(image.mediaUrl)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy URL
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      Move to collection:
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => moveToCollection(image.id, null)}>
                      Uncategorized
                    </DropdownMenuItem>
                    {collections.map(collection => (
                      <DropdownMenuItem 
                        key={collection.id}
                        onClick={() => moveToCollection(image.id, collection.id)}
                      >
                        <Folder className="h-4 w-4 mr-2" />
                        {collection.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Media Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade">
          <div className="glass card-gradient max-w-3xl w-full rounded-2xl overflow-hidden relative animate-scale">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="font-medium">{selectedImage.resourceType === 'video' ? 'Video Preview' : 'Image Preview'}</h3>
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 flex justify-center items-center bg-black/50">
              {selectedImage.resourceType === 'video' ? (
                <video 
                  src={selectedImage.mediaUrl} 
                  controls 
                  className="max-h-[70vh] max-w-full"
                />
              ) : (
                <img 
                  src={selectedImage.mediaUrl} 
                  alt="Selected image" 
                  className="max-h-[70vh] max-w-full"
                />
              )}
            </div>
            
            <div className="p-4 border-t border-border flex justify-between items-center">
              <div className="flex-1 truncate pr-4 text-muted-foreground text-sm">
                {selectedImage.mediaUrl}
              </div>
              <Button
                onClick={() => copyToClipboard(selectedImage.mediaUrl)}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Copy className="h-4 w-4" /> Copy URL
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Collection Dialog */}
      <Dialog open={showNewCollectionDialog} onOpenChange={setShowNewCollectionDialog}>
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
            <Button variant="outline" onClick={() => setShowNewCollectionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCollection} disabled={!newCollectionName.trim()}>
              Create Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageGallery;
