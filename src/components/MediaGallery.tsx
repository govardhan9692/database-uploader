
import React, { useState, useEffect, useMemo } from 'react';
import { getUserMedia, getUserCollections, MediaItem, Collection, updateMediaCollection } from '../services/firebase';
import { FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import MediaGrid from './media/MediaGrid';
import CollectionFilter from './media/CollectionFilter';
import CreateCollectionDialog from './media/CreateCollectionDialog';
import MediaPreviewModal from './media/MediaPreviewModal';
import MediaGalleryLoading from './media/MediaGalleryLoading';
import MediaGalleryEmpty from './media/MediaGalleryEmpty';
import { useIsMobile } from '@/hooks/use-mobile';

interface MediaGalleryProps {
  userId: string;
  refreshTrigger: number;
  filter?: 'image' | 'video' | null;
  onDeleteMedia?: (mediaId: string) => void;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ userId, refreshTrigger, filter, onDeleteMedia }) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [collectionCounts, setCollectionCounts] = useState<{[key: string]: {images: number, videos: number}}>({});
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [mediaResult, collectionsResult] = await Promise.all([
          getUserMedia(userId),
          getUserCollections(userId)
        ]);
        
        if (mediaResult.error) {
          setError(mediaResult.error);
        } else {
          setMedia(mediaResult.media);
          
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
        
        if (collectionsResult.error) {
          console.error("Error fetching collections:", collectionsResult.error);
        } else {
          setCollections(collectionsResult.collections);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId, refreshTrigger]);
  
  const filteredMedia = useMemo(() => {
    if (!selectedFilter) {
      if (filter) {
        return media.filter(item => item.resourceType === filter);
      }
      return media;
    }
    if (selectedFilter === 'uncategorized') {
      let items = media.filter(item => !item.collectionId);
      if (filter) {
        items = items.filter(item => item.resourceType === filter);
      }
      return items;
    }
    let items = media.filter(item => item.collectionId === selectedFilter);
    if (filter) {
      items = items.filter(item => item.resourceType === filter);
    }
    return items;
  }, [media, selectedFilter, filter]);

  const handleCollectionCreated = async (collections: Collection[]) => {
    setCollections(collections);
    setShowCollectionDialog(false);
  };
  
  const handleUpdateMedia = (updatedMedia: MediaItem) => {
    setMedia(prevMedia => 
      prevMedia.map(item => 
        item.id === updatedMedia.id ? updatedMedia : item
      )
    );
    
    // Update collection counts
    setCollectionCounts(prevCounts => {
      const newCounts = {...prevCounts};
      
      // If item was moved from a collection to another, update both counts
      if (updatedMedia.collectionId) {
        if (!newCounts[updatedMedia.collectionId]) {
          newCounts[updatedMedia.collectionId] = { images: 0, videos: 0 };
        }
        
        if (updatedMedia.resourceType === 'image') {
          newCounts[updatedMedia.collectionId].images++;
        } else if (updatedMedia.resourceType === 'video') {
          newCounts[updatedMedia.collectionId].videos++;
        }
      }
      
      return newCounts;
    });
  };

  const getCollectionName = (collectionId: string | null) => {
    if (!collectionId) return "Uncategorized";
    const collection = collections.find(c => c.id === collectionId);
    return collection ? collection.name : "Unknown Collection";
  };
  
  const handleDrop = async (mediaId: string, collectionId: string | null) => {
    try {
      const result = await updateMediaCollection(mediaId, collectionId);
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Update the media item with the new collection ID
      const mediaItem = media.find(item => item.id === mediaId);
      if (mediaItem) {
        const updatedMedia = { ...mediaItem, collectionId };
        handleUpdateMedia(updatedMedia);
      }
      
      const collectionName = collectionId 
        ? collections.find(c => c.id === collectionId)?.name 
        : "Uncategorized";
      
      toast({
        title: "Media moved",
        description: `Media moved to ${collectionName}`
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to move media"
      });
    }
  };
  
  return (
    <div className="animate-fade">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">
          {filter === 'image' ? 'Images' : filter === 'video' ? 'Videos' : 'Media'} Gallery
        </h2>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setShowCollectionDialog(true)}
          >
            <FolderPlus className="h-4 w-4" />
            New Collection
          </Button>
        </div>
      </div>
      
      {/* Collection filter */}
      <CollectionFilter 
        collections={collections}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        showDropZone={!isMobile}
        onDrop={handleDrop}
        collectionCounts={collectionCounts}
      />
      
      {loading ? (
        <MediaGalleryLoading />
      ) : error ? (
        <Card className="w-full p-6 bg-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      ) : filteredMedia.length === 0 ? (
        <MediaGalleryEmpty filter={filter} selectedFilter={selectedFilter} />
      ) : (
        <MediaGrid 
          media={filteredMedia}
          collections={collections}
          onSelectMedia={setSelectedMedia}
          onDeleteMedia={onDeleteMedia}
          onUpdateMedia={handleUpdateMedia}
          getCollectionName={getCollectionName}
        />
      )}
      
      {/* Media Preview Modal */}
      {selectedMedia && (
        <MediaPreviewModal
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onDelete={onDeleteMedia ? () => {
            onDeleteMedia(selectedMedia.id);
            setSelectedMedia(null);
          } : undefined}
          getCollectionName={getCollectionName}
        />
      )}
      
      {/* Create Collection Dialog */}
      <CreateCollectionDialog
        open={showCollectionDialog}
        onClose={() => setShowCollectionDialog(false)}
        userId={userId}
        onCollectionCreated={handleCollectionCreated}
      />
    </div>
  );
};

export default MediaGallery;
