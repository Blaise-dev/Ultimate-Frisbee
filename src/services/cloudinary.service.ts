import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const cloudinaryEnabled = Boolean(cloudName && apiKey && apiSecret);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

const ensureCloudinaryConfigured = () => {
  if (!cloudinaryEnabled) {
    throw new Error('Cloudinary non configuré. Définissez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET.');
  }
};

export const isCloudinaryUrl = (url?: string | null): boolean => {
  if (!url) {
    return false;
  }

  return url.includes('res.cloudinary.com');
};

export const uploadImageBuffer = async (
  fileBuffer: Buffer,
  folder: string,
): Promise<{ secureUrl: string; publicId: string }> => {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload Cloudinary échoué'));
          return;
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    uploadStream.end(fileBuffer);
  });
};

export const getCloudinaryPublicIdFromUrl = (url?: string | null): string | null => {
  if (!isCloudinaryUrl(url)) {
    return null;
  }

  const uploadMarker = '/upload/';
  const markerIndex = url!.indexOf(uploadMarker);
  if (markerIndex === -1) {
    return null;
  }

  const afterUpload = url!.slice(markerIndex + uploadMarker.length);
  const withoutVersion = afterUpload.replace(/^v\d+\//, '');
  const withoutQuery = withoutVersion.split('?')[0];
  const extensionIndex = withoutQuery.lastIndexOf('.');

  if (extensionIndex === -1) {
    return withoutQuery;
  }

  return withoutQuery.slice(0, extensionIndex);
};

export const deleteCloudinaryImageByUrl = async (url?: string | null): Promise<void> => {
  const publicId = getCloudinaryPublicIdFromUrl(url);
  if (!publicId) {
    return;
  }

  ensureCloudinaryConfigured();
  await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
  });
};
