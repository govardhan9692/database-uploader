
import React from 'react';
import { Card } from '@/components/ui/card';

const MediaGalleryLoading: React.FC = () => {
  return (
    <Card className="w-full p-8 flex flex-col items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-r-transparent animate-spin mx-auto"></div>
      <p className="mt-4 text-muted-foreground">Loading media...</p>
    </Card>
  );
};

export default MediaGalleryLoading;
