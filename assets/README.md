# /assets

The pages are intentionally **image-light** for speed (good for Google Ads Quality
Score). All icons are inline SVG and backgrounds are CSS gradients, so **no images are
required** for the pages to work.

If you want to add photography later, drop files here and reference them with
`loading="lazy"` for anything below the fold. Suggested optional assets:

- `og-criminal-traffic.jpg` / `og-corporate-commercial.jpg` — 1200×630 social/Open Graph
  share images (add matching `<meta property="og:image">` tags in each page `<head>`).
- `favicon.svg` / `favicon.ico` — site icon (add `<link rel="icon">` to each `<head>`).
- `hero-*.jpg` — optional calm office / Merrylands imagery if you replace the gradient
  hero. Keep it subtle and compress hard (aim < 150 KB, WebP/AVIF preferred).

Keep total page weight low — the current build first-paints with just `styles.css`.
