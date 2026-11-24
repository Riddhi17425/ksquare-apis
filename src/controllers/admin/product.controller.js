import { productService } from "../../services/product.service.js";
import { created, ok } from "../../utils/response.js";

export const list = async (req, res) => {
  const { rows, meta } = await productService.list(req.valid.query);
  ok(res, rows, { meta });
};

export const get = async (req, res) => ok(res, await productService.get(req.valid.params.id));

export const create = async (req, res) => created(res, await productService.create(req.valid.body, req.files), "Product created");

export const update = async (req, res) =>
  ok(res, await productService.update(req.valid.params.id, req.valid.body, req.files), { message: "Product updated" });

export const updateStatus = async (req, res) => {
  await productService.updateStatus(req.valid.params.id, req.valid.body.status);
  ok(res, { status: req.valid.body.status }, { message: "Status updated" });
};

export const remove = async (req, res) => {
  await productService.remove(req.valid.params.id);
  ok(res, null, { message: "Product deleted" });
};
