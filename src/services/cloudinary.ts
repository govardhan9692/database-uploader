interface CloudinaryResponse {
  secure_url: string;
  resource_type: string;
  error?: string;
}

// Update these values to match your Cloudinary account credentials
const CLOUDINARY_CLOUD_NAME = 'dvmrhs2ek';
const CLOUDINARY_UPLOAD_PRESET = 'DatabaseUpload';

export const uploadToCloudinary = async (file: File): Promise<CloudinaryResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

    // Determine resource type based on file mimetype
    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return { 
      secure_url: data.secure_url,
      resource_type: resourceType
    };
  } catch (error: any) {
    console.error("Error uploading to Cloudinary:", error);
    return { secure_url: '', resource_type: 'image', error: error.message };
  }
};
