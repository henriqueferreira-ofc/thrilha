
import React from 'react';
import { ImageLoader } from './ui/image-loader';

interface ImageTestProps {
  imageUrl: string;
}

// This component is now just a wrapper around ImageLoader for backward compatibility
export function ImageTest({ imageUrl }: ImageTestProps) {
  return <ImageLoader imageUrl={imageUrl} alt="Avatar do usuário" />;
}
