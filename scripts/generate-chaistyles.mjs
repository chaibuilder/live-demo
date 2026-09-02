// Compiles the project's global Tailwind stylesheet to public/chaistyles.css.
//
// This file is the dedup reference for page styles: the ChaiBuilder page-style compiler
// (src/pro .../styles-helper.ts) strips every rule already present here, so a published page
// only inlines the CSS its blocks add on top of the global stylesheet.
//
// It must be generated from the same input Next.js compiles (public.css) so its selectors
// match what actually ships to the browser. Runs before `next build` / `next dev`.
//
// Output is intentionally NOT minified: minification merges selectors (`.a,.b{...}`), which
// would break the exact-selector matching the dedup filter relies on.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, "..");

const input = path.join(root, "src/app/(frontend)/public.css");
const output = path.join(root, "public/chaistyles.css");

const [{ default: postcss }, { default: tailwindcss }] = await Promise.all([
  import("postcss"),
  import("@tailwindcss/postcss"),
]);

const css = await fs.readFile(input, "utf8");
const result = await postcss([tailwindcss({ optimize: false })]).process(css, {
  from: input,
  to: output,
});

await fs.writeFile(output, result.css);
console.log(`[chaistyles] wrote ${path.relative(root, output)} (${(result.css.length / 1024).toFixed(1)} kB)`);
