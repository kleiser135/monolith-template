'use client';

import { useState, useRef } from 'react';
import { Upload, User, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button/button';
import { toast } from 'sonner';
import Image from 'next/image';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onAvatarUpdate?: (newAvatarUrl: string | null) => void;
}

export function AvatarUpload({ currentAvatar, onAvatarUpdate }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorData?.message || errorMessage;
        } catch (e) {
          // Ignore JSON parse errors, use default message
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // The API may return the avatar URL in two formats for backward compatibility:
      // 1. New format: result.user.avatar (string, relative path)
      // 2. Old format: result.avatarUrl (string, absolute or relative path)
      // This logic supports both formats until the API is standardized.
      let newAvatarUrl: string | null = null;
      
      if (result.user && typeof result.user.avatar === 'string' && result.user.avatar.length > 0) {
        newAvatarUrl = `/${result.user.avatar}`;
      } else if (typeof result.avatarUrl === 'string' && result.avatarUrl.length > 0) {
        newAvatarUrl = result.avatarUrl;
      } else {
        newAvatarUrl = null;
      }
      
      setPreviewUrl(newAvatarUrl);
      onAvatarUpdate?.(newAvatarUrl);
      toast.success(result.message || 'Avatar updated successfully');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(error?.message || 'Failed to update avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMessage = 'Failed to remove avatar';
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch (jsonError) {
          // Ignore JSON parse errors, use default message
        }
        throw new Error(errorMessage);
      }

      setPreviewUrl(null);
      onAvatarUpdate?.(null);
      toast.success('Avatar removed successfully');
    } catch (error: any) {
      console.error('Avatar remove error:', error);
      toast.error(error?.message || 'Failed to remove avatar');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Profile avatar"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" aria-label="User icon">
              <User className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
          )}
        </div>

        {/* Remove Avatar Button */}
        {previewUrl && !isUploading && (
          <button
            onClick={handleRemoveAvatar}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            title="Remove avatar"
            aria-label="Remove avatar"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex flex-col items-center space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-white dark:bg-slate-800"
        >
          <Upload className="w-4 h-4 mr-2" />
          {previewUrl ? 'Change Avatar' : 'Upload Avatar'}
        </Button>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Image files, max 5MB.
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
