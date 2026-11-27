import { eventModel } from "../../models/event.model.js";
import { imageUrl } from "../../services/image.service.js";
import { ok } from "../../utils/response.js";

/** DATE columns come back as "YYYY-MM-DD" strings (see config/db.js). */
const ymd = (d) => String(d).slice(0, 10);

/** [{ name, location, img (URL | null), from_date, to_date }], latest first. */
export const list = async (_req, res) => {
  const rows = await eventModel.listPublished();
  ok(res, rows.map((r) => ({ name: r.name, location: r.location, img: imageUrl(r.img), from_date: ymd(r.from_date), to_date: ymd(r.to_date) })));
};
