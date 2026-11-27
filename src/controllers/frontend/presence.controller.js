import { listPublishedPresences } from "../../models/presence.model.js";
import { imageUrl } from "../../services/image.service.js";
import { ok } from "../../utils/response.js";

/** [{ name, link, blurb, map (URL), cities: [{ name, link }] }], in the order the states were added. */
export const list = async (_req, res) => {
  const rows = await listPublishedPresences();
  ok(res, rows.map((s) => ({
    name: s.state_name,
    link: s.state_link,
    blurb: s.short_line,
    map: imageUrl(s.map_img),
    cities: s.cities.map((c) => ({ name: c.city_name, link: c.city_link })),
  })));
};
