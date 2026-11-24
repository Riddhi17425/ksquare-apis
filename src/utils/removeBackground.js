import sharp from "sharp";

const TOLERANCE = 9; // max per-channel difference from the background colour
const FEATHER = 5; // extra range over which edge pixels fade out, so cut-outs are not jagged

/** PNG with the transparent margin cropped away, so the product fills its slot on the product page. */
const cropped = async (input) => {
  const png = await sharp(input).png().toBuffer();
  return sharp(png).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 }).png().toBuffer();
};

/**
 * Makes the solid background of a product photo transparent.
 *
 * The background colour is taken from the image corners; every pixel connected to the border whose colour is
 * close to it becomes transparent. Photos whose corners differ (no solid background) or that already have
 * transparency are returned unchanged. Output is always PNG, cropped to the product.
 */
export async function removeBackground(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const px = (x, y) => (y * width + x) * 4;

  // Already transparent: nothing to remove.
  for (let i = 3; i < data.length; i += 4) if (data[i] < 250) return cropped(buffer);

  const corners = [px(0, 0), px(width - 1, 0), px(0, height - 1), px(width - 1, height - 1)];
  const bg = [0, 1, 2].map((c) => Math.round(corners.reduce((sum, o) => sum + data[o + c], 0) / 4));
  const dist = (o) => Math.max(Math.abs(data[o] - bg[0]), Math.abs(data[o + 1] - bg[1]), Math.abs(data[o + 2] - bg[2]));
  if (corners.some((o) => dist(o) > TOLERANCE)) return sharp(buffer).png().toBuffer(); // no uniform background: keep the photo as it is

  // Flood fill from every border pixel through background-coloured pixels.
  const seen = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y) => {
    const i = y * width + x;
    if (!seen[i] && dist(i * 4) <= TOLERANCE + FEATHER) {
      seen[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < width; x++) (push(x, 0), push(x, height - 1));
  for (let y = 0; y < height; y++) (push(0, y), push(width - 1, y));
  while (stack.length) {
    const i = stack.pop();
    const x = i % width;
    const y = (i - x) / width;
    if (x > 0) push(x - 1, y);
    if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < height - 1) push(x, y + 1);
  }

  for (let i = 0; i < seen.length; i++) {
    if (!seen[i]) continue;
    const d = dist(i * 4);
    // Fully transparent within the tolerance, fading to opaque across the feather range.
    data[i * 4 + 3] = d <= TOLERANCE ? 0 : Math.round(((d - TOLERANCE) / FEATHER) * 255);
  }
  return cropped(await sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer());
}
