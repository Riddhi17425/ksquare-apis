import { categoryService } from "../../services/category.service.js";
import { created, ok } from "../../utils/response.js";

export const list = async (req, res) => {
  const { rows, meta } = await categoryService.list(req.valid.query);
  ok(res, rows, { meta });
};

export const get = async (req, res) => ok(res, await categoryService.get(req.valid.params.id));

export const create = async (req, res) =>
  created(res, await categoryService.create(req.valid.body, req.files), "Category created");

export const update = async (req, res) =>
  ok(res, await categoryService.update(req.valid.params.id, req.valid.body, req.files), { message: "Category updated" });

export const remove = async (req, res) => {
  await categoryService.remove(req.valid.params.id);
  ok(res, null, { message: "Category deleted" });
};
