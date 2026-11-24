import { downloadModel } from "../../models/download.model.js";
import { imageUrl } from "../../services/image.service.js";
import { ok } from "../../utils/response.js";

/** Categories that have downloads, each with its files: [{ name, items: [{ title, url }] }] */
export const list = async (_req, res) => {
  const categories = new Map();
  for (const row of await downloadModel.listPublished()) {
    if (!categories.has(row.category_id)) categories.set(row.category_id, { name: row.category, items: [] });
    categories.get(row.category_id).items.push({ title: row.title, url: imageUrl(row.url) });
  }
  ok(res, [...categories.values()]);
};
