import { faqCategoryService } from "../../services/faqCategory.service.js";
import { created, ok } from "../../utils/response.js";

export const list = async (req, res) => {
  const { rows, meta } = await faqCategoryService.list(req.valid.query);
  ok(res, rows, { meta });
};

export const options = async (_req, res) => ok(res, await faqCategoryService.options());

export const get = async (req, res) => ok(res, await faqCategoryService.get(req.valid.params.id));

export const create = async (req, res) => created(res, await faqCategoryService.create(req.valid.body), "FAQ category created");

export const update = async (req, res) =>
  ok(res, await faqCategoryService.update(req.valid.params.id, req.valid.body), { message: "FAQ category updated" });

export const updateStatus = async (req, res) =>
  ok(res, await faqCategoryService.updateStatus(req.valid.params.id, req.valid.body.status), { message: "Status updated" });

export const remove = async (req, res) => {
  await faqCategoryService.remove(req.valid.params.id);
  ok(res, null, { message: "FAQ category deleted" });
};
