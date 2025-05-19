
import React, { useState, useEffect } from 'react';
import { saveMediaToFirestore, getUserCollections, Collection } from '../services/firebase';
import { useToast } from '@/hooks/use-toast';
import { Upload, Folder, ImageIcon, VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';

interface MediaUploaderProps {
  userId: string;
  onUploadSuccess?: () => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ userId, onUploadSuccess }) => {
  const [selectedTab, setSelectedTab] = useState<'image' | 'video'>('image');
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadCollections = async () => {
      try {
        const result = await getUserCollections(userId);
        if (!result.error) {
          setCollections(result.collections);
        }
      } catch (error) {
        console.error("Error loading collections:", error);
      }
    };
    
    loadCollections();
  }, [userId]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFiles(event.target.files);
    }
  };
  
  const uploadToCloudinary = async (file: File, folder = 'media_archive'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default');
    formData.append('folder', folder);
    
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/dzc5qwm6p/${file.type.startsWith('video') ? 'video' : 'image'}/upload`;
    
    try {
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload to Cloudinary');
      }
      
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };
  
  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast({
        variant: "destructive",
        title: "No files selected",
        description: "Please select files to upload"
      });
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const uploadedCount = {
        success: 0,
        failure: 0,
      };
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const resourceType = file.type.startsWith('video') ? 'video' : 'image';
        
        if ((selectedTab === 'image' && !file.type.startsWith('image')) || 
            (selectedTab === 'video' && !file.type.startsWith('video'))) {
          uploadedCount.failure++;
          continue;
        }
        
        try {
          // Upload to Cloudinary
          const mediaUrl = await uploadToCloudinary(file);
          
          // Save reference to Firestore
          const result = await saveMediaToFirestore(userId, mediaUrl, resourceType, selectedCollectionId);
          
          if (result.error) {
            uploadedCount.failure++;
            console.error('Error saving to Firestore:', result.error);
          } else {
            uploadedCount.success++;
          }
        } catch (error) {
          console.error('Error in upload process:', error);
          uploadedCount.failure++;
        }
        
        // Update progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
      
      // Show summary toast
      if (uploadedCount.success > 0) {
        toast({
          title: "Upload Complete",
          description: `Successfully uploaded ${uploadedCount.success} files${uploadedCount.failure > 0 ? ` (${uploadedCount.failure} failed)` : ''}`
        });
        
        setFiles(null);
        setUploadProgress(0);
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "Failed to upload any files. Please try again."
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "An error occurred during upload."
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Card className="shadow-md animate-fade mb-6 md:mb-0 glass card-gradient">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Media
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="image" value={selectedTab} onValueChange={(val) => setSelectedTab(val as 'image' | 'video')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Images
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <VideoIcon className="h-4 w-4" /> Videos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="image">
            <div className="rounded-lg border-2 border-dashed border-primary/30 p-6 text-center mb-4 hover:border-primary/50 transition-colors">
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <label 
                htmlFor="image-upload" 
                className="cursor-pointer block w-full h-full"
              >
                <div className="flex flex-col items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Click to select images
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF, WEBP up to 10MB
                  </p>
                </div>
              </label>
            </div>
          </TabsContent>
          
          <TabsContent value="video">
            <div className="rounded-lg border-2 border-dashed border-primary/30 p-6 text-center mb-4 hover:border-primary/50 transition-colors">
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <label 
                htmlFor="video-upload" 
                className="cursor-pointer block w-full h-full"
              >
                <div className="flex flex-col items-center justify-center">
                  <VideoIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Click to select videos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP4, WEBM up to 50MB
                  </p>
                </div>
              </label>
            </div>
          </TabsContent>
        </Tabs>
        
        {files && files.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-primary font-medium">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </p>
              <Badge variant="outline">{formatFileSize(getTotalFileSize(files))}</Badge>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 max-h-24 overflow-y-auto bg-background/50 p-2 rounded border">
              {Array.from(files).map((file, index) => (
                <li key={index} className="truncate flex justify-between">
                  <span>{file.name}</span>
                  <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">
            Select Collection (Optional)
          </label>
          <Select onValueChange={(value) => setSelectedCollectionId(value === "none" ? null : value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add to collection..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                No Collection
              </SelectItem>
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    {collection.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {uploading && uploadProgress > 0 && (
          <div className="w-full h-2 bg-secondary/20 rounded-full mb-4">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
        
        <Button
          onClick={handleUpload}
          disabled={!files || uploading}
          className="w-full flex items-center justify-center"
        >
          {uploading ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload {selectedTab === 'image' ? 'Images' : 'Videos'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

// Helper functions for file size formatting
function getTotalFileSize(files: FileList): number {
  let total = 0;
  for (let i = 0; i < files.length; i++) {
    total += files[i].size;
  }
  return total;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}

export default MediaUploader;
