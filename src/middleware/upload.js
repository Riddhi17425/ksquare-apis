import multer from "multer";
import { MAX_IMAGE_BYTES } from "../services/image.service.js";

const upload = multer({
  storage: multer.memoryStorage(), // files are validated first; only then written to disk (see UploadSession)
  limits: { fileSize: MAX_IMAGE_BYTES, files: 15, fields: 60, fieldSize: 512 * 1024 },
});

/** multipart/form-data parser accepting one file per listed field name. Non-multipart (JSON) requests pass through. */
export const uploadImages = (names) => upload.fields(names.map((name) => ({ name, maxCount: 1 })));
