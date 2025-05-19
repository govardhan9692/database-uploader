
import React from 'react';
import { MediaItem } from '../../services/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Copy, Trash2, ExternalLink, ImageIcon, VideoIcon, Folder } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface MediaPreviewModalProps {
  media: MediaItem;
  onClose: () => void;
  onDelete?: () => void;
  getCollectionName: (collectionId: string | null) => string;
}

const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  media,
  onClose,
  onDelete,
  getCollectionName
}) => {
  const { toast } = useToast();
  
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden rounded-lg glass">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            {media.resourceType === 'video' ? (
              <VideoIcon className="h-4 w-4" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            Media Preview
            {media.collectionId && (
              <Badge variant="outline" className="ml-2 flex items-center gap-1">
                <Folder className="h-3 w-3" />
                {getCollectionName(media.collectionId)}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-0 max-h-[70vh] overflow-auto bg-black/50 flex items-center justify-center">
          {media.resourceType === 'video' ? (
            <video 
              src={media.mediaUrl} 
              controls 
              className="max-h-[70vh] max-w-full"
            />
          ) : (
            <img 
              src={media.mediaUrl} 
              alt="Selected media" 
              className="max-h-[70vh] max-w-full"
            />
          )}
        </div>
        
        <DialogFooter className="p-4 border-t border-border flex justify-between items-center bg-background/60">
          <div className="flex-1 truncate pr-4 text-muted-foreground text-sm">
            {media.mediaUrl}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => copyToClipboard(media.mediaUrl)}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" /> Copy URL
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open(media.mediaUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" /> Open
            </Button>
            
            {onDelete && (
              <Button
                variant="destructive"
                onClick={onDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPreviewModal;
