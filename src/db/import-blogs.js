import { pool } from "../config/db.js";
import { blogService } from "../services/blog.service.js";
import { detectImageExt } from "../services/image.service.js";
import { blogBody } from "../validators/blog.validator.js";

/**
 * One-off import of the blogs published on https://www.ksquareenergy.com/blogs into this database.
 *
 *   npm run import:blogs -- --dry-run      list what would be imported
 *   npm run import:blogs                   import (blogs whose URL already exists are skipped, so it is safe to re-run)
 *   npm run import:blogs -- --author=2     author id for the imported blogs (default: the first active author)
 *
 * Older posts have no conclusion/CTA image on the site: their last paragraph is used as the conclusion, the
 * main image as the CTA image, and they are imported as drafts. Text goes through the same validation/sanitizing as the admin form, and images are saved like admin uploads.
 */
const SITE = "https://www.ksquareenergy.com";
const dryRun = process.argv.includes("--dry-run");
const authorArg = process.argv.find((a) => a.startsWith("--author="))?.split("=")[1];

const get = async (url, asJson) => {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "X-Requested-With": "XMLHttpRequest" }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  if (!asJson) return Buffer.from(await res.arrayBuffer());
  // The site appends stray HTML after the JSON document, so only parse up to its closing brace.
  const text = await res.text();
  const junk = text.indexOf('<div class="stealth"');
  return JSON.parse(junk === -1 ? text : text.slice(0, text.lastIndexOf("}", junk) + 1));
};
const getText = async (url) => (await get(url)).toString("utf8");

const decode = (s) =>
  s
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();

/** Every blog URL slug, from the paginated list (the site loads further pages as JSON until `html` is empty). */
async function listSlugs() {
  const slugs = [];
  for (let page = 1; page < 50; page++) {
    const { html } = await get(`${SITE}/blogs?page=${page}`, true);
    if (!html) break;
    for (const m of html.matchAll(/href="https:\/\/www\.ksquareenergy\.com\/blogs\/([a-z0-9-]+)"/g)) if (!slugs.includes(m[1])) slugs.push(m[1]);
  }
  return slugs;
}

/** Reads one blog detail page into the fields the admin form needs. */
async function scrape(slug) {
  const html = await getText(`${SITE}/blogs/${slug}`);
  const pick = (re) => html.match(re)?.[1];

  const ctaImage = pick(/src="([^"]*Blog_CTA_Images[^"]*)"/);
  let body, conclusion;
  if (ctaImage) {
    // Current layout: three content blocks (article, CTA image, conclusion).
    const blocks = html.split('<div class="cspt-entry-content">').slice(1);
    body = blocks[0]?.split("</div><!-- .entry-content -->")[0] ?? "";
    conclusion = (blocks[2]?.split("</div>")[0] ?? "").replace(/<h2>\s*Conclusion\s*<\/h2>/i, ""); // the site adds the heading itself
  } else {
    // Older posts: one long article, no conclusion and no CTA image. Its last paragraph becomes the conclusion.
    const article = (html.split('<div class="cspt-entry-content">')[1] ?? "").split("</article>")[0].replace(/<\/?div[^>]*>|<!--[\s\S]*?-->/g, "");
    const hasText = (p) => p[0].replace(/<[^>]+>|&nbsp;/g, "").trim() !== "";
    const last = [...article.matchAll(/<p[\s>][\s\S]*?<\/p>/g)].filter(hasText).at(-1);
    body = last ? article.slice(0, last.index) : article;
    conclusion = last ? last[0] : "";
  }

  const absolute = (src) => (src ? new URL(decode(src), SITE).href : null);
  return {
    url: slug,
    title: decode(pick(/<h1 class="cspt-post-title[^"]*">([\s\S]*?)<\/h1>/) ?? ""),
    description: body,
    conclusion,
    date: pick(/<span class="entry-date published">(\d{4}-\d{2}-\d{2})<\/span>/),
    meta_title: decode(pick(/<title>([\s\S]*?)<\/title>/) ?? ""),
    meta_description: decode(pick(/<meta name="description" content="([^"]*)"/) ?? ""),
    image: absolute(pick(/<img[^>]+src="([^"]+)"[^>]+wp-post-image/)),
    cta_image: absolute(ctaImage),
  };
}

async function image(url) {
  if (!url) throw new Error("image missing");
  const buffer = await get(url);
  if (!detectImageExt(buffer)) throw new Error(`unsupported image ${url}`);
  return [{ buffer }];
}

async function main() {
  let authorId = Number(authorArg);
  if (!authorId) {
    const [[author]] = await pool.execute("SELECT id FROM blog_authors WHERE status = 'active' AND deleted_at IS NULL ORDER BY id LIMIT 1");
    if (!author) throw new Error("Create a blog author first");
    authorId = author.id;
  }

  const slugs = await listSlugs();
  console.log(`Found ${slugs.length} blogs on ${SITE}/blogs${dryRun ? " (dry run)" : ""}, author id ${authorId}`);
  const result = { imported: 0, skipped: 0, failed: 0 };

  for (const slug of slugs) {
    try {
      if (!(await blogService.isUrlAvailable(slug))) {
        result.skipped++;
        console.log(`skip    ${slug} (already exists)`);
        continue;
      }
      const post = await scrape(slug);
      const body = blogBody.parse({
        ...post,
        author_id: authorId,
        short_description: post.meta_description,
        cta_text: "Contact us",
        status: post.cta_image ? "published" : "draft", // older posts are filled in with fallbacks, so they wait for review
      });
      if (dryRun) {
        console.log(`would   ${slug} (${post.date})`);
        continue;
      }
      const front = await image(post.image);
      await blogService.create(body, { front_image: front, detail_image: front, cta_image: post.cta_image ? await image(post.cta_image) : front });
      result.imported++;
      console.log(`import  ${slug}`);
    } catch (err) {
      result.failed++;
      console.error(`FAILED  ${slug}: ${err.issues ? err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") : err.message}`);
    }
  }
  console.log(result);
}

main()
  .catch((err) => {
    console.error("Import failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
