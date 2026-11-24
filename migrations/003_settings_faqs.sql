-- Site settings: a single row (id = 1) holding the social links ...
CREATE TABLE settings (
  id             TINYINT UNSIGNED NOT NULL,
  facebook_link  VARCHAR(255) NULL,
  instagram_link VARCHAR(255) NULL,
  linkedin_link  VARCHAR(255) NULL,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO settings (id) VALUES (1);

-- ... plus any number of call / email / address entries
CREATE TABLE setting_entries (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  setting_id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  type       ENUM('call','email','address') NOT NULL,
  value      VARCHAR(500) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_setting_entries_type (setting_id, type, sort_order),
  CONSTRAINT fk_setting_entries_setting FOREIGN KEY (setting_id) REFERENCES settings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAQ categories (soft deleted through deleted_at)
CREATE TABLE faq_categories (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(150) NOT NULL,
  status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME NULL,
  -- name must be unique among non-deleted categories only (NULLs never collide)
  active_name VARCHAR(150) GENERATED ALWAYS AS (IF(deleted_at IS NULL, name, NULL)) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_faq_categories_active_name (active_name),
  KEY idx_faq_categories_status (status, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAQs belong to a category
CREATE TABLE faqs (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id INT UNSIGNED NOT NULL,
  question    VARCHAR(500) NOT NULL,
  answer      TEXT NOT NULL,
  sort_order  INT UNSIGNED NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_faqs_category_order (category_id, sort_order),
  CONSTRAINT fk_faqs_category FOREIGN KEY (category_id) REFERENCES faq_categories (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
