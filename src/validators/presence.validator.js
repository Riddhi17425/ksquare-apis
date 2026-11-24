import { z } from "zod";
import { jsonArray, listQuery, optionalText, optionalUrl, requiredText } from "./common.validator.js";

export const MAX_CITIES = 50;

export const presenceCreateImages = { required: ["map_img"], all: ["map_img"], labels: { map_img: "Map image" } };
export const presenceUpdateImages = { all: ["map_img"], labels: { map_img: "Map image" } };

const city = z.object({
  city_name: requiredText("City name", 150),
  city_link: optionalUrl("City link"),
});

export const presenceBody = z.object({
  state_name: requiredText("State name", 150),
  state_link: optionalUrl("State link"),
  short_line: optionalText("Short line", 255),
  status: z.enum(["active", "inactive"], "Status must be active or inactive").default("active"),
  cities: jsonArray(city, MAX_CITIES, "Cities"),
});

export const listPresencesQuery = listQuery.extend({ status: z.enum(["active", "inactive"]).optional() });
