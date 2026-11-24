import { enquiryService } from "../../services/enquiry.service.js";
import { created } from "../../utils/response.js";

export const submit = async (req, res) => {
  const id = await enquiryService.submit(req.valid.body, req.ip);
  created(res, { id }, "Thank you! Your enquiry has been received.");
};
