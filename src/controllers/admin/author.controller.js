import { adminModel } from "../../models/admin.model.js";
import { ok } from "../../utils/response.js";

/** Active admins, used to pick a blog's author. */
export const list = async (_req, res) => ok(res, await adminModel.listActive());
