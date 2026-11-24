import { categoryService } from "../../services/category.service.js";
import { productService } from "../../services/product.service.js";
import { ok } from "../../utils/response.js";

export const categories = async (_req, res) => ok(res, await categoryService.listPublished());

export const category = async (req, res) => ok(res, await categoryService.getPublished(req.valid.params.slug));

export const product = async (req, res) => ok(res, await productService.getPublished(req.valid.params.slug));
