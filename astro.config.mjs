// @ts-check
import { defineConfig } from "astro/config";
import rehypeMermaid from "rehype-mermaid";
import starlight from "@astrojs/starlight";
import { readdirSync, statSync } from "fs";
import { join } from "path";

/**
 * Special case words that should maintain specific capitalization
 */
const SPECIAL_CASE_WORDS = [
  "VCS",
  "API",
  "HTML",
  "CSS",
  "JavaScript",
  "JSON",
  "XML",
  "HTTP",
  "HTTPS",
  "URL",
  "UI",
  "UX",
  "CI",
  "CD",
];

/**
 * Build regex pattern for special case words (compiled once)
 */
const SPECIAL_WORDS_REGEX = new RegExp(
  `\\b(${SPECIAL_CASE_WORDS.join("|")})\\b`,
  "gi"
);

/**
 * Transform file/directory name into a title
 */
function nameToTitle(name) {
  let title = name
    .replace(/^\d+[-_]/, "") // Remove leading numbers with dash/underscore
    .replace(/[-_]/g, " ") // Replace dashes and underscores with spaces
    .replace(/\.(md|mdx)$/, "") // Remove file extensions
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  // Apply special case words with word boundaries
  return title.replace(SPECIAL_WORDS_REGEX, (match) => {
    return SPECIAL_CASE_WORDS.find(
      (word) => word.toLowerCase() === match.toLowerCase()
    );
  });
}

/**
 * Sort function for sidebar items (lexical sort)
 */
function sortItems(a, b) {
  if (a === "start_here") return -1;
  if (b === "start_here") return 1;
  return a.localeCompare(b);
}

/**
 * Generate slug from filename by stripping leading numbers
 */
function generateSlug(filename, basePath = "") {
  const nameWithoutExt = filename.replace(/\.(md|mdx)$/, "");
  const cleanName = nameWithoutExt.replace(/^\d+[-_]/, "");
  return basePath ? join(basePath, cleanName).replace(/\\/g, "/") : cleanName;
}

/**
 * Recursively generate sidebar items for a directory
 */
function generateSidebarItems(dirPath, relativePath = "") {
  const items = [];

  try {
    const entries = readdirSync(dirPath).sort(sortItems);

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        const subItems = generateSidebarItems(
          fullPath,
          join(relativePath, entry),
        );
        if (subItems.length > 0) {
          items.push({
            label: nameToTitle(entry),
            items: subItems,
          });
        }
      } else if (entry.match(/\.(md|mdx)$/) && entry !== "index.mdx") {
        items.push({
          label: nameToTitle(entry),
          slug: generateSlug(entry, relativePath),
        });
      }
    }
  } catch (error) {
    console.warn(`Could not read directory: ${dirPath}`);
  }

  return items;
}

/**
 * Generate complete sidebar from docs directory
 */
function generateCompleteSidebar() {
  const docsPath = join(process.cwd(), "src/content/docs");
  const sidebar = [];

  try {
    const entries = readdirSync(docsPath).sort(sortItems);

    for (const entry of entries) {
      const fullPath = join(docsPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        const subItems = generateSidebarItems(fullPath, entry);
        if (subItems.length > 0) {
          sidebar.push({
            label: nameToTitle(entry),
            items: subItems,
          });
        }
      } else if (entry.match(/\.(md|mdx)$/) && entry !== "index.mdx") {
        sidebar.push({
          label: nameToTitle(entry),
          slug: generateSlug(entry),
        });
      }
    }
  } catch (error) {
    console.warn(`Could not read docs directory: ${docsPath}`);
  }

  return sidebar;
}

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "SystemCraft",
      social: [
        {
          icon: "linkedin",
          label: "LinkedIn",
          href: "https://www.linkedin.com/company/108611021",
        },
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/bloodmagesoftware",
        },
        {
          icon: "external",
          label: "Website",
          href: "https://www.bloodmagesoftware.de",
        },
      ],
      sidebar: generateCompleteSidebar(),
    }),
  ],
  markdown: {
    rehypePlugins: [[rehypeMermaid, { strategy: "img-svg", dark: true }]],
  },
});
