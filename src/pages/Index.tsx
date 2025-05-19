
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCurrentUser, logoutUser, deleteMedia } from '../services/firebase';
import Authentication from '../components/Authentication';
import MediaUploader from '../components/MediaUploader';
import MediaGallery from '../components/MediaGallery';
import DashboardSidebar from '../components/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { LogOut, ImageIcon, VideoIcon, FolderIcon, Grid2X2Icon, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CollectionsView from '@/components/CollectionsView';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshGallery, setRefreshGallery] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'all';
  const { toast } = useToast();
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      setUser(null);
    } else {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Failed to log out. Please try again."
      });
    }
  };

  const handleUploadSuccess = () => {
    setRefreshGallery(prev => prev + 1);
    toast({
      title: "Upload Complete",
      description: "Your media has been uploaded successfully."
    });
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleDeleteMedia = async (mediaId: string) => {
    setMediaToDelete(mediaId);
  };

  const confirmDelete = async () => {
    if (!mediaToDelete) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteMedia(mediaToDelete);
      if (result.success) {
        toast({
          title: "Media Deleted",
          description: "The media has been successfully deleted."
        });
        setRefreshGallery(prev => prev + 1);
      } else {
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: result.error || "Failed to delete media"
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        variant: "destructive",
        title: "Delete Error",
        description: "An error occurred while deleting the media"
      });
    } finally {
      setIsDeleting(false);
      setMediaToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-r-transparent animate-spin"></div>
        <p className="mt-4 text-muted-foreground">Loading app...</p>
      </div>
    );
  }

  if (!user) {
    return <Authentication onAuthSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen flex flex-row bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <DashboardSidebar 
        onLogout={handleLogout}
        userName={user.displayName || "User"}
        userEmail={user.email}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="glass sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-md shadow-sm">
          <div className="flex justify-between items-center p-4">
            <h1 className="text-2xl font-bold">
              {activeTab === 'all' && 'Media Dashboard'}
              {activeTab === 'images' && 'Images Gallery'}
              {activeTab === 'videos' && 'Video Library'}
              {activeTab === 'collections' && 'Collections'}
            </h1>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">
                {user.email}
              </span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" /> Log Out
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Tabs 
            value={activeTab} 
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto mb-8">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Grid2X2Icon className="h-4 w-4" /> All Media
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Images
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <VideoIcon className="h-4 w-4" /> Videos
              </TabsTrigger>
              <TabsTrigger value="collections" className="flex items-center gap-2">
                <FolderIcon className="h-4 w-4" /> Collections
              </TabsTrigger>
            </TabsList>

            <div className="grid md:grid-cols-12 gap-6">
              {/* Media Uploader (shown in all tabs) */}
              <div className="md:col-span-4 lg:col-span-3">
                <MediaUploader 
                  userId={user.uid} 
                  onUploadSuccess={handleUploadSuccess} 
                />
              </div>
              
              {/* Content Tabs */}
              <div className="md:col-span-8 lg:col-span-9">
                <TabsContent value="all" className="mt-0">
                  <MediaGallery 
                    userId={user.uid} 
                    refreshTrigger={refreshGallery}
                    filter={null}
                    onDeleteMedia={handleDeleteMedia}
                  />
                </TabsContent>
                
                <TabsContent value="images" className="mt-0">
                  <MediaGallery 
                    userId={user.uid} 
                    refreshTrigger={refreshGallery}
                    filter="image"
                    onDeleteMedia={handleDeleteMedia}
                  />
                </TabsContent>
                
                <TabsContent value="videos" className="mt-0">
                  <MediaGallery 
                    userId={user.uid} 
                    refreshTrigger={refreshGallery}
                    filter="video"
                    onDeleteMedia={handleDeleteMedia}
                  />
                </TabsContent>
                
                <TabsContent value="collections" className="mt-0">
                  <CollectionsView 
                    userId={user.uid} 
                    refreshTrigger={refreshGallery}
                    onDeleteMedia={handleDeleteMedia}
                  />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </main>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!mediaToDelete} onOpenChange={(open) => !open && setMediaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this media? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
