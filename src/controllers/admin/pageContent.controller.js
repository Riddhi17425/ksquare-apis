import { pageContentService } from "../../services/pageContent.service.js";
import { ok } from "../../utils/response.js";

export const getProjects = async (_req, res) => ok(res, (await pageContentService.getProjects()) ?? { stats: [], steps: [], faqs: [] });

export const saveProjects = async (req, res) => {
  await pageContentService.saveProjects(req.valid.body, req.files);
  ok(res, await pageContentService.getProjects(), { message: "Page content updated" });
};
