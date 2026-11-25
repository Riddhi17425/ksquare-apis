import { projectModel } from "../../models/project.model.js";
import { imageUrl } from "../../services/image.service.js";
import { pageContentService } from "../../services/pageContent.service.js";
import { ok } from "../../utils/response.js";

/** { categories: [{ name, items: [...] }], gallery: [{ name, img }], content: { stats, steps, faqs } | null (the page's editable text sections) } */
export const list = async (_req, res) => {
  const categories = new Map();
  for (const { category_id, category, ...item } of await projectModel.listItems()) {
    if (!categories.has(category_id)) categories.set(category_id, { name: category, items: [] });
    categories.get(category_id).items.push({ ...item, project_img: imageUrl(item.project_img) });
  }
  const gallery = (await projectModel.listPictures()).map((p) => ({ ...p, img: imageUrl(p.img) }));
  ok(res, { categories: [...categories.values()], gallery, content: await pageContentService.getProjects() });
};
