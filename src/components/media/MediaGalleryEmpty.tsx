
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon, VideoIcon, Folder as FolderIcon } from 'lucide-react';

interface MediaGalleryEmptyProps {
  filter?: 'image' | 'video' | null;
  selectedFilter: string | null;
}

const MediaGalleryEmpty: React.FC<MediaGalleryEmptyProps> = ({ filter, selectedFilter }) => {
  return (
    <Card className="w-full text-center py-12 glass card-gradient">
      <CardContent className="pt-6">
        <div className="flex justify-center mb-4">
          {filter === 'image' ? (
            <ImageIcon className="h-12 w-12 text-muted-foreground opacity-20" />
          ) : filter === 'video' ? (
            <VideoIcon className="h-12 w-12 text-muted-foreground opacity-20" />
          ) : (
            <FolderIcon className="h-12 w-12 text-muted-foreground opacity-20" />
          )}
        </div>
        <p className="text-lg text-muted-foreground">No media found</p>
        {selectedFilter ? (
          <p className="mt-2">This collection is empty</p>
        ) : (
          <p className="mt-2">Upload your first {filter || 'media'} to get started</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MediaGalleryEmpty;
