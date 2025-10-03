// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import expressiveCode from "astro-expressive-code";
import { defineConfig } from "astro/config";
import rehypeMermaid from "rehype-mermaid";

import tailwindcss from "@tailwindcss/vite";
import zipDirPlugin from "./scripts/vite-plugins/zipDirPlugin";

import preact from "@astrojs/preact";

// https://astro.build/config
export default defineConfig({
	site: "https://systemcraft.dev",

	integrations: [
		expressiveCode(),
		mdx({ extendMarkdownConfig: true }),
		sitemap(),
		preact({ compat: true, include: ["**/preact/*"] }),
	],

	markdown: {
		syntaxHighlight: { excludeLangs: ["mermaid"] },
		rehypePlugins: [
			[
				rehypeMermaid,
				{
					strategy: "img-svg",
					colorScheme: "dark",
					mermaidConfig: { theme: "dark" },
				},
			],
		],
	},

	vite: {
		plugins: [
			tailwindcss(),
			zipDirPlugin({
				root: "source/content/examples", // where your example dirs live
				query: "zip", // import ?zip
			}),
		],
	},
});
