-- SEO fields for categories and products: slug (unique among live rows), meta title, meta description.
ALTER TABLE categories
  ADD COLUMN slug VARCHAR(191) NULL AFTER name,
  ADD COLUMN meta_title VARCHAR(255) NULL,
  ADD COLUMN meta_description VARCHAR(500) NULL;

ALTER TABLE products
  ADD COLUMN slug VARCHAR(191) NULL AFTER name,
  ADD COLUMN meta_title VARCHAR(255) NULL,
  ADD COLUMN meta_description VARCHAR(500) NULL;

-- Backfill existing rows from the name ("Cold Room" -> "cold-room"); names with no letters/digits become "item-<id>".
UPDATE categories SET slug = TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-')));
UPDATE categories SET slug = CONCAT('item-', id) WHERE slug = '' OR slug IS NULL;
UPDATE products SET slug = TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-')));
UPDATE products SET slug = CONCAT('item-', id) WHERE slug = '' OR slug IS NULL;

-- Duplicates among live rows (the later row gets "-<id>").
UPDATE categories c SET c.slug = CONCAT(LEFT(c.slug, 180), '-', c.id)
 WHERE c.deleted_at IS NULL AND EXISTS (SELECT 1 FROM (SELECT id, slug FROM categories WHERE deleted_at IS NULL) o WHERE o.slug = c.slug AND o.id < c.id);
UPDATE products p SET p.slug = CONCAT(LEFT(p.slug, 180), '-', p.id)
 WHERE p.deleted_at IS NULL AND EXISTS (SELECT 1 FROM (SELECT id, slug FROM products WHERE deleted_at IS NULL) o WHERE o.slug = p.slug AND o.id < p.id);

ALTER TABLE categories
  MODIFY slug VARCHAR(191) NOT NULL,
  ADD COLUMN active_slug VARCHAR(191) GENERATED ALWAYS AS (IF(deleted_at IS NULL, slug, NULL)) STORED,
  ADD UNIQUE KEY uq_categories_active_slug (active_slug);

ALTER TABLE products
  MODIFY slug VARCHAR(191) NOT NULL,
  ADD COLUMN active_slug VARCHAR(191) GENERATED ALWAYS AS (IF(deleted_at IS NULL, slug, NULL)) STORED,
  ADD UNIQUE KEY uq_products_active_slug (active_slug);
