-- short_description now holds sanitized HTML from the rich-text editor, so it can exceed 500 characters.
ALTER TABLE products MODIFY short_description TEXT NOT NULL;
