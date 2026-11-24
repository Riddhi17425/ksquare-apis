import { faqService } from "../../services/faq.service.js";
import { ok } from "../../utils/response.js";

export const list = async (_req, res) => ok(res, await faqService.listPublished());
