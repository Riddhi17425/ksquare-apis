import { presenceService } from "../../services/presence.service.js";
import { created, ok } from "../../utils/response.js";

export const list = async (req, res) => {
  const { rows, meta } = await presenceService.list(req.valid.query);
  ok(res, rows, { meta });
};

export const get = async (req, res) => ok(res, await presenceService.get(req.valid.params.id));

export const create = async (req, res) => created(res, await presenceService.create(req.valid.body, req.files), "Presence created");

export const update = async (req, res) =>
  ok(res, await presenceService.update(req.valid.params.id, req.valid.body, req.files), { message: "Presence updated" });

export const updateStatus = async (req, res) => {
  await presenceService.updateStatus(req.valid.params.id, req.valid.body.status);
  ok(res, { status: req.valid.body.status }, { message: "Status updated" });
};

export const remove = async (req, res) => {
  await presenceService.remove(req.valid.params.id);
  ok(res, null, { message: "Presence deleted" });
};
