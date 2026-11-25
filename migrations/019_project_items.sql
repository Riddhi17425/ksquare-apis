-- A project now has a category, a list of named pictures (project_images) and a list of project entries (project_items):
-- the single image / title / tag / location / short note / power capacity columns move into the entries.
CREATE TABLE project_items (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id      INT UNSIGNED NOT NULL,
  project_img     VARCHAR(255) NOT NULL,
  tag             VARCHAR(100) NULL,
  title           VARCHAR(255) NOT NULL,
  location        VARCHAR(255) NULL,
  short_note      VARCHAR(500) NULL,
  power_capacity  VARCHAR(100) NULL,
  sort_order      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_project_items_project (project_id, sort_order),
  CONSTRAINT fk_project_items_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE projects
  DROP COLUMN project_img,
  DROP COLUMN title,
  DROP COLUMN tag,
  DROP COLUMN location,
  DROP COLUMN short_note,
  DROP COLUMN power_capacity;
