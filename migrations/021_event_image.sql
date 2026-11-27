-- Events: optional picture shown on the website's News & Events page.
ALTER TABLE events
  ADD COLUMN img VARCHAR(255) NULL AFTER location;
