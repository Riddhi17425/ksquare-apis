import { z } from "zod";
import { requiredText } from "./common.validator.js";

/** Multipart forms send each section as a JSON string; plain JSON requests send the array itself. */
const json = (v) => {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

export const PROJECTS_STEPS = 6; // the page's timeline has six places

/** Editable sections of the website's Projects page. (Step icons travel as files named steps_icon_<n>, not in the body.) */
export const projectsPageBody = z.object({
  // "Every Project Has a Story Behind the Numbers" table
  stats: z.preprocess(
    json,
    z
      .array(
        z.object({
          profile: requiredText("Project profile", 255),
          capacity: requiredText("System capacity", 100),
          generation: requiredText("Annual generation", 100),
          type: requiredText("Project type", 100),
          location: requiredText("Project location", 100),
        }),
      )
      .max(20, "At most 20 rows"),
  ),
  // "How a Ksquare project actually runs"
  steps: z.preprocess(
    json,
    z
      .array(z.object({ title: requiredText("Title", 100), desc: requiredText("Description", 255) }))
      .length(PROJECTS_STEPS, `There must be exactly ${PROJECTS_STEPS} steps`),
  ),
  // "Frequently Asked Questions"
  faqs: z.preprocess(json, z.array(z.object({ question: requiredText("Question", 255), answer: requiredText("Answer", 2000) })).max(20, "At most 20 questions")),
});
