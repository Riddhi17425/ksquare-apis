-- Products (status + soft delete), with their detail images and FAQs
CREATE TABLE products (
  id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status                 ENUM('active','inactive') NOT NULL DEFAULT 'active',
  name                   VARCHAR(255) NOT NULL,
  short_description      VARCHAR(500) NOT NULL,
  list_img               VARCHAR(255) NOT NULL,
  title                  VARCHAR(255) NOT NULL,
  product_info           TEXT NULL,
  highlights             MEDIUMTEXT NULL,
  benefits               MEDIUMTEXT NULL,
  features               MEDIUMTEXT NULL,
  technical_specification MEDIUMTEXT NULL,
  installation_process   MEDIUMTEXT NULL,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at             DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_products_status (status, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_images (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED NOT NULL,
  img        VARCHAR(255) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_product_images_product (product_id, sort_order),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_faqs (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id   INT UNSIGNED NOT NULL,
  faq_question VARCHAR(500) NOT NULL,
  faq_answer   TEXT NOT NULL,
  sort_order   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_product_faqs_product (product_id, sort_order),
  CONSTRAINT fk_product_faqs_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ksquare presence: one row per state, with any number of cities
CREATE TABLE ksquare_presences (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status     ENUM('active','inactive') NOT NULL DEFAULT 'active',
  state_name VARCHAR(150) NOT NULL,
  state_link VARCHAR(255) NULL,
  map_img    VARCHAR(255) NOT NULL,
  short_line VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_presences_status (status, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ksquare_presence_cities (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  presence_id INT UNSIGNED NOT NULL,
  city_name   VARCHAR(150) NOT NULL,
  city_link   VARCHAR(255) NULL,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_presence_cities_presence (presence_id, sort_order),
  CONSTRAINT fk_presence_cities_presence FOREIGN KEY (presence_id) REFERENCES ksquare_presences (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
