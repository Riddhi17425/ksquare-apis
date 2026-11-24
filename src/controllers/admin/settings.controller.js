import { settingsService } from "../../services/settings.service.js";
import { ok } from "../../utils/response.js";

export const get = async (_req, res) => ok(res, await settingsService.get());

export const update = async (req, res) => ok(res, await settingsService.save(req.valid.body), { message: "Settings saved" });
