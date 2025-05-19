
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Collection } from '../../services/firebase';
import { FolderIcon, X, ImageIcon, VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollectionFilterProps {
  collections: Collection[];
  selectedFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  showDropZone?: boolean;
  onDrop?: (mediaId: string, collectionId: string | null) => void;
  collectionCounts?: {[key: string]: {images: number, videos: number}};
}

const CollectionFilter: React.FC<CollectionFilterProps> = ({ 
  collections, 
  selectedFilter, 
  onFilterChange,
  showDropZone = false,
  onDrop,
  collectionCounts = {} 
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    if (showDropZone) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  
  const handleDrop = (e: React.DragEvent, collectionId: string | null) => {
    if (showDropZone && onDrop) {
      e.preventDefault();
      e.stopPropagation();
      const mediaId = e.dataTransfer.getData('mediaId');
      if (mediaId) {
        onDrop(mediaId, collectionId);
      }
    }
  };
  
  return (
    <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
      <Button
        variant={selectedFilter === null ? "default" : "outline"}
        size="sm"
        className="flex items-center gap-1.5"
        onClick={() => onFilterChange(null)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, null)}
      >
        All Media
      </Button>

      <Button
        variant={selectedFilter === 'uncategorized' ? "default" : "outline"}
        size="sm"
        className="flex items-center gap-1.5"
        onClick={() => onFilterChange('uncategorized')}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, null)}
      >
        <X className="h-3.5 w-3.5" />
        Uncategorized
      </Button>

      {collections.map(collection => {
        const counts = collectionCounts[collection.id] || { images: 0, videos: 0 };
        const totalItems = counts.images + counts.videos;
        
        return (
          <Button
            key={collection.id}
            variant={selectedFilter === collection.id ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-1.5 group relative"
            onClick={() => onFilterChange(collection.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, collection.id)}
          >
            <FolderIcon className="h-3.5 w-3.5" />
            {collection.name}
            
            {showDropZone && (
              <span className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded pointer-events-none">
             
              </span>
            )}
            
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {totalItems}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
};

export default CollectionFilter;
