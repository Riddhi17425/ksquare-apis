import { pageContentModel } from "../models/pageContent.model.js";
import { UploadSession, deleteImage, fileOf, imageUrl } from "./image.service.js";

const FOLDER = "page-content";

/** Pages whose text sections can be edited in the admin panel. */
export const pageContentService = {
  get: (page) => pageContentModel.get(page),

  async save(page, content) {
    await pageContentModel.save(page, content);
    return content;
  },

  /** Projects page content with each step's icon as an absolute URL (null = the website's default icon). */
  async getProjects() {
    const content = await pageContentModel.get("projects");
    if (!content) return null;
    return { ...content, steps: (content.steps ?? []).map((s) => ({ ...s, icon: imageUrl(s.icon) })) };
  },

  /**
   * Saves the Projects page sections. A step keeps its current icon unless a new file was uploaded for it
   * (`steps_icon_<n>`); replaced icon files are removed only after the save succeeded.
   */
  async saveProjects(body, files) {
    const previous = await pageContentModel.get("projects");
    const session = new UploadSession();
    const replaced = [];
    try {
      const steps = [];
      for (let i = 0; i < body.steps.length; i++) {
        const file = fileOf(files, `steps_icon_${i}`);
        const old = previous?.steps?.[i]?.icon ?? null;
        let icon = old;
        if (file) {
          icon = await session.save(file, FOLDER);
          if (old) replaced.push(old);
        }
        steps.push({ ...body.steps[i], icon });
      }
      await pageContentModel.save("projects", { ...body, steps });
    } catch (err) {
      await session.rollback();
      throw err;
    }
    await Promise.all(replaced.map(deleteImage));
  },
};
