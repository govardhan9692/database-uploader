
import React, { useState, useRef } from 'react';
import { uploadToCloudinary } from '../services/cloudinary';
import { saveMediaToFirestore } from '../services/firebase';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface ImageUploaderProps {
  userId: string;
  onUploadSuccess: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ userId, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };
  
  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    
    // Check if file is an image
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }
    
    setFile(selectedFile);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Fake progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
      
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (uploadResult.error) {
        throw new Error(uploadResult.error);
      }
      
      // Save to Firestore
      const firestoreResult = await saveMediaToFirestore(
        userId, 
        uploadResult.secure_url, 
        uploadResult.resource_type
      );
      
      if (firestoreResult.error) {
        throw new Error(firestoreResult.error);
      }
      
      // Success - notify parent and reset
      setTimeout(() => {
        setFile(null);
        setUploadProgress(0);
        setIsUploading(false);
        onUploadSuccess();
      }, 500);
      
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setIsUploading(false);
    }
  };
  
  return (
    <div className="glass card-gradient p-6 rounded-xl animate-fade">
      <h2 className="text-2xl font-bold mb-4">Upload Image</h2>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-border hover:border-primary/50'
        } transition-colors cursor-pointer mb-4`}
        onClick={triggerFileInput}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        
        <Upload className="mx-auto h-12 w-12 mb-2 text-muted-foreground" />
        
        <p className="text-muted-foreground">
          {file 
            ? file.name 
            : 'Drag & drop an image here or click to browse'}
        </p>
        
        {file && (
          <div className="mt-4">
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="max-h-40 mx-auto rounded-md"
            />
          </div>
        )}
      </div>
      
      {isUploading && (
        <div className="mb-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-center text-sm mt-1 text-muted-foreground">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-destructive/20 border border-destructive/50 rounded-md text-sm text-destructive mb-4 animate-fade">
          {error}
        </div>
      )}
      
      <Button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="btn btn-primary w-full"
      >
        {isUploading ? 'Uploading...' : 'Upload Image'}
      </Button>
    </div>
  );
};

export default ImageUploader;
