-- Editable text sections of website pages (one JSON document per page), e.g. the Projects page's table, steps and FAQs.
CREATE TABLE page_content (
  page        VARCHAR(50) NOT NULL,
  content     LONGTEXT NOT NULL,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (page)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
