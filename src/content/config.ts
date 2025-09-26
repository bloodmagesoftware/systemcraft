import { defineCollection, reference, z } from "astro:content";

const courses = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		description: z.string(),
		authors: z.array(reference("authors")),
		// pubDate: z.coerce.date(),
		// updatedDate: z.coerce.date().optional(),
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
