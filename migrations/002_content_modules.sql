-- Client testimonials
CREATE TABLE testimonials (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  profile_photo VARCHAR(255) NULL,
  name          VARCHAR(120) NOT NULL,
  company       VARCHAR(150) NOT NULL,
  description   TEXT NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_testimonials_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blogs (soft deleted through deleted_at)
CREATE TABLE blogs (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  author_id         INT UNSIGNED NOT NULL,
  title             VARCHAR(255) NOT NULL,
  short_description VARCHAR(500) NOT NULL,
  description       MEDIUMTEXT NOT NULL,
  `date`            DATE NOT NULL,
  front_image       VARCHAR(255) NOT NULL,
  detail_image      VARCHAR(255) NOT NULL,
  cta_text          VARCHAR(255) NOT NULL,
  cta_image         VARCHAR(255) NOT NULL,
  conclusion        TEXT NOT NULL,
  url               VARCHAR(191) NOT NULL,
  status            ENUM('draft','published') NOT NULL DEFAULT 'draft',
  meta_title        VARCHAR(255) NOT NULL,
  meta_description  VARCHAR(500) NOT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        DATETIME NULL,
  -- URL must be unique among non-deleted blogs only (NULLs never collide), so a deleted blog's URL can be reused.
  active_url        VARCHAR(191) GENERATED ALWAYS AS (IF(deleted_at IS NULL, url, NULL)) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_blogs_active_url (active_url),
  KEY idx_blogs_status_date (status, `date`),
  KEY idx_blogs_deleted (deleted_at),
  KEY idx_blogs_author (author_id),
  CONSTRAINT fk_blogs_author FOREIGN KEY (author_id) REFERENCES admins (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories
CREATE TABLE categories (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  list_image          VARCHAR(255) NOT NULL,
  name                VARCHAR(150) NOT NULL,
  short_description   VARCHAR(500) NOT NULL,
  title               VARCHAR(255) NOT NULL,
  detail_image_d      VARCHAR(255) NOT NULL,
  detail_image_m      VARCHAR(255) NOT NULL,
  product_summary     TEXT NULL,
  why_choose_summary  TEXT NULL,
  why_choose_title    VARCHAR(255) NULL,
  why_choose_desc     TEXT NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Category configuration entries (title / description / icon), many per category
CREATE TABLE category_configurations (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id INT UNSIGNED NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon        VARCHAR(255) NOT NULL,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_category_config_category (category_id, sort_order),
  CONSTRAINT fk_category_config_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
