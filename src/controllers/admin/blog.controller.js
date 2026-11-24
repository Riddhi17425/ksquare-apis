import { blogService } from "../../services/blog.service.js";
import { created, ok } from "../../utils/response.js";

export const list = async (req, res) => {
  const { rows, meta } = await blogService.list(req.valid.query);
  ok(res, rows, { meta });
};

export const get = async (req, res) => ok(res, await blogService.get(req.valid.params.id));

export const checkUrl = async (req, res) =>
  ok(res, { available: await blogService.isUrlAvailable(req.valid.query.url, req.valid.query.exclude) });

export const create = async (req, res) => created(res, await blogService.create(req.valid.body, req.files), "Blog created");

export const update = async (req, res) =>
  ok(res, await blogService.update(req.valid.params.id, req.valid.body, req.files), { message: "Blog updated" });

export const updateStatus = async (req, res) =>
  ok(res, await blogService.updateStatus(req.valid.params.id, req.valid.body.status), { message: "Status updated" });

export const remove = async (req, res) => {
  await blogService.remove(req.valid.params.id);
  ok(res, null, { message: "Blog deleted" });
};
