/**
 * Client-side Canvas-based Image Compression to WebP
 * Resizes and converts images to high-performance WebP before upload.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: string;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    outputFormat = 'image/webp',
  } = options;

  // Don't attempt to compress non-image files or SVG
  if (!file.type.startsWith('image/') || file.type.includes('svg')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let width = img.width;
      let height = img.height;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file); // Fallback to original
        return;
      }

      // Smooth rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          const originalNameWithoutExt = file.name.substring(
            0,
            file.name.lastIndexOf('.')
          ) || file.name;

          const compressedFile = new File(
            [blob],
            `${originalNameWithoutExt}.webp`,
            {
              type: outputFormat,
              lastModified: Date.now(),
            }
          );

          // Return compressed file if smaller, else keep original
          if (compressedFile.size < file.size) {
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        outputFormat,
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      console.warn('Failed to load image for compression, sending original:', err);
      resolve(file);
    };

    img.src = url;
  });
}
