/**
 * Declarative definitions of the simple admin modules. Each one gets the same endpoints from createCrudRouter:
 *   GET /  (list: ?page&limit&q&status + one filter per fk)    GET /options  (active, non-deleted: id + label)
 *   POST /   GET /:id   PUT /:id   PATCH /:id/status   DELETE /:id  (super_admin only, soft delete)
 * `status` and `deleted_at` exist on every table and are handled for all of them, so they are not listed as fields.
 *
 * Field types: text, textarea, int, date, bool (0/1), url, image (uploaded image), file (uploaded PDF), fk (id of another table's row).
 * Fields are required unless `optional: true`.
 */

const text = (name, max, o = {}) => ({ name, type: "text", max, ...o });
const textarea = (name, max, o = {}) => ({ name, type: "textarea", max, ...o });
/** Rich-text (HTML) description edited with the admin editor; sanitized on save. */
const rich = (name, max, o = {}) => ({ name, type: "textarea", max, rich: true, ...o });
const int = (name, min, max, o = {}) => ({ name, type: "int", min, max, ...o });
const date = (name, o = {}) => ({ name, type: "date", ...o });
const bool = (name, o = {}) => ({ name, type: "bool", ...o });
const url = (name, o = {}) => ({ name, type: "url", max: 255, ...o });
const image = (name, o = {}) => ({ name, type: "image", ...o });
const file = (name, o = {}) => ({ name, type: "file", ...o });
const fk = (name, ref, o = {}) => ({ name, type: "fk", ref, ...o });

export const RESOURCES = [
  {
    slug: "blog-authors",
    table: "blog_authors",
    label: "Blog author",
    labelField: "name",
    search: ["name", "designation"],
    unique: ["name"],
    orderBy: "t.name, t.id",
    fields: [
      text("name", 150),
      text("designation", 150),
      int("years_of_exp", 0, 80, { label: "Years of experience", optional: true }),
      rich("description", 15000),
      text("meta_title", 255, { optional: true }),
      textarea("meta_description", 500, { optional: true }),
      image("main_img", { label: "Main image" }),
      image("thumbnail_img", { label: "Thumbnail image", optional: true }),
      text("social_media_name", 100, { label: "Social media name", optional: true }),
      url("social_media_url", { label: "Social media URL", optional: true }),
      image("social_media_image", { label: "Social media image", optional: true }),
    ],
    // A social media entry needs both its name and its link.
    refine(body, ctx) {
      if (body.social_media_name && !body.social_media_url)
        ctx.addIssue({ code: "custom", path: ["social_media_url"], message: "Social media URL is required when a name is given" });
      if (body.social_media_url && !body.social_media_name)
        ctx.addIssue({ code: "custom", path: ["social_media_name"], message: "Social media name is required when a URL is given" });
    },
  },
  {
    slug: "certificate-categories",
    table: "certificate_category",
    label: "Certificate category",
    labelField: "name",
    search: ["name"],
    unique: ["name"],
    orderBy: "t.name, t.id",
    usedBy: [{ table: "certificates", column: "certificate_category_id", noun: "certificate" }],
    fields: [text("name", 150)],
  },
  {
    slug: "certificates",
    table: "certificates",
    label: "Certificate",
    search: ["name"],
    orderBy: "t.id DESC",
    fields: [
      fk("certificate_category_id", "certificate_category", { label: "Certificate category" }),
      text("name", 255),
      file("pdf_file", { label: "PDF file" }),
    ],
  },
  {
    slug: "award-timelines",
    table: "awards_timelines",
    label: "Award",
    search: ["title"],
    orderBy: "t.year DESC, t.id DESC",
    fields: [
      int("year", 1900, 2100),
      text("title", 255),
      rich("description", 15000),
      image("img", { label: "Image", optional: true }),
      bool("is_feature", { label: "Featured" }),
    ],
  },
  {
    slug: "events",
    table: "events",
    label: "Event",
    search: ["name", "location"],
    orderBy: "t.from_date DESC, t.id DESC",
    fields: [text("name", 255), text("location", 255), date("from_date", { label: "From date" }), date("to_date", { label: "To date" })],
    refine(body, ctx) {
      if (body.from_date && body.to_date && body.to_date < body.from_date)
        ctx.addIssue({ code: "custom", path: ["to_date"], message: "To date cannot be before the from date" });
    },
  },
  {
    slug: "press-releases",
    table: "press_releases",
    label: "Press release",
    search: ["title"],
    orderBy: "t.id DESC",
    fields: [image("img", { label: "Image" }), text("title", 255), url("url", { label: "URL", optional: true }), rich("description", 15000)],
  },
  {
    slug: "career-departments",
    table: "career_department",
    label: "Career department",
    labelField: "name",
    search: ["name"],
    unique: ["name"],
    orderBy: "t.name, t.id",
    usedBy: [{ table: "jobs", column: "career_department_id", noun: "job" }],
    fields: [text("name", 150)],
  },
  {
    slug: "jobs",
    table: "jobs",
    label: "Job",
    search: ["name"],
    orderBy: "t.id DESC",
    fields: [text("name", 255), fk("career_department_id", "career_department", { label: "Department" })],
  },
  {
    slug: "life-at-ksquare",
    table: "life_at_ksquare",
    label: "Life at Ksquare photo",
    search: [],
    orderBy: "t.id DESC",
    fields: [image("img", { label: "Image" })],
  },
  {
    slug: "project-categories",
    table: "project_categories",
    label: "Project category",
    labelField: "category",
    search: ["category"],
    unique: ["category"],
    orderBy: "t.category, t.id",
    usedBy: [{ table: "projects", column: "project_categories_id", noun: "project" }],
    fields: [text("category", 150)],
  },
  {
    slug: "projects",
    table: "projects",
    label: "Project",
    search: ["title"],
    orderBy: "t.id DESC",
    fields: [
      fk("project_categories_id", "project_categories", { label: "Project category" }),
      image("img", { label: "Image" }),
      text("title", 255),
    ],
  },
];

export const byTable = Object.fromEntries(RESOURCES.map((r) => [r.table, r]));
export const imageFields = (res) => res.fields.filter((f) => f.type === "image");
export const documentFields = (res) => res.fields.filter((f) => f.type === "file");
export const fieldLabel = (f) => f.label ?? f.name.replace(/_id$/, "").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
/** Alias of the joined label column for an fk field: certificate_category_id -> certificate_category_name */
export const fkAlias = (f) => `${f.name.replace(/_id$/, "")}_name`;
