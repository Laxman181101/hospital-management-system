import React, { useState, useRef } from 'react';
import { User, Camera, Loader2 } from 'lucide-react';
import ImageCropper from './ImageCropper';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ProfilePictureUpload = ({ currentImage, size = 'w-24 h-24', onUploadSuccess }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { updateUser } = useAuth();
  const { addToast } = useToast();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result));
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input so same file can be selected again
    }
  };

  const handleSaveCrop = async (croppedBlob) => {
    setImageSrc(null); // Close cropper modal
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', croppedBlob, 'profile.jpg');

      const res = await api.patch('/api/v1/auth/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success || res.status === 200) {
        addToast('success', 'Profile photo updated successfully');
        const newPhotoUrl = res.data.profilePicture || res.data.photo;
        
        // Update global auth state
        if (updateUser) {
          updateUser({ profilePicture: newPhotoUrl });
        }
        
        // Call optional callback
        if (onUploadSuccess) {
          onUploadSuccess(newPhotoUrl);
        }
      }
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Failed to update profile photo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div 
        className={`${size} rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden relative group cursor-pointer flex-shrink-0`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-50">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : currentImage ? (
          <img src={currentImage} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <User className="w-1/3 h-1/3" />
          </div>
        )}
        
        {!isUploading && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="text-white mb-1" size={16} />
            <span className="text-white text-[10px] font-semibold">Change</span>
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/png, image/jpeg, image/jpg" 
        className="hidden" 
      />

      {imageSrc && (
        <ImageCropper 
          imageSrc={imageSrc} 
          onSave={handleSaveCrop} 
          onCancel={() => setImageSrc(null)} 
        />
      )}
    </>
  );
};

export default ProfilePictureUpload;
