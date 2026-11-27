import { settingsService } from "../../services/settings.service.js";
import { ok } from "../../utils/response.js";

/** { call_details, email_details, address_details: string[], facebook_link, instagram_link, linkedin_link } */
export const get = async (_req, res) => {
  const s = await settingsService.get();
  const values = (list) => list.map((e) => e.value);
  ok(res, {
    call_details: values(s.call_details),
    email_details: values(s.email_details),
    address_details: values(s.address_details),
    facebook_link: s.facebook_link,
    instagram_link: s.instagram_link,
    linkedin_link: s.linkedin_link,
    tel_number: s.tel_number,
  });
};
