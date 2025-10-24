
import React from 'react';

interface ImagePreviewProps {
  src: string;
  alt: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ src, alt }) => {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2 text-gray-300">Generated Image:</h3>
      <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700">
        <img src={src} alt={alt} className="w-full h-auto rounded-md object-contain" />
      </div>
    </div>
  );
};
