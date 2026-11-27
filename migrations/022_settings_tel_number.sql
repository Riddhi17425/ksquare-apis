-- Site settings: the number every "Talk to Our Experts" button dials (tel: link).
ALTER TABLE settings
  ADD COLUMN tel_number VARCHAR(30) NULL AFTER linkedin_link;
