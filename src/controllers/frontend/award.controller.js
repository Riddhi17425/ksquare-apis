import { awardModel } from "../../models/award.model.js";
import { imageUrl } from "../../services/image.service.js";
import { ok } from "../../utils/response.js";

/** [{ year, title, description (HTML), img (URL | null), is_feature }], oldest first. */
export const list = async (_req, res) => {
  const rows = await awardModel.listPublished();
  ok(res, rows.map((r) => ({ year: r.year, title: r.title, description: r.description, img: imageUrl(r.img), is_feature: !!r.is_feature })));
};
