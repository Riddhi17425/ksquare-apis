import { profileService } from "../../services/profile.service.js";
import { ok } from "../../utils/response.js";

export const get = async (req, res) => ok(res, await profileService.get(req.admin.id));

export const update = async (req, res) =>
  ok(res, await profileService.update(req.admin.id, req.valid.body), { message: "Profile updated" });

export const changePassword = async (req, res) => {
  await profileService.changePassword(req.admin.id, req.sessionId, req.valid.body);
  ok(res, null, { message: "Password changed. Other devices were signed out." });
};
