import { ApiError } from "../utils/ApiError.js";
import { pageMeta } from "../utils/pagination.js";
import { deleteImage, fileOf, imageUrl, UploadSession } from "../services/image.service.js";
import { createModel } from "./model.js";
import { fieldLabel, imageFields } from "./resources.js";

const invalid = (field, message) => new ApiError(422, message, { code: "VALIDATION_ERROR", errors: [{ field, message }] });

export function createService(res) {
  const model = createModel(res);
  const images = imageFields(res);
  const notFound = () => ApiError.notFound(`${res.label} not found`);

  // The database keeps relative image paths; responses expose absolute URLs.
  const present = (row) => {
    const out = { ...row };
    for (const f of images) out[f.name] = imageUrl(out[f.name]);
    return out;
  };

  /** Unique values (among non-deleted rows) and fk targets (must be active) - checked before anything is saved. */
  async function check(body, existing) {
    for (const column of res.unique ?? [])
      if (await model.valueExists(column, body[column], existing?.id))
        throw invalid(column, `A ${res.label.toLowerCase()} with this ${fieldLabel({ name: column }).toLowerCase()} already exists`);

    for (const f of res.fields.filter((x) => x.type === "fk")) {
      if (existing && Number(existing[f.name]) === body[f.name]) continue; // unchanged: editing stays possible if the parent was deactivated later
      if (!(await model.refIsActive(f.ref, body[f.name]))) throw invalid(f.name, `Choose an active ${fieldLabel(f).toLowerCase()}`);
    }
  }

  return {
    async list(filters) {
      const { rows, total } = await model.list(filters);
      return { rows: rows.map(present), meta: pageMeta(filters.page, filters.limit, total) };
    },

    options: () => model.options(),

    async get(id) {
      const row = await model.findById(id);
      if (!row) throw notFound();
      return present(row);
    },

    async create(body, files) {
      await check(body);
      const session = new UploadSession();
      try {
        const paths = {};
        for (const f of images) {
          const file = fileOf(files, f.name);
          paths[f.name] = file ? await session.save(file, res.slug) : null;
        }
        const id = await model.insert({ ...body, ...paths });
        return this.get(id);
      } catch (err) {
        await session.rollback();
        throw err;
      }
    },

    async update(id, body, files) {
      const existing = await model.findById(id);
      if (!existing) throw notFound();
      await check(body, existing);
      const session = new UploadSession();
      const replaced = []; // old files are removed only after the update succeeded
      try {
        const paths = {};
        for (const f of images) {
          const file = fileOf(files, f.name);
          if (file) {
            paths[f.name] = await session.save(file, res.slug);
            replaced.push(existing[f.name]);
          } else paths[f.name] = existing[f.name];
        }
        await model.update(id, { ...body, ...paths });
        await Promise.all(replaced.map(deleteImage));
        return this.get(id);
      } catch (err) {
        await session.rollback();
        throw err;
      }
    },

    async updateStatus(id, status) {
      if (!(await model.updateStatus(id, status))) throw notFound();
      return this.get(id);
    },

    /** Soft delete (row and images are kept). Blocked while other modules still use this row. */
    async remove(id) {
      if (!(await model.findById(id))) throw notFound();
      for (const use of res.usedBy ?? []) {
        const n = await model.countUsing(use, id);
        if (n > 0) throw new ApiError(409, `Cannot delete: ${n} ${use.noun}${n > 1 ? "s use" : " uses"} this ${res.label.toLowerCase()}`, { code: "IN_USE" });
      }
      if (!(await model.softDelete(id))) throw notFound();
    },
  };
}
