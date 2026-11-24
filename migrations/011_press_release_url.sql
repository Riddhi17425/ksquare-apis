-- Optional link to the full press release / coverage.
ALTER TABLE press_releases ADD COLUMN url VARCHAR(255) NULL AFTER title;
