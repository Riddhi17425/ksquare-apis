import { pressReleaseModel } from "../../models/pressRelease.model.js";
import { imageUrl } from "../../services/image.service.js";
import { ok } from "../../utils/response.js";

/** [{ title, url (string | null), description (HTML), img (URL) }], newest first. */
export const list = async (_req, res) => {
  const rows = await pressReleaseModel.listPublished();
  ok(res, rows.map((r) => ({ title: r.title, url: r.url, description: r.description, img: imageUrl(r.img) })));
};
