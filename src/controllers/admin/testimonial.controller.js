import { testimonialService } from "../../services/testimonial.service.js";
import { created, ok } from "../../utils/response.js";

export const list = async (req, res) => {
  const { rows, meta } = await testimonialService.list(req.valid.query);
  ok(res, rows, { meta });
};

export const get = async (req, res) => ok(res, await testimonialService.get(req.valid.params.id));

export const create = async (req, res) =>
  created(res, await testimonialService.create(req.valid.body, req.files), "Testimonial created");

export const update = async (req, res) =>
  ok(res, await testimonialService.update(req.valid.params.id, req.valid.body, req.files), { message: "Testimonial updated" });

export const remove = async (req, res) => {
  await testimonialService.remove(req.valid.params.id);
  ok(res, null, { message: "Testimonial deleted" });
};
