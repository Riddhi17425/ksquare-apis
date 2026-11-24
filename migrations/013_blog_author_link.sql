-- A blog's author is now one of the "Blog authors" (blog_authors), which carry the bio, photo and LinkedIn link
-- shown on the website. No blogs existed when this was applied, so no data needs converting.
ALTER TABLE blogs DROP FOREIGN KEY fk_blogs_author;
ALTER TABLE blogs ADD CONSTRAINT fk_blogs_author FOREIGN KEY (author_id) REFERENCES blog_authors (id) ON DELETE RESTRICT;
