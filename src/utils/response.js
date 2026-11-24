/** Uniform success envelope: { success, message, data, meta } */
export function ok(res, data = null, { message = "OK", status = 200, meta } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export const created = (res, data, message = "Created") => ok(res, data, { message, status: 201 });
