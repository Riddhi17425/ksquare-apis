-- Projects: the card image is now "project_img", plus tag / location / short note / power capacity,
-- and a gallery of named pictures ("project_images").
ALTER TABLE projects
  CHANGE img project_img VARCHAR(255) NOT NULL,
  ADD COLUMN tag VARCHAR(100) NULL AFTER title,
  ADD COLUMN location VARCHAR(255) NULL AFTER tag,
  ADD COLUMN short_note VARCHAR(500) NULL AFTER location,
  ADD COLUMN power_capacity VARCHAR(100) NULL AFTER short_note;

CREATE TABLE project_images (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id  INT UNSIGNED NOT NULL,
  img         VARCHAR(255) NOT NULL,
  name        VARCHAR(150) NOT NULL,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_project_images_project (project_id, sort_order),
  CONSTRAINT fk_project_images_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
