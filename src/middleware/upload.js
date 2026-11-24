import multer from "multer";
import { MAX_DOCUMENT_BYTES, MAX_IMAGE_BYTES } from "../services/image.service.js";

const upload = multer({
  storage: multer.memoryStorage(), // files are validated first; only then written to disk (see UploadSession)
  limits: { fileSize: MAX_IMAGE_BYTES, files: 40, fields: 80, fieldSize: 512 * 1024 },
});

const uploadDocs = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENT_BYTES, files: 10, fields: 40, fieldSize: 512 * 1024 },
});

/** Same as uploadImages, for fields that hold PDF documents (larger size limit). */
export const uploadDocuments = (names) => uploadDocs.fields(names.map((name) => ({ name, maxCount: 1 })));

/** multipart/form-data parser accepting one file per listed field name. Non-multipart (JSON) requests pass through. */
export const uploadImages = (names) => upload.fields(names.map((name) => ({ name, maxCount: 1 })));
