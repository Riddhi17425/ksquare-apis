import { withTransaction } from "../config/db.js";
import { faqCategoryModel } from "../models/faqCategory.model.js";
import { faqModel } from "../models/faq.model.js";
import { ApiError } from "../utils/ApiError.js";
import { pageMeta } from "../utils/pagination.js";

const notFound = () => ApiError.notFound("FAQ not found");
const categoryError = (message) => new ApiError(422, message, { code: "VALIDATION_ERROR", errors: [{ field: "category_id", message }] });

/**
 * A FAQ can only be put into an active, non-deleted category.
 * (When editing, keeping the FAQ in its current category is always allowed, even if that category became inactive.)
 */
async function assertCategoryUsable(categoryId, currentCategoryId) {
  const category = await faqCategoryModel.findById(categoryId);
  if (!category) throw categoryError("Selected category does not exist");
  if (category.status !== "active" && categoryId !== currentCategoryId) throw categoryError("Selected category is inactive");
}

const DUPLICATE_QUESTION = "This question already exists in the selected category";

export const faqService = {
  async list(filters) {
    const { rows, total } = await faqModel.list(filters);
    return { rows, meta: pageMeta(filters.page, filters.limit, total) };
  },

  async get(id) {
    const row = await faqModel.findById(id);
    if (!row) throw notFound();
    return row;
  },

  async createMany({ category_id, items }) {
    await assertCategoryUsable(category_id);

    const errors = [];
    for (let i = 0; i < items.length; i++)
      if (await faqModel.questionExists(category_id, items[i].question))
        errors.push({ field: `items.${i}.question`, message: DUPLICATE_QUESTION });
    if (errors.length) throw new ApiError(422, errors[0].message, { code: "VALIDATION_ERROR", errors });

    await withTransaction((conn) => faqModel.createMany(conn, category_id, items));
    return { count: items.length };
  },

  async update(id, body) {
    const existing = await faqModel.findById(id);
    if (!existing) throw notFound();
    await assertCategoryUsable(body.category_id, existing.category_id);
    if (await faqModel.questionExists(body.category_id, body.question, id))
      throw new ApiError(422, DUPLICATE_QUESTION, { code: "VALIDATION_ERROR", errors: [{ field: "question", message: DUPLICATE_QUESTION }] });
    await faqModel.update(id, body);
    return this.get(id);
  },

  async remove(id) {
    if (!(await faqModel.remove(id))) throw notFound();
  },
};
