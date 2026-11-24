-- Blog authors, certificates, awards, events, press releases, careers, life at Ksquare, projects.
-- Every table: status (active/inactive) + deleted_at (soft delete).

CREATE TABLE blog_authors (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status             ENUM('active','inactive') NOT NULL DEFAULT 'active',
  name               VARCHAR(150) NOT NULL,
  designation        VARCHAR(150) NOT NULL,
  years_of_exp       TINYINT UNSIGNED NOT NULL,
  description        TEXT NOT NULL,
  meta_title         VARCHAR(255) NULL,
  meta_description   VARCHAR(500) NULL,
  main_img           VARCHAR(255) NOT NULL,
  thumbnail_img      VARCHAR(255) NULL,
  social_media_name  VARCHAR(100) NULL,
  social_media_url   VARCHAR(255) NULL,
  social_media_image VARCHAR(255) NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at         DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_blog_authors_status (status, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE certificate_category (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  name        VARCHAR(150) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_certificate_category_status (status, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE certificates (
  id                       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status                   ENUM('active','inactive') NOT NULL DEFAULT 'active',
  certificate_category_id  INT UNSIGNED NOT NULL,
  name                     VARCHAR(255) NOT NULL,
  img                      VARCHAR(255) NOT NULL,
  created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at               DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_certificates_category (certificate_category_id, status, deleted_at),
  CONSTRAINT fk_certificates_category FOREIGN KEY (certificate_category_id) REFERENCES certificate_category (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE awards_timelines (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  year        SMALLINT UNSIGNED NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  img         VARCHAR(255) NULL,
  is_feature  TINYINT(1) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_awards_timelines_status (status, deleted_at, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE events (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  name        VARCHAR(255) NOT NULL,
  location    VARCHAR(255) NOT NULL,
  from_date   DATE NOT NULL,
  to_date     DATE NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_events_status (status, deleted_at, from_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE press_releases (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  img         VARCHAR(255) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_press_releases_status (status, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE career_department (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  name        VARCHAR(150) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_career_department_status (status, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE jobs (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status               ENUM('active','inactive') NOT NULL DEFAULT 'active',
  name                 VARCHAR(255) NOT NULL,
  career_department_id INT UNSIGNED NOT NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at           DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_jobs_department (career_department_id, status, deleted_at),
  CONSTRAINT fk_jobs_department FOREIGN KEY (career_department_id) REFERENCES career_department (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE life_at_ksquare (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  img         VARCHAR(255) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_life_at_ksquare_status (status, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE project_categories (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  category    VARCHAR(150) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_project_categories_status (status, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE projects (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status                ENUM('active','inactive') NOT NULL DEFAULT 'active',
  project_categories_id INT UNSIGNED NOT NULL,
  img                   VARCHAR(255) NOT NULL,
  title                 VARCHAR(255) NOT NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at            DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_projects_category (project_categories_id, status, deleted_at),
  CONSTRAINT fk_projects_category FOREIGN KEY (project_categories_id) REFERENCES project_categories (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
