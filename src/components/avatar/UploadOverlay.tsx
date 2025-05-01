
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';

interface UploadOverlayProps {
  size: 'sm' | 'md' | 'lg';
  uploading: boolean;
}

export function UploadOverlay({ size, uploading }: UploadOverlayProps) {
  const uploadButtonSizes = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-10 h-10 p-2'
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
      <Button
        variant="ghost"
        size="icon"
        className={`${uploadButtonSizes[size]} bg-purple-600 hover:bg-purple-700 text-white rounded-full`}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Upload />
        )}
      </Button>
    </div>
  );
}
