import { Router } from "express";
import { z } from "zod";
import { authorize } from "../middleware/authorize.js";
import { uploadDocuments, uploadImages } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../validators/common.validator.js";
import { created, ok } from "../utils/response.js";
import { documentFields, fieldLabel, imageFields, repeaterFileName, repeaterFileNames, repeaterImageFields } from "./resources.js";
import { bodySchema, querySchema, statusBody } from "./schema.js";
import { createService } from "./service.js";

/** The standard admin CRUD endpoints for one resource definition (see resources.js). */
export function createCrudRouter(res) {
  const service = createService(res);
  const body = bodySchema(res);
  const names = [...imageFields(res).map((f) => f.name), ...repeaterFileNames(res)];
  const labels = Object.fromEntries(imageFields(res).map((f) => [f.name, fieldLabel(f)]));
  const repeaterLabels = Object.fromEntries(
    (res.repeaters ?? []).flatMap((r) => repeaterImageFields(r).flatMap((f) => Array.from({ length: r.max }, (_, i) => [repeaterFileName(r, f, i), fieldLabel(f)]))),
  );
  const images = { required: imageFields(res).filter((f) => !f.optional).map((f) => f.name), all: names, labels: { ...labels, ...repeaterLabels } };
  const docNames = documentFields(res).map((f) => f.name);
  const docLabels = Object.fromEntries(documentFields(res).map((f) => [f.name, fieldLabel(f)]));
  const documents = { required: documentFields(res).filter((f) => !f.optional).map((f) => f.name), all: docNames, labels: docLabels };
  // Resources with PDF fields use the document uploader; resources without any file are sent as JSON.
  const upload = docNames.length ? [uploadDocuments([...names, ...docNames])] : names.length ? [uploadImages(names)] : [];

  const router = Router();

  router.get("/", validate({ query: querySchema(res) }), async (req, response) => {
    const { rows, meta } = await service.list(req.valid.query);
    ok(response, rows, { meta });
  });

  router.get("/options", async (_req, response) => ok(response, await service.options())); // before /:id

  router.post("/", ...upload, validate({ body, images, documents }), async (req, response) =>
    created(response, await service.create(req.valid.body, req.files), `${res.label} created`),
  );

  router.get("/:id", validate({ params: idParams }), async (req, response) => ok(response, await service.get(req.valid.params.id)));

  router.put("/:id", ...upload, validate({ params: idParams, body, images: { all: names, labels }, documents: { all: docNames, labels: docLabels } }), async (req, response) =>
    ok(response, await service.update(req.valid.params.id, req.valid.body, req.files), { message: `${res.label} updated` }),
  );

  router.patch("/:id/status", validate({ params: idParams, body: statusBody }), async (req, response) =>
    ok(response, await service.updateStatus(req.valid.params.id, req.valid.body.status), { message: "Status updated" }),
  );

  // Quick on/off toggle of a yes/no field (e.g. "Featured") straight from the list.
  const flagNames = res.fields.filter((f) => f.type === "bool").map((f) => f.name);
  if (flagNames.length)
    router.patch("/:id/flag", validate({ params: idParams, body: z.object({ field: z.enum(flagNames), value: z.boolean() }) }), async (req, response) =>
      ok(response, await service.updateFlag(req.valid.params.id, req.valid.body.field, req.valid.body.value), { message: "Updated" }),
    );

  router.delete("/:id", authorize("super_admin"), validate({ params: idParams }), async (req, response) => {
    await service.remove(req.valid.params.id);
    ok(response, null, { message: `${res.label} deleted` });
  });

  return router;
}
