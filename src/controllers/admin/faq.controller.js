import { faqService } from "../../services/faq.service.js";
import { created, ok } from "../../utils/response.js";

export const list = async (req, res) => {
  const { rows, meta } = await faqService.list(req.valid.query);
  ok(res, rows, { meta });
};

export const get = async (req, res) => ok(res, await faqService.get(req.valid.params.id));

export const create = async (req, res) => {
  const result = await faqService.createMany(req.valid.body);
  created(res, result, result.count === 1 ? "FAQ created" : `${result.count} FAQs created`);
};

export const update = async (req, res) => ok(res, await faqService.update(req.valid.params.id, req.valid.body), { message: "FAQ updated" });

export const remove = async (req, res) => {
  await faqService.remove(req.valid.params.id);
  ok(res, null, { message: "FAQ deleted" });
};
