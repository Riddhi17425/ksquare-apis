import { enquiryService } from "../../services/enquiry.service.js";
import { ok } from "../../utils/response.js";

export const list = async (req, res) => {
  const { rows, meta } = await enquiryService.list(req.valid.query);
  ok(res, rows, { meta });
};

export const stats = async (_req, res) => ok(res, await enquiryService.stats());

export const get = async (req, res) => ok(res, await enquiryService.get(req.valid.params.id));

export const updateStatus = async (req, res) =>
  ok(res, await enquiryService.updateStatus(req.valid.params.id, req.valid.body.status), { message: "Status updated" });

export const remove = async (req, res) => {
  await enquiryService.remove(req.valid.params.id);
  ok(res, null, { message: "Enquiry deleted" });
};
