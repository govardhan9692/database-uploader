
import React, { useState, useEffect } from 'react';
import { getUserCollections, getUserMedia, Collection, MediaItem } from '../services/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderPlus, ImageIcon, VideoIcon, Grid2X2Icon, Folder } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { createCollection } from '../services/firebase';
import CollectionGallery from './CollectionGallery';
import { Badge } from '@/components/ui/badge';

interface CollectionsViewProps {
  userId: string;
  refreshTrigger: number;
  onDeleteMedia?: (mediaId: string) => void;
}

const CollectionsView: React.FC<CollectionsViewProps> = ({ userId, refreshTrigger, onDeleteMedia }) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video'>('all');
  const [loading, setLoading] = useState(true);
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [collectionCounts, setCollectionCounts] = useState<{[key: string]: {images: number, videos: number}}>({}); 
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [collectionResult, mediaResult] = await Promise.all([
          getUserCollections(userId),
          getUserMedia(userId)
        ]);
        
        if (!collectionResult.error) {
          setCollections(collectionResult.collections);
        }
        
        if (!mediaResult.error) {
          // Calculate counts for each collection
          const counts: {[key: string]: {images: number, videos: number}} = {};
          
          mediaResult.media.forEach(item => {
            if (item.collectionId) {
              if (!counts[item.collectionId]) {
                counts[item.collectionId] = { images: 0, videos: 0 };
              }
              
              if (item.resourceType === 'image') {
                counts[item.collectionId].images++;
              } else if (item.resourceType === 'video') {
                counts[item.collectionId].videos++;
              }
            }
          });
          
          setCollectionCounts(counts);
        }
      } catch (error) {
        console.error("Error fetching collections:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId, refreshTrigger]);
  
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
          title: "Collection created",
          description: `"${newCollectionName}" collection has been created`
        });
      }
      
      setNewCollectionName('');
      setShowNewCollectionDialog(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to create collection"
      });
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-r-transparent animate-spin"></div>
        <p className="ml-3 text-muted-foreground">Loading collections...</p>
      </div>
    );
  }
  
  if (selectedCollection) {
    return (
      <div className="animate-fade">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setSelectedCollection(null)}>
              ← Back to Collections
            </Button>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Folder className="h-5 w-5" />
              {selectedCollection.name}
            </h2>
          </div>
          
          <Tabs value={mediaFilter} onValueChange={(v) => setMediaFilter(v as any)} className="w-auto">
            <TabsList>
              <TabsTrigger value="all" className="flex items-center gap-1.5">
                <Grid2X2Icon className="h-3.5 w-3.5" />
                All
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Images
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-1.5">
                <VideoIcon className="h-3.5 w-3.5" />
                Videos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <CollectionGallery 
          userId={userId}
          collectionId={selectedCollection.id}
          refreshTrigger={refreshTrigger}
          filter={mediaFilter === 'all' ? null : mediaFilter}
          onDeleteMedia={onDeleteMedia}
        />
      </div>
    );
  }
  
  return (
    <div className="animate-fade">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Collections</h2>
        <Button 
          onClick={() => setShowNewCollectionDialog(true)}
          className="flex items-center gap-2"
        >
          <FolderPlus className="h-4 w-4" />
          New Collection
        </Button>
      </div>
      
      {collections.length === 0 ? (
        <Card className="text-center py-12 glass card-gradient">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <Folder className="h-12 w-12 text-muted-foreground opacity-20" />
            </div>
            <p className="text-lg text-muted-foreground">No collections yet</p>
            <p className="mt-2">Create your first collection to organize your media</p>
            <Button 
              onClick={() => setShowNewCollectionDialog(true)}
              className="mt-6"
              variant="outline"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map(collection => {
            const counts = collectionCounts[collection.id] || { images: 0, videos: 0 };
            const totalItems = counts.images + counts.videos;
            
            return (
              <Card key={collection.id} className="hover-scale transition-all cursor-pointer glass card-gradient">
                <CardHeader 
                  className="pb-2" 
                  onClick={() => setSelectedCollection(collection)}
                >
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    {collection.name}
                  </CardTitle>
                  <CardDescription>
                    Created on {new Date(collection.createdAt?.toDate()).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="py-2">
                  <div className="flex gap-2">
                    {totalItems > 0 ? (
                      <>
                        {counts.images > 0 && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" /> {counts.images} images
                          </Badge>
                        )}
                        {counts.videos > 0 && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <VideoIcon className="h-3 w-3" /> {counts.videos} videos
                          </Badge>
                        )}
                      </>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Empty collection
                      </Badge>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="pt-2 flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedCollection(collection)}
                  >
                    View Collection
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
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

export default CollectionsView;
