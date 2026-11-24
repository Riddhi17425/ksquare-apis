import { blogService } from "../../services/blog.service.js";
import { ok } from "../../utils/response.js";

export const list = async (req, res) => {
  const { rows, meta } = await blogService.listPublished(req.valid.query);
  ok(res, rows, { meta });
};

export const get = async (req, res) => ok(res, await blogService.getPublished(req.valid.params.url));
