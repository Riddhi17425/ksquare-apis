/** "Cold Room (Walk-in)" -> "cold-room-walk-in" */
export const slugify = (text) =>
  String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);

/**
 * Picks the slug to store. A slug typed by the admin must be free (otherwise a field error is returned by `onTaken`);
 * an empty one is generated from the name, with "-2", "-3"… added until it is free.
 * `exists(slug)` tells whether another live record already uses it.
 */
export async function resolveSlug({ slug, name, exists, onTaken }) {
  if (slug) {
    if (await exists(slug)) throw onTaken();
    return slug;
  }
  const base = slugify(name) || "item";
  let candidate = base;
  for (let n = 2; await exists(candidate); n++) candidate = `${base}-${n}`;
  return candidate;
}
