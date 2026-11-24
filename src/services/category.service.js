import { withTransaction } from "../config/db.js";
import { categoryModel } from "../models/category.model.js";
import { productModel } from "../models/product.model.js";
import { resolveSlug } from "../utils/slug.js";
import { ApiError } from "../utils/ApiError.js";
import { pageMeta } from "../utils/pagination.js";
import { CATEGORY_ALL_IMAGES, CATEGORY_IMAGES, CATEGORY_OPTIONAL_IMAGES } from "../validators/category.validator.js";
import { deleteImage, fileOf, imageUrl, UploadSession } from "./image.service.js";

const FOLDER = "categories";
const notFound = () => ApiError.notFound("Category not found");
const SLUG_TAKEN = () => fieldError("slug", "This slug is already in use");
/** Slug typed by the admin (must be free) or generated from the name when left empty. */
const withSlug = (body, excludeId = 0) =>
  resolveSlug({ slug: body.slug, name: body.name, exists: (s) => categoryModel.slugExists(s, excludeId), onTaken: SLUG_TAKEN });
const NAME_TAKEN = "A category with this name already exists";
const fieldError = (field, message) => new ApiError(422, message, { code: "VALIDATION_ERROR", errors: [{ field, message }] });

const presentImages = (row) => {
  const out = { ...row };
  for (const key of CATEGORY_ALL_IMAGES) if (key in out) out[key] = imageUrl(out[key]);
  return out;
};

export const categoryService = {
  /** Public website: active categories. */
  async listPublished() {
    return (await categoryModel.listActive()).map(presentImages);
  },

  /** Public website: one active category by slug, with its configuration entries and active products. */
  async getPublished(slug) {
    const row = await categoryModel.findActiveBySlug(slug);
    if (!row) throw notFound();
    const [configuration, products] = await Promise.all([categoryModel.configurations(row.id), productModel.listActiveByCategory(row.id)]);
    const { id, status, created_at, updated_at, deleted_at, active_slug, ...category } = presentImages(row); // eslint-disable-line no-unused-vars
    return {
      ...category,
      configuration: configuration.map((c) => ({ title: c.title, description: c.description, icon: imageUrl(c.icon) })),
      products: products.map(({ id: _id, ...p }) => ({ ...p, list_img: imageUrl(p.list_img) })),
    };
  },

  async list(filters) {
    const { rows, total } = await categoryModel.list(filters);
    return { rows: rows.map(presentImages), meta: pageMeta(filters.page, filters.limit, total) };
  },

  async get(id) {
    const row = await categoryModel.findById(id);
    if (!row) throw notFound();
    const configuration = (await categoryModel.configurations(id)).map((c) => ({ ...c, icon: imageUrl(c.icon) }));
    return { ...presentImages(row), configuration };
  },

  async create(body, files) {
    if (await categoryModel.nameExists(body.name)) throw fieldError("name", NAME_TAKEN);
    body.slug = await withSlug(body);
    const entries = body.configuration;
    entries.forEach((_, i) => {
      if (!fileOf(files, `config_icon_${i}`)) throw fieldError(`configuration.${i}.icon`, "Icon is required");
    });

    const session = new UploadSession();
    try {
      const paths = {};
      for (const key of CATEGORY_IMAGES) paths[key] = await session.save(fileOf(files, key), FOLDER);
      for (const key of CATEGORY_OPTIONAL_IMAGES) {
        const file = fileOf(files, key);
        paths[key] = file ? await session.save(file, FOLDER) : null;
      }
      const icons = [];
      for (let i = 0; i < entries.length; i++) icons.push(await session.save(fileOf(files, `config_icon_${i}`), FOLDER));

      const id = await withTransaction(async (conn) => {
        const categoryId = await categoryModel.insert(conn, { ...body, ...paths });
        for (let i = 0; i < entries.length; i++)
          await categoryModel.insertConfiguration(conn, categoryId, { ...entries[i], icon: icons[i], sort_order: i });
        return categoryId;
      });
      return this.get(id);
    } catch (err) {
      await session.rollback();
      throw err;
    }
  },

  async update(id, body, files) {
    const existing = await categoryModel.findById(id);
    if (!existing) throw notFound();
    if (await categoryModel.nameExists(body.name, id)) throw fieldError("name", NAME_TAKEN);
    body.slug = await withSlug(body, id);
    const currentConfigs = await categoryModel.configurations(id);
    const byId = new Map(currentConfigs.map((c) => [c.id, c]));
    const entries = body.configuration;

    entries.forEach((e, i) => {
      if (e.id !== undefined && !byId.has(e.id)) throw fieldError(`configuration.${i}.title`, "Configuration entry not found");
      if (e.id === undefined && !fileOf(files, `config_icon_${i}`)) throw fieldError(`configuration.${i}.icon`, "Icon is required");
    });

    const session = new UploadSession();
    const toDelete = []; // old files, removed only after the transaction commits
    try {
      const paths = {};
      for (const key of CATEGORY_ALL_IMAGES) {
        const file = fileOf(files, key);
        if (file) {
          paths[key] = await session.save(file, FOLDER);
          toDelete.push(existing[key]);
        } else paths[key] = existing[key];
      }

      const keptIds = new Set(entries.filter((e) => e.id !== undefined).map((e) => e.id));
      const resolved = [];
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const file = fileOf(files, `config_icon_${i}`);
        let icon = e.id !== undefined ? byId.get(e.id).icon : null;
        if (file) {
          if (e.id !== undefined) toDelete.push(icon);
          icon = await session.save(file, FOLDER);
        }
        resolved.push({ ...e, icon, sort_order: i });
      }
      const removed = currentConfigs.filter((c) => !keptIds.has(c.id));
      toDelete.push(...removed.map((c) => c.icon));

      await withTransaction(async (conn) => {
        await categoryModel.update(conn, id, { ...body, ...paths });
        await categoryModel.deleteConfigurations(conn, removed.map((c) => c.id));
        for (const e of resolved) {
          if (e.id !== undefined) await categoryModel.updateConfiguration(conn, e.id, e);
          else await categoryModel.insertConfiguration(conn, id, e);
        }
      });
      await Promise.all(toDelete.map(deleteImage));
      return this.get(id);
    } catch (err) {
      await session.rollback();
      throw err;
    }
  },

  async updateStatus(id, status) {
    if (!(await categoryModel.updateStatus(id, status))) throw notFound();
  },

  async remove(id) {
    const existing = await categoryModel.findById(id);
    if (!existing) throw notFound();
    if (!(await categoryModel.remove(id))) throw notFound(); // soft delete: images are kept with the row
  },
};
