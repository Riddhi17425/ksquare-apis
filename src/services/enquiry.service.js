import { enquiryModel } from "../models/enquiry.model.js";
import { ApiError } from "../utils/ApiError.js";

const notFound = () => ApiError.notFound("Enquiry not found");

export const enquiryService = {
  submit: (data, ip) => enquiryModel.create({ ...data, ip }),

  async list(filters) {
    const { rows, total } = await enquiryModel.list(filters);
    return {
      rows,
      meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.max(1, Math.ceil(total / filters.limit)) },
    };
  },

  async get(id) {
    const row = await enquiryModel.findById(id);
    if (!row) throw notFound();
    return row;
  },

  async updateStatus(id, status) {
    if (!(await enquiryModel.updateStatus(id, status))) throw notFound();
    return enquiryModel.findById(id);
  },

  async remove(id) {
    if (!(await enquiryModel.remove(id))) throw notFound();
  },

  stats: () => enquiryModel.countsByStatus(),
};
