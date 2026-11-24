# ksquare-api

Express + MySQL backend for the Ksquare website. The Next.js app (`ksquare-next`) never touches the database; the
public site and the admin panel both talk to this API.

## Setup
```
cp .env.example .env      # fill DB_*, SEED_ADMIN_*
npm install
npm run migrate           # applies migrations/*.sql
npm run seed              # creates the first super admin
npm run dev               # http://localhost:4000
```
The Next.js app needs `ADMIN_API_URL=http://localhost:4000/api/v1` in its `.env.local`.

## Layout
```
src/config       env (validated), db pool + transactions
src/routes       frontend/ (public)   admin/ (authenticated)
src/controllers  thin HTTP handlers, split frontend/ and admin/
src/services     business logic (auth, enquiries, mail)
src/models       all SQL (parameterized)
src/validators   zod schemas      src/middleware  authenticate, authorize, validate, rate limits, errors
migrations/      numbered .sql files, tracked in schema_migrations
```

## Endpoints (`/api/v1`)
| Method | Path | Auth |
|---|---|---|
| POST | /frontend/enquiries | public (rate limited) |
| POST | /admin/auth/login | public |
| POST | /admin/auth/forgot-password | public |
| GET / POST | /admin/auth/reset-password | public (token) |
| GET | /admin/auth/me | session |
| GET / PUT | /admin/profile | session (own name + email) |
| PUT | /admin/profile/password | session (current + new password; signs out other devices) |
| POST | /admin/auth/logout | session |
| GET | /admin/enquiries, /admin/enquiries/stats, /admin/enquiries/:id | session |
| PATCH | /admin/enquiries/:id/status | session |
| DELETE | /admin/enquiries/:id | session, `super_admin` only |

| GET / POST | /admin/testimonials | session |
| GET / PUT | /admin/testimonials/:id | session |
| DELETE | /admin/testimonials/:id | session, `super_admin` only |
| GET / POST | /admin/blogs (list: ?page&limit&q&status) | session |
| GET | /admin/blogs/check-url?url=&exclude= | session |
| GET / PUT | /admin/blogs/:id | session |
| PATCH | /admin/blogs/:id/status | session |
| DELETE | /admin/blogs/:id (soft delete) | session, `super_admin` only |
| GET / POST | /admin/categories | session |
| GET / PUT | /admin/categories/:id | session |
| DELETE | /admin/categories/:id | session, `super_admin` only |
| GET | /admin/authors | session |
| GET / POST | /admin/products (list: ?page&limit&q&status; multipart: list_img, detail_img_0..9, faqs + keep_image_ids as JSON) | session |
| GET / PUT | /admin/products/:id | session |
| DELETE | /admin/products/:id (soft delete) | session, `super_admin` only |
| GET / POST | /admin/ksquare-presences (multipart: map_img, cities as JSON) | session |
| GET / PUT | /admin/ksquare-presences/:id | session |
| DELETE | /admin/ksquare-presences/:id (soft delete) | session, `super_admin` only |
| GET / PUT | /admin/settings (single record: call/email/address lists + social links) | session |
| GET / POST | /admin/faq-categories (list: ?page&limit&q&status) | session |
| GET | /admin/faq-categories/options (active, non-deleted only) | session |
| GET / PUT | /admin/faq-categories/:id | session |
| PATCH | /admin/faq-categories/:id/status | session |
| DELETE | /admin/faq-categories/:id (soft delete) | session, `super_admin` only |
| GET / POST | /admin/faqs (list: ?page&limit&q&category_id; POST takes `{category_id, items:[{question,answer}]}`) | session |
| GET / PUT | /admin/faqs/:id | session |
| DELETE | /admin/faqs/:id | session, `super_admin` only |

Create/update endpoints for testimonials, blogs and categories take `multipart/form-data` (images: JPG/PNG/WebP, max 2 MB each,
verified by magic bytes). Category configuration entries are sent as a JSON `configuration` field plus `config_icon_<index>` files.
Uploaded files are stored in `UPLOAD_DIR` and served read-only from `/uploads`.

Responses: `{ success, message, data, meta? }`; errors: `{ success:false, message, code, errors? }`.

## Validation (server side)
Every endpoint that takes input is validated with zod before it reaches a controller (`src/validators`, applied by the `validate` middleware);
errors come back as `422 { code: "VALIDATION_ERROR", errors: [{ field, message }] }`. The browser is never trusted.
- Text: required fields are trimmed and rejected when empty, over their column length, or containing control characters (NUL, escape codes).
- Numbers/ids: ids are capped at INT UNSIGNED, `page` <= 100000, `limit` <= 100.
- Images: JPG/PNG/WebP only, 2 MB each, type detected from file bytes (not the file name or the sent mimetype).
- Uniqueness: blog URL (live blogs), FAQ category name (live categories), product category name, FAQ question per category.
- Settings: phone numbers need 6-15 digits; social links must be http(s) links to the matching network; no repeated phone/email/address entries.
- Extra fields in a request are ignored (no mass assignment of `id`, `deleted_at`, ...).

## Security notes
- Passwords: bcrypt (cost 12). Policy: 10-72 chars with upper, lower, number.
- Sessions: random 256-bit bearer token, only its SHA-256 is stored; absolute (8h) + idle (2h) expiry; revoked on
  logout, password reset and account deactivation.
- Login: constant-time-ish (dummy hash for unknown emails), generic error, per-account lockout (5 fails / 15 min) plus IP rate limits.
- Reset tokens: hashed, single use, 30 min; resetting signs out every session. Forgot-password reports "no admin account found" for unknown emails (clearer UX; it is strictly rate limited).
- All SQL is parameterized; input validated with zod; helmet, CORS allow-list, body size limit.
- Production: set `NODE_ENV=production`, configure SMTP (otherwise reset emails are not sent), serve over HTTPS,
  and keep the API reachable only from the Next.js server (it trusts `X-Forwarded-For` from loopback only).
