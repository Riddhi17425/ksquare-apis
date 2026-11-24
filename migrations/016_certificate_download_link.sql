-- Certificates double as the website's downloads: each one can carry a link to its file (PDF), and the preview image becomes optional.
ALTER TABLE certificates
  MODIFY img VARCHAR(255) NULL,
  ADD COLUMN file_url VARCHAR(255) NULL AFTER img;
