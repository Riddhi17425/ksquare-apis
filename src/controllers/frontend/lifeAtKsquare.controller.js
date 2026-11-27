import { lifeAtKsquareModel } from "../../models/lifeAtKsquare.model.js";
import { imageUrl } from "../../services/image.service.js";
import { ok } from "../../utils/response.js";

/** [{ img (URL) }], in the order they were added. */
export const list = async (_req, res) => {
  const rows = await lifeAtKsquareModel.listPublished();
  ok(res, rows.map((r) => ({ img: imageUrl(r.img) })));
};
