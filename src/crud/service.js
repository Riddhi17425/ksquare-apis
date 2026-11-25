import { withTransaction } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { pageMeta } from "../utils/pagination.js";
import { deleteImage, fileOf, imageUrl, UploadSession } from "../services/image.service.js";
import { createModel } from "./model.js";
import { documentFields, fieldLabel, imageFields, repeaterFileName, repeaterImageFields } from "./resources.js";

const invalid = (field, message) => new ApiError(422, message, { code: "VALIDATION_ERROR", errors: [{ field, message }] });

export function createService(res) {
  const model = createModel(res);
  const images = [...imageFields(res), ...documentFields(res)]; // every uploaded file (images and PDFs)
  const notFound = () => ApiError.notFound(`${res.label} not found`);

  // Images are saved as images, PDFs as documents.
  const saveFile = (session, f, file) => (f.type === "file" ? session.saveDocument(file, res.slug) : session.save(file, res.slug));

  // The database keeps relative file paths; responses expose absolute URLs.
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
      const out = present(row);
      for (const r of res.repeaters ?? []) {
        out[r.name] = (await model.children(r, id)).map((child) => {
          for (const f of repeaterImageFields(r)) child[f.name] = imageUrl(child[f.name]);
          return child;
        });
      }
      return out;
    },

    async create(body, files) {
      await check(body);
      const session = new UploadSession();
      try {
        const paths = {};
        for (const f of images) {
          const file = fileOf(files, f.name);
          paths[f.name] = file ? await saveFile(session, f, file) : null;
        }
        // Rows of the repeaters: every picture of a new row is required.
        const rows = {};
        for (const r of res.repeaters ?? []) {
          const entries = body[r.name] ?? [];
          rows[r.name] = [];
          for (let i = 0; i < entries.length; i++) {
            const row = { ...entries[i], sort_order: i };
            for (const f of repeaterImageFields(r)) {
              const file = fileOf(files, repeaterFileName(r, f, i));
              if (!file) throw invalid(`${r.name}.${i}.${f.name}`, `${fieldLabel(f)} is required`);
              row[f.name] = await session.save(file, res.slug);
            }
            rows[r.name].push(row);
          }
        }
        const id = await withTransaction(async (conn) => {
          const newId = await model.insert({ ...body, ...paths }, conn);
          for (const r of res.repeaters ?? []) for (const row of rows[r.name]) await model.insertChild(conn, r, newId, row);
          return newId;
        });
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
            paths[f.name] = await saveFile(session, f, file);
            replaced.push(existing[f.name]);
          } else paths[f.name] = existing[f.name];
        }
        const repeaters = res.repeaters ?? [];
        if (repeaters.length) {
          const plans = [];
          for (const r of repeaters) {
            const current = await model.children(r, id);
            const byId = new Map(current.map((c) => [c.id, c]));
            const entries = body[r.name] ?? [];
            const resolved = [];
            for (let i = 0; i < entries.length; i++) {
              const old = entries[i].id !== undefined ? byId.get(entries[i].id) : null;
              if (entries[i].id !== undefined && !old) throw invalid(`${r.name}.${i}.${r.fields[0].name}`, "Row not found");
              const row = { ...entries[i], sort_order: i };
              for (const f of repeaterImageFields(r)) {
                const file = fileOf(files, repeaterFileName(r, f, i));
                if (file) {
                  row[f.name] = await session.save(file, res.slug);
                  if (old) replaced.push(old[f.name]);
                } else if (old) row[f.name] = old[f.name];
                else throw invalid(`${r.name}.${i}.${f.name}`, `${fieldLabel(f)} is required`);
              }
              resolved.push(row);
            }
            const kept = new Set(entries.filter((e) => e.id !== undefined).map((e) => e.id));
            const removed = current.filter((c) => !kept.has(c.id));
            for (const c of removed) for (const f of repeaterImageFields(r)) replaced.push(c[f.name]);
            plans.push({ r, resolved, removed });
          }
          await withTransaction(async (conn) => {
            await model.update(id, { ...body, ...paths }, conn);
            for (const { r, resolved, removed } of plans) {
              await model.deleteChildren(conn, r, removed.map((c) => c.id));
              for (const row of resolved) {
                if (row.id !== undefined) await model.updateChild(conn, r, row.id, row);
                else await model.insertChild(conn, r, id, row);
              }
            }
          });
        } else {
          await model.update(id, { ...body, ...paths });
        }
        await Promise.all(replaced.map(deleteImage));
        return this.get(id);
      } catch (err) {
        await session.rollback();
        throw err;
      }
    },

    async updateFlag(id, field, value) {
      if (!(await model.updateFlag(id, field, value))) throw notFound();
      return this.get(id);
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
