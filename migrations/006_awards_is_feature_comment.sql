-- Document what is_feature stores (no data or behaviour change).
ALTER TABLE awards_timelines
  MODIFY COLUMN is_feature TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Featured award: 1 = Yes, 0 = No (default)';
