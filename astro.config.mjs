// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import rehypeMermaid from "rehype-mermaid";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://systemcraft.com",

  integrations: [
      expressiveCode(),
      mdx({ extendMarkdownConfig: true }),
      sitemap(),
	],

  markdown: {
      syntaxHighlight: { excludeLangs: ["mermaid"] },
      rehypePlugins: [[rehypeMermaid, { strategy: "img-svg", dark: true }]],
	},

  vite: {
    plugins: [tailwindcss()],
  },
});