-- Certificates are downloadable PDFs: the preview image and the download link are replaced by an uploaded PDF file.
ALTER TABLE certificates
  DROP COLUMN img,
  DROP COLUMN file_url,
  ADD COLUMN pdf_file VARCHAR(255) NULL AFTER name;
