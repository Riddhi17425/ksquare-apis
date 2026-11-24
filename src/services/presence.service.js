import { withTransaction } from "../config/db.js";
import { presenceModel } from "../models/presence.model.js";
import { ApiError } from "../utils/ApiError.js";
import { pageMeta } from "../utils/pagination.js";
import { deleteImage, fileOf, imageUrl, UploadSession } from "./image.service.js";

const FOLDER = "presences";
const notFound = () => ApiError.notFound("Presence not found");
const STATE_TAKEN = "This state already exists";
const fieldError = (field, message) => new ApiError(422, message, { code: "VALIDATION_ERROR", errors: [{ field, message }] });

export const presenceService = {
  async list(filters) {
    const { rows, total } = await presenceModel.list(filters);
    return { rows: rows.map((r) => ({ ...r, map_img: imageUrl(r.map_img) })), meta: pageMeta(filters.page, filters.limit, total) };
  },

  async get(id) {
    const row = await presenceModel.findById(id);
    if (!row) throw notFound();
    return { ...row, map_img: imageUrl(row.map_img), cities: await presenceModel.cities(id) };
  },

  async create(body, files) {
    if (await presenceModel.stateExists(body.state_name)) throw fieldError("state_name", STATE_TAKEN);
    const session = new UploadSession();
    try {
      const map_img = await session.save(fileOf(files, "map_img"), FOLDER);
      const id = await withTransaction(async (conn) => {
        const presenceId = await presenceModel.insert(conn, { ...body, map_img });
        await presenceModel.replaceCities(conn, presenceId, body.cities);
        return presenceId;
      });
      return this.get(id);
    } catch (err) {
      await session.rollback();
      throw err;
    }
  },

  async update(id, body, files) {
    const existing = await presenceModel.findById(id);
    if (!existing) throw notFound();
    if (await presenceModel.stateExists(body.state_name, id)) throw fieldError("state_name", STATE_TAKEN);

    const session = new UploadSession();
    try {
      let map_img = existing.map_img;
      const file = fileOf(files, "map_img");
      if (file) map_img = await session.save(file, FOLDER);

      await withTransaction(async (conn) => {
        await presenceModel.update(conn, id, { ...body, map_img });
        await presenceModel.replaceCities(conn, id, body.cities);
      });
      if (map_img !== existing.map_img) await deleteImage(existing.map_img); // only after the DB update succeeded
      return this.get(id);
    } catch (err) {
      await session.rollback();
      throw err;
    }
  },

  async updateStatus(id, status) {
    if (!(await presenceModel.updateStatus(id, status))) throw notFound();
  },

  async remove(id) {
    if (!(await presenceModel.remove(id))) throw notFound();
  },
};
