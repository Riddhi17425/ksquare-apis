import { z } from "zod";
import { flag, requiredRichText, requiredText } from "./common.validator.js";

export const testimonialImages = { all: ["profile_photo"] };

export const testimonialBody = z.object({
  name: requiredText("Name", 120),
  company: requiredText("Company", 150),
  description: requiredRichText("Description", 15000),
  remove_profile_photo: flag, // edit form: tick to delete the existing photo
});
