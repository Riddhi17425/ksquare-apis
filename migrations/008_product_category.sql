-- Each product belongs to one product category (table `categories`)
ALTER TABLE products
  ADD COLUMN category_id INT UNSIGNED NULL AFTER id,
  ADD KEY idx_products_category (category_id),
  ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT;
