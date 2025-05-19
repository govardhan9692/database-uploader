
import React, { useState, useEffect, useMemo } from 'react';
import { getUserMedia, MediaItem, updateMediaCollection } from '../services/firebase';
import { Copy, Trash2, X, VideoIcon, ImageIcon, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import MediaGridItem from './media/MediaGridItem';

interface CollectionGalleryProps {
  userId: string;
  collectionId: string;
  refreshTrigger: number;
  filter: 'image' | 'video' | null;
  onDeleteMedia?: (mediaId: string) => void;
}

const CollectionGallery: React.FC<CollectionGalleryProps> = ({ userId, collectionId, refreshTrigger, filter, onDeleteMedia }) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const mediaResult = await getUserMedia(userId);
        
        if (mediaResult.error) {
          setError(mediaResult.error);
        } else {
          // Filter media that belongs to this collection
          const collectionMedia = mediaResult.media.filter(item => item.collectionId === collectionId);
          setMedia(collectionMedia);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load media");
      } finally {
        setLoading(false);
      }
    };
    
    fetchMedia();
  }, [userId, collectionId, refreshTrigger]);
  
  const filteredMedia = useMemo(() => {
    if (filter) {
      return media.filter(item => item.resourceType === filter);
    }
    return media;
  }, [media, filter]);
  
  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "URL Copied",
        description: "Media URL copied to clipboard"
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Failed to copy URL to clipboard"
      });
    }
  };
  
  const handleRemoveFromCollection = async (mediaId: string) => {
    try {
      const result = await updateMediaCollection(mediaId, null);
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Update local state
      setMedia(prevMedia => prevMedia.filter(item => item.id !== mediaId));
      
      toast({
        title: "Media removed",
        description: "Media removed from collection"
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to remove media from collection"
      });
    }
  };
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, mediaId: string) => {
    e.dataTransfer.setData('mediaId', mediaId);
    setDraggingItem(mediaId);
    
    // Make the drag image transparent
    if (e.dataTransfer.setDragImage) {
      const elem = document.createElement('div');
      elem.style.position = 'absolute';
      elem.style.top = '-9999px';
      document.body.appendChild(elem);
      e.dataTransfer.setDragImage(elem, 0, 0);
      setTimeout(() => document.body.removeChild(elem), 0);
    }
  };
  
  const handleDragEnd = () => {
    setDraggingItem(null);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-r-transparent animate-spin"></div>
        <p className="ml-3 text-muted-foreground">Loading media...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-destructive/20 border border-destructive/50 rounded-md text-destructive">
        {error}
      </div>
    );
  }
  
  if (filteredMedia.length === 0) {
    return (
      <div className="text-center py-12 glass card-gradient rounded-xl">
        <div className="flex justify-center mb-4">
          {filter === 'image' ? (
            <ImageIcon className="h-12 w-12 text-muted-foreground opacity-20" />
          ) : filter === 'video' ? (
            <VideoIcon className="h-12 w-12 text-muted-foreground opacity-20" />
          ) : (
            <div className="h-12 w-12 text-muted-foreground opacity-20 flex items-center justify-center">
              ?
            </div>
          )}
        </div>
        <p className="text-lg text-muted-foreground">
          {filter ? `No ${filter}s found in this collection` : "This collection is empty"}
        </p>
        <p className="mt-2">Add media to this collection from the main gallery</p>
        <p className="mt-2 text-sm text-muted-foreground">Tip: You can drag and drop media from other collections</p>
      </div>
    );
  }
  
  const getCollectionName = () => "This Collection"; // Simple placeholder since we're in the collection view
  
  return (
    <div className="animate-fade">
      <div className="image-grid">
        {filteredMedia.map((item) => (
          <ContextMenu key={item.id}>
            <ContextMenuTrigger>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragEnd={handleDragEnd}
              >
                <MediaGridItem 
                  item={item}
                  getCollectionName={getCollectionName}
                  onClick={() => setSelectedMedia(item)}
                  isDragging={draggingItem === item.id}
                />
              </div>
            </ContextMenuTrigger>
            
            <ContextMenuContent>
              <ContextMenuItem onClick={() => setSelectedMedia(item)}>
                View Media
              </ContextMenuItem>
              <ContextMenuItem onClick={() => copyToClipboard(item.mediaUrl)}>
                Copy URL
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleRemoveFromCollection(item.id)}>
                Remove from Collection
              </ContextMenuItem>
              {onDeleteMedia && (
                <ContextMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDeleteMedia(item.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Media
                </ContextMenuItem>
              )}
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
      
      {/* Media Preview Modal */}
      {selectedMedia && (
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-4xl w-full p-0 overflow-hidden rounded-lg glass">
            <DialogHeader className="p-4 border-b border-border">
              <DialogTitle className="flex items-center gap-2">
                {selectedMedia.resourceType === 'video' ? (
                  <VideoIcon className="h-4 w-4" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
                Media Preview
              </DialogTitle>
            </DialogHeader>
            
            <div className="p-0 max-h-[70vh] overflow-auto bg-black/50 flex items-center justify-center">
              {selectedMedia.resourceType === 'video' ? (
                <video 
                  src={selectedMedia.mediaUrl} 
                  controls 
                  className="max-h-[70vh] max-w-full"
                />
              ) : (
                <img 
                  src={selectedMedia.mediaUrl} 
                  alt="Selected media" 
                  className="max-h-[70vh] max-w-full"
                />
              )}
            </div>
            
            <DialogFooter className="p-4 border-t border-border flex justify-between items-center bg-background/60">
              <div className="flex-1 truncate pr-4 text-muted-foreground text-sm">
                {selectedMedia.mediaUrl}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(selectedMedia.mediaUrl)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" /> Copy URL
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedMedia.mediaUrl, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" /> Open
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    handleRemoveFromCollection(selectedMedia.id);
                    setSelectedMedia(null);
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" /> Remove
                </Button>

                {onDeleteMedia && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      onDeleteMedia(selectedMedia.id);
                      setSelectedMedia(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CollectionGallery;
