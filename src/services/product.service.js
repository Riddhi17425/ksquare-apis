import { withTransaction } from "../config/db.js";
import { categoryModel } from "../models/category.model.js";
import { productModel } from "../models/product.model.js";
import { resolveSlug } from "../utils/slug.js";
import { ApiError } from "../utils/ApiError.js";
import { pageMeta } from "../utils/pagination.js";
import { DETAIL_IMG_FIELDS, MAX_DETAIL_IMAGES } from "../validators/product.validator.js";
import { deleteImage, fileOf, imageUrl, UploadSession } from "./image.service.js";

const FOLDER = "products";
const notFound = () => ApiError.notFound("Product not found");
const fieldError = (field, message) => new ApiError(422, message, { code: "VALIDATION_ERROR", errors: [{ field, message }] });
const assertCategory = async (id) => {
  if (!(await categoryModel.findById(id))) throw fieldError("category_id", "Selected category does not exist");
};
const SLUG_TAKEN = () => fieldError("slug", "This slug is already in use");
/** Slug typed by the admin (must be free) or generated from the name when left empty. */
const withSlug = (body, excludeId = 0) =>
  resolveSlug({ slug: body.slug, name: body.name, exists: (s) => productModel.slugExists(s, excludeId), onTaken: SLUG_TAKEN });
const NAME_TAKEN = "A product with this name already exists";

/** The detail images uploaded in this request, in form order. */
const uploadedDetails = (files) => DETAIL_IMG_FIELDS.map((f) => fileOf(files, f)).filter(Boolean);

export const productService = {
  async list(filters) {
    const { rows, total } = await productModel.list(filters);
    return { rows: rows.map((r) => ({ ...r, list_img: imageUrl(r.list_img) })), meta: pageMeta(filters.page, filters.limit, total) };
  },

  async get(id) {
    const row = await productModel.findById(id);
    if (!row) throw notFound();
    const [images, faqs] = await Promise.all([productModel.images(id), productModel.faqs(id)]);
    const category = row.category_id ? await categoryModel.findById(row.category_id) : null;
    return {
      ...row,
      category_name: category?.name ?? null,
      list_img: imageUrl(row.list_img),
      detail_imgs: images.map((i) => ({ id: i.id, img: imageUrl(i.img) })),
      faqs,
    };
  },

  async create(body, files) {
    if (await productModel.nameExists(body.name)) throw fieldError("name", NAME_TAKEN);
    body.slug = await withSlug(body);
    await assertCategory(body.category_id);

    const session = new UploadSession();
    try {
      const list_img = await session.save(fileOf(files, "list_img"), FOLDER);
      const details = [];
      for (const file of uploadedDetails(files)) details.push(await session.save(file, FOLDER));

      const id = await withTransaction(async (conn) => {
        const productId = await productModel.insert(conn, { ...body, list_img });
        for (let i = 0; i < details.length; i++) await productModel.insertImage(conn, productId, details[i], i);
        await productModel.replaceFaqs(conn, productId, body.faqs);
        return productId;
      });
      return this.get(id);
    } catch (err) {
      await session.rollback();
      throw err;
    }
  },

  async update(id, body, files) {
    const existing = await productModel.findById(id);
    if (!existing) throw notFound();
    if (await productModel.nameExists(body.name, id)) throw fieldError("name", NAME_TAKEN);
    body.slug = await withSlug(body, id);
    await assertCategory(body.category_id);

    const current = await productModel.images(id);
    const byId = new Map(current.map((i) => [i.id, i]));
    const keepIds = [...new Set(body.keep_image_ids)];
    if (keepIds.some((k) => !byId.has(k))) throw fieldError("detail_imgs", "One of the images to keep was not found");
    const newFiles = uploadedDetails(files);
    if (keepIds.length + newFiles.length > MAX_DETAIL_IMAGES) throw fieldError("detail_imgs", `At most ${MAX_DETAIL_IMAGES} detail images`);

    const session = new UploadSession();
    const toDelete = []; // old files, removed only after the transaction commits
    try {
      let list_img = existing.list_img;
      const newList = fileOf(files, "list_img");
      if (newList) {
        list_img = await session.save(newList, FOLDER);
        toDelete.push(existing.list_img);
      }
      const added = [];
      for (const file of newFiles) added.push(await session.save(file, FOLDER));
      const removed = current.filter((i) => !keepIds.includes(i.id));
      toDelete.push(...removed.map((i) => i.img));

      await withTransaction(async (conn) => {
        await productModel.update(conn, id, { ...body, list_img });
        await productModel.deleteImages(conn, removed.map((i) => i.id));
        for (let i = 0; i < keepIds.length; i++) await productModel.setImageOrder(conn, keepIds[i], i);
        for (let i = 0; i < added.length; i++) await productModel.insertImage(conn, id, added[i], keepIds.length + i);
        await productModel.replaceFaqs(conn, id, body.faqs);
      });
      await Promise.all(toDelete.map(deleteImage));
      return this.get(id);
    } catch (err) {
      await session.rollback();
      throw err;
    }
  },

  async remove(id) {
    if (!(await productModel.remove(id))) throw notFound(); // soft delete: images are kept with the row
  },
};
