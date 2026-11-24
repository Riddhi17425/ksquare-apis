export const pageMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

/** Escapes LIKE wildcards so a search for "50%" matches literally. */
export const likeTerm = (q) => `%${q.replace(/[\\%_]/g, "\\$&")}%`;
