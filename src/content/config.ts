import { defineCollection, reference, z } from "astro:content";

const courses = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		description: z.string(),
		authors: z.array(reference("authors")),
		examples: z.array(z.string()).optional(),
		dependencies: z.array(reference("courses")).optional(),
		categories: z.array(z.string()).optional(),
		unfinished: z.boolean().default(false),
		tags: z.array(z.string()).default([]),
	}),
});

const authors = defineCollection({
	type: "data",
	schema: z.object({
		name: z.string(),
		github: z.string().optional(),
	}),
});

export const collections = { courses, authors };
