import sanitizeHtml from "sanitize-html";

/** What the admin rich-text editor can produce. Everything else (scripts, styles, event handlers, iframes...) is removed. */
const OPTIONS = {
  allowedTags: [
    "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "strike", "sub", "sup", "code", "pre", "blockquote",
    "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "img",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "colgroup", "col",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
    col: ["span"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  // External links open in a new tab without leaking the opener.
  transformTags: { a: (tag, attribs) => ({ tagName: "a", attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" } }) },
};

export const sanitizeRich = (html) => sanitizeHtml(html, OPTIONS);

/** True when the HTML has visible content (an empty editor produces "<p></p>"). */
export const hasText = (html) => {
  if (/<(img|hr|table)\b/i.test(html)) return true;
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/&nbsp;|\s/g, "") !== "";
};
