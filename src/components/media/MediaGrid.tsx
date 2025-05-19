
import React, { useState, useRef } from 'react';
import { MediaItem, Collection, updateMediaCollection } from '../../services/firebase';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Folder, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MediaGridItem from './MediaGridItem';
import { Badge } from '@/components/ui/badge';

interface MediaGridProps {
  media: MediaItem[];
  collections: Collection[];
  onSelectMedia: (media: MediaItem) => void;
  onDeleteMedia?: (mediaId: string) => void;
  onUpdateMedia: (media: MediaItem) => void;
  getCollectionName: (collectionId: string | null) => string;
}

const MediaGrid: React.FC<MediaGridProps> = ({
  media,
  collections,
  onSelectMedia,
  onDeleteMedia,
  onUpdateMedia,
  getCollectionName
}) => {
  const { toast } = useToast();
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const dropTargetRef = useRef<HTMLDivElement>(null);

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
  
  const handleMoveToCollection = async (mediaId: string, collectionId: string | null) => {
    try {
      const result = await updateMediaCollection(mediaId, collectionId);
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Update the media item with the new collection ID
      const updatedMedia = media.find(item => item.id === mediaId);
      if (updatedMedia) {
        onUpdateMedia({ ...updatedMedia, collectionId });
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

  return (
    <div className="image-grid">
      {media.map((item) => (
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
                onClick={() => onSelectMedia(item)}
                isDragging={draggingItem === item.id}
              />
            </div>
          </ContextMenuTrigger>
          
          <ContextMenuContent>
            <ContextMenuItem onClick={() => onSelectMedia(item)}>
              View Media
            </ContextMenuItem>
            <ContextMenuItem onClick={() => copyToClipboard(item.mediaUrl)}>
              Copy URL
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
            <ContextMenuSeparator />
            <ContextMenuItem disabled className="font-medium">
              Move to Collection
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleMoveToCollection(item.id, null)}>
              Uncategorized
            </ContextMenuItem>
            {collections.map(collection => (
              <ContextMenuItem 
                key={collection.id}
                onClick={() => handleMoveToCollection(item.id, collection.id)}
              >
                <Folder className="h-3.5 w-3.5 mr-2" />
                {collection.name}
              </ContextMenuItem>
            ))}
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </div>
  );
};

export default MediaGrid;
