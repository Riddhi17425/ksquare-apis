import { faqCategoryModel } from "../models/faqCategory.model.js";
import { faqModel } from "../models/faq.model.js";
import { ApiError } from "../utils/ApiError.js";
import { pageMeta } from "../utils/pagination.js";

const notFound = () => ApiError.notFound("FAQ category not found");
const nameTaken = () =>
  new ApiError(422, "A FAQ category with this name already exists", {
    code: "VALIDATION_ERROR",
    errors: [{ field: "name", message: "A FAQ category with this name already exists" }],
  });

export const faqCategoryService = {
  async list(filters) {
    const { rows, total } = await faqCategoryModel.list(filters);
    return { rows, meta: pageMeta(filters.page, filters.limit, total) };
  },

  options: () => faqCategoryModel.options(),

  async get(id) {
    const row = await faqCategoryModel.findById(id);
    if (!row) throw notFound();
    return { ...row, faqs: await faqModel.listByCategory(id) };
  },

  async create(body) {
    if (await faqCategoryModel.nameExists(body.name)) throw nameTaken();
    const id = await faqCategoryModel.create(body);
    return this.get(id);
  },

  async update(id, body) {
    if (!(await faqCategoryModel.findById(id))) throw notFound();
    if (await faqCategoryModel.nameExists(body.name, id)) throw nameTaken();
    await faqCategoryModel.update(id, body);
    return this.get(id);
  },

  async updateStatus(id, status) {
    if (!(await faqCategoryModel.updateStatus(id, status))) throw notFound();
    return this.get(id);
  },

  /** Soft delete: the category (and its FAQs) disappear from the admin lists, rows are kept. */
  async remove(id) {
    if (!(await faqCategoryModel.softDelete(id))) throw notFound();
  },
};
