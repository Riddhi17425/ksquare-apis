-- Category: status, soft delete, short lines, extra images and type
ALTER TABLE categories
  ADD COLUMN product_short_line       VARCHAR(255) NULL AFTER product_summary,
  ADD COLUMN configuration_short_line VARCHAR(255) NULL AFTER product_short_line,
  ADD COLUMN why_choose_img           VARCHAR(255) NULL AFTER why_choose_desc,
  ADD COLUMN menu_img                 VARCHAR(255) NULL AFTER why_choose_img,
  ADD COLUMN type                     ENUM('core','brand') NOT NULL DEFAULT 'core' AFTER menu_img,
  ADD COLUMN status                   ENUM('active','inactive') NOT NULL DEFAULT 'active' AFTER type,
  ADD COLUMN deleted_at               DATETIME NULL DEFAULT NULL AFTER updated_at,
  ADD KEY idx_categories_status (status, deleted_at),
  ADD KEY idx_categories_type (type);
