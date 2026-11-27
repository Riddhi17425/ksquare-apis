import { testimonialModel } from "../../models/testimonial.model.js";
import { imageUrl } from "../../services/image.service.js";
import { ok } from "../../utils/response.js";

/** [{ name, company, description, profile_photo (URL | null) }], in the order they were added. */
export const list = async (_req, res) => {
  const rows = await testimonialModel.listAll();
  ok(res, rows.map((r) => ({ name: r.name, company: r.company, description: r.description, profile_photo: imageUrl(r.profile_photo) })));
};
