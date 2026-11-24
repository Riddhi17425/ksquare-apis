-- Category short description now holds sanitized HTML from the rich-text editor, so it can exceed 500 characters.
ALTER TABLE categories MODIFY short_description TEXT NOT NULL;
