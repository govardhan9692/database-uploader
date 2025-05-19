
import React from 'react';
import { MediaItem } from '../../services/firebase';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Folder, VideoIcon, ImageIcon } from 'lucide-react';

interface MediaGridItemProps {
  item: MediaItem;
  getCollectionName: (collectionId: string | null) => string;
  onClick: () => void;
  isDragging?: boolean;
}

const MediaGridItem: React.FC<MediaGridItemProps> = ({ item, getCollectionName, onClick, isDragging }) => {
  return (
    <div 
      className={`relative rounded-lg overflow-hidden shadow-md hover-scale border border-border group cursor-grab
        ${isDragging ? 'opacity-50 ring-2 ring-primary' : ''}`}
      onClick={onClick}
      draggable={true}
      data-media-id={item.id}
      data-media-type={item.resourceType}
    >
      {item.resourceType === 'video' ? (
        <div className="aspect-square flex items-center justify-center bg-black">
          <VideoIcon className="h-12 w-12 text-white/70" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full">
              Click to view
            </span>
          </div>
        </div>
      ) : (
        <>
          <AspectRatio ratio={1}>
            <img 
              src={item.mediaUrl} 
              alt="Media item" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </AspectRatio>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full">
              Click to view
            </span>
          </div>
        </>
      )}
      
      {/* Info badge */}
      <div className="absolute top-2 left-2 z-10">
        <Badge variant={item.resourceType === 'video' ? "default" : "secondary"} className="opacity-70 flex items-center gap-1">
          {item.resourceType === 'video' ? (
            <>
              <VideoIcon className="h-3 w-3" /> Video
            </>
          ) : (
            <>
              <ImageIcon className="h-3 w-3" /> Image
            </>
          )}
        </Badge>
      </div>
      
      {/* Collection badge */}
      {item.collectionId && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="outline" className="bg-background/80 flex items-center gap-1">
            <Folder className="h-3 w-3" />
            {getCollectionName(item.collectionId)}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default MediaGridItem;
