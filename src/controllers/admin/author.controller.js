import { blogModel } from "../../models/blog.model.js";
import { ok } from "../../utils/response.js";

/** Active blog authors, used to pick a blog's author. */
export const list = async (_req, res) => ok(res, await blogModel.authors());
