
import express from 'express';
import multer from 'multer';
import { requireUser } from '../security.js';
import { withErrors } from '../utils.js';

const router = express.Router();

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter(_req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(
        new Error('Only JPEG, PNG, WEBP or GIF supported')
      );
    }

    callback(null, true);
  }
});

function validateUpload(req, res, next) {
  upload.single('image')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';

      return res.status(tooLarge ? 413 : 400).json({
        message: tooLarge
          ? 'Image must be 5 MB or smaller'
          : 'Invalid image upload'
      });
    }

    return res.status(400).json({
      message: error.message || 'Invalid image upload'
    });
  });
}

function hasValidImageSignature(file) {
  if (!Buffer.isBuffer(file.buffer)) {
    return false;
  }

  const buffer = file.buffer;

  switch (file.mimetype) {
    case 'image/jpeg':
      return (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      );

    case 'image/png':
      return buffer.subarray(0, 8).equals(
        Buffer.from([
          0x89, 0x50, 0x4e, 0x47,
          0x0d, 0x0a, 0x1a, 0x0a
        ])
      );

    case 'image/webp':
      return (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
      );

    case 'image/gif': {
      const signature = buffer.subarray(0, 6).toString('ascii');

      return (
        signature === 'GIF87a' ||
        signature === 'GIF89a'
      );
    }

    default:
      return false;
  }
}

router.post(
  '/',
  requireUser,
  validateUpload,
  withErrors(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        message: 'Select an image'
      });
    }

    if (!hasValidImageSignature(req.file)) {
      return res.status(400).json({
        message: 'Invalid image file. Upload a genuine JPEG, PNG, WEBP or GIF image.'
      });
    }

    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        message: 'Image upload is unavailable. Configure IMGBB_API_KEY or paste an image URL.'
      });
    }

    const formData = new FormData();

    formData.append(
      'image',
      req.file.buffer.toString('base64')
    );

    let response;

    try {
      response = await fetch(
        `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(20000)
        }
      );
    } catch (error) {
      console.error(
        '[Upload] Image host request failed:',
        error.message
      );

      return res.status(502).json({
        message: 'Could not connect to the image hosting service'
      });
    }

    let data;

    try {
      data = await response.json();
    } catch {
      return res.status(502).json({
        message: 'Image host returned an invalid response'
      });
    }

    const imageUrl = data?.data?.url;

    if (
      !response.ok ||
      data?.success !== true ||
      typeof imageUrl !== 'string'
    ) {
      return res.status(502).json({
        message: 'Image host could not process your upload'
      });
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return res.status(502).json({
        message: 'Image host returned an invalid image URL'
      });
    }

    if (parsedUrl.protocol !== 'https:') {
      return res.status(502).json({
        message: 'Image host returned an insecure image URL'
      });
    }

    res.json({
      url: parsedUrl.toString()
    });
  })
);

export default router;
