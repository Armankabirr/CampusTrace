import ImageKit from 'imagekit';
import config from '../config/config.js';

const imageKit = new ImageKit({
  publicKey: config.imagekitPublicKey || 'public_51tKi2xpQgAOIwhvJCHX9mZ=',
  privateKey: config.imagekitPrivateKey,
  urlEndpoint: config.imagekitUrlEndpoint || 'https://ik.imagekit.io/campustrace',
});

export const uploadImageToImageKit = async (file, fileName) => {
  try {
    if (!file || !file.buffer) {
      throw new Error('Invalid file provided');
    }

    const uploadResponse = await imageKit.upload({
      file: file.buffer,
      fileName: fileName || `report-${Date.now()}`,
      folder: '/campustrace-reports',
      useUniqueFileName: true,
    });

    return {
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      success: true,
    };
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

export const deleteImageFromImageKit = async (fileId) => {
  try {
    if (!fileId) {
      throw new Error('File ID is required');
    }

    await imageKit.deleteFile(fileId);

    return { success: true };
  } catch (error) {
    console.error('ImageKit delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};
