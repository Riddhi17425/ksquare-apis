
import { blogModel } from "../models/blog.model.js";
import { ApiError } from "../utils/ApiError.js";
import { pageMeta } from "../utils/pagination.js";
import { BLOG_IMAGES } from "../validators/blog.validator.js";
import { deleteImage, fileOf, imageUrl, UploadSession } from "./image.service.js";

const FOLDER = "blogs";
const notFound = () => ApiError.notFound("Blog not found");
const fieldError = (field, message) => new ApiError(422, message, { code: "VALIDATION_ERROR", errors: [{ field, message }] });

const present = (row) => {
  const out = { ...row };
  for (const key of BLOG_IMAGES) if (key in out) out[key] = imageUrl(out[key]);
  return out;
};

async function assertValid(body, excludeId) {
  if (await blogModel.urlExists(body.url, excludeId)) throw fieldError("url", "This URL is already in use by another blog");
  if (!(await blogModel.authorExists(body.author_id))) throw fieldError("author_id", "Selected author does not exist");
}

export const blogService = {
  async list(filters) {
    const { rows, total } = await blogModel.list(filters);
    return { rows: rows.map(present), meta: pageMeta(filters.page, filters.limit, total) };
  },

  async get(id) {
    const row = await blogModel.findById(id);
    if (!row) throw notFound();
    return present(row);
  },

  /** Public website: published blogs for the blog page. */
  async listPublished(filters) {
    const { rows, total } = await blogModel.listPublished(filters);
    const items = rows.map((r) => ({ ...present(r), author_thumbnail: imageUrl(r.author_thumbnail), author_image: imageUrl(r.author_image) }));
    return { rows: items, meta: pageMeta(filters.page, filters.limit, total) };
  },

  /** Public website: one published blog by its URL slug. */
  async getPublished(url) {
    const row = await blogModel.findPublishedByUrl(url);
    if (!row) throw notFound();
    return { ...present(row), author_image: imageUrl(row.author_image), author_thumbnail: imageUrl(row.author_thumbnail) };
  },

  async isUrlAvailable(url, excludeId) {
    return !(await blogModel.urlExists(url, excludeId));
  },

  async create(body, files) {
    await assertValid(body);
    const session = new UploadSession();
    try {
      const paths = {};
      for (const key of BLOG_IMAGES) paths[key] = await session.save(fileOf(files, key), FOLDER);
      const id = await blogModel.create({ ...body, ...paths });
      return this.get(id);
    } catch (err) {
      await session.rollback();
      throw err; // a racing duplicate URL surfaces as ER_DUP_ENTRY -> 409 via the error handler
    }
  },

  async update(id, body, files) {
    const existing = await blogModel.findById(id);
    if (!existing) throw notFound();
    await assertValid(body, id);

    const session = new UploadSession();
    try {
      const paths = {};
      const replaced = [];
      for (const key of BLOG_IMAGES) {
        const file = fileOf(files, key);
        if (file) {
          paths[key] = await session.save(file, FOLDER);
          replaced.push(existing[key]);
        } else paths[key] = existing[key];
      }
      await blogModel.update(id, { ...body, ...paths });
      await Promise.all(replaced.map(deleteImage)); // old files go only after the DB update succeeded
      return this.get(id);
    } catch (err) {
      await session.rollback();
      throw err;
    }
  },

  async updateStatus(id, status) {
    if (!(await blogModel.updateStatus(id, status))) throw notFound();
    return this.get(id);
  },

  /** Soft delete: the row (and its images) is kept, deleted_at is set. */
  async remove(id) {
    if (!(await blogModel.softDelete(id))) throw notFound();
  },
};
