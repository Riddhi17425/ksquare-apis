import { z } from "zod";
import { optionalRichText, optionalText, requiredRichText, requiredText, seoFields } from "./common.validator.js";

export const MAX_CONFIG_ENTRIES = 10;
export const CONFIG_ICON_FIELDS = Array.from({ length: MAX_CONFIG_ENTRIES }, (_, i) => `config_icon_${i}`);
export const CATEGORY_IMAGES = ["list_image", "detail_image_d", "detail_image_m"];
export const CATEGORY_OPTIONAL_IMAGES = ["why_choose_img", "menu_img"];
export const CATEGORY_ALL_IMAGES = [...CATEGORY_IMAGES, ...CATEGORY_OPTIONAL_IMAGES];
const ALL_IMAGES = [...CATEGORY_ALL_IMAGES, ...CONFIG_ICON_FIELDS];

export const categoryCreateImages = { required: CATEGORY_IMAGES, all: ALL_IMAGES };
export const categoryUpdateImages = { all: ALL_IMAGES };

const configEntry = z.object({
  id: z.coerce.number().int().positive().optional(), // present = existing entry being kept/updated
  title: requiredText("Title", 255),
  description: requiredRichText("Description", 15000),
});

/** `configuration` arrives as a JSON string inside the multipart form: [{id?, title, description}, ...] */
const configuration = z
  .string()
  .optional()
  .default("[]")
  .transform((raw, ctx) => {
    try {
      return JSON.parse(raw);
    } catch {
      ctx.addIssue({ code: "custom", message: "Configuration is not valid" });
      return z.NEVER;
    }
  })
  .pipe(z.array(configEntry).max(MAX_CONFIG_ENTRIES, `At most ${MAX_CONFIG_ENTRIES} configuration entries`));

export const categoryBody = z
  .object({
    name: requiredText("Name", 150),
    ...seoFields,
    short_description: requiredText("Short description", 500),
    title: requiredText("Title", 255),
    product_summary: optionalText("Product summary", 5000),
    why_choose_summary: optionalText("Why choose summary", 5000),
    why_choose_title: optionalText("Why choose title", 255),
    why_choose_desc: optionalRichText("Why choose description", 15000),
    product_short_line: optionalText("Product short line", 255),
    configuration_short_line: optionalText("Configuration short line", 255),
    type: z.enum(["core", "brand"], "Type must be core or brand").default("core"),
    status: z.enum(["active", "inactive"], "Status must be active or inactive").default("active"),
    configuration,
  })
  .superRefine((body, ctx) => {
    // The same existing entry cannot be submitted twice (it would be updated twice and lose one position).
    const seen = new Set();
    body.configuration.forEach((entry, i) => {
      if (entry.id === undefined) return;
      if (seen.has(entry.id)) ctx.addIssue({ code: "custom", path: ["configuration", i, "title"], message: "This entry is repeated" });
      seen.add(entry.id);
    });
  });
