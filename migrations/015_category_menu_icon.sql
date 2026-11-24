-- Small icon shown next to the category in the website menu (separate from the larger "menu image").
ALTER TABLE categories ADD COLUMN menu_icon VARCHAR(255) NULL AFTER menu_img;
