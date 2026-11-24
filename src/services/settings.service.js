import { withTransaction } from "../config/db.js";
import { settingsModel } from "../models/settings.model.js";

const TYPES = { call: "call_details", email: "email_details", address: "address_details" };

async function load() {
  const { row, entries } = await settingsModel.get();
  const out = { ...row };
  for (const field of Object.values(TYPES)) out[field] = [];
  for (const e of entries) out[TYPES[e.type]].push({ id: e.id, value: e.value });
  return out;
}

export const settingsService = {
  get: load,

  async save(body) {
    await withTransaction(async (conn) => {
      await settingsModel.updateLinks(conn, body);
      await settingsModel.replaceEntries(conn, {
        call: body.call_details.map((e) => e.value),
        email: body.email_details.map((e) => e.value),
        address: body.address_details.map((e) => e.value),
      });
    });
    return load();
  },
};
