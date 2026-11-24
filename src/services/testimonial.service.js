import { testimonialModel } from "../models/testimonial.model.js";
import { ApiError } from "../utils/ApiError.js";
import { pageMeta } from "../utils/pagination.js";
import { deleteImage, fileOf, imageUrl, UploadSession } from "./image.service.js";

const FOLDER = "testimonials";
const notFound = () => ApiError.notFound("Testimonial not found");
const present = (row) => ({ ...row, profile_photo: imageUrl(row.profile_photo) });

export const testimonialService = {
  async list(filters) {
    const { rows, total } = await testimonialModel.list(filters);
    return { rows: rows.map(present), meta: pageMeta(filters.page, filters.limit, total) };
  },

  async get(id) {
    const row = await testimonialModel.findById(id);
    if (!row) throw notFound();
    return present(row);
  },

  async create(body, files) {
    const session = new UploadSession();
    try {
      const photo = fileOf(files, "profile_photo");
      const profile_photo = photo ? await session.save(photo, FOLDER) : null;
      const id = await testimonialModel.create({ ...body, profile_photo });
      return this.get(id);
    } catch (err) {
      await session.rollback();
      throw err;
    }
  },

  async update(id, body, files) {
    const existing = await testimonialModel.findById(id);
    if (!existing) throw notFound();

    const session = new UploadSession();
    try {
      const photo = fileOf(files, "profile_photo");
      let profile_photo = existing.profile_photo;
      if (photo) profile_photo = await session.save(photo, FOLDER);
      else if (body.remove_profile_photo) profile_photo = null;

      await testimonialModel.update(id, { ...body, profile_photo });
      if (profile_photo !== existing.profile_photo) await deleteImage(existing.profile_photo); // only after DB success
      return this.get(id);
    } catch (err) {
      await session.rollback();
      throw err;
    }
  },

  async remove(id) {
    const existing = await testimonialModel.findById(id);
    if (!existing || !(await testimonialModel.remove(id))) throw notFound();
    await deleteImage(existing.profile_photo);
  },
};
