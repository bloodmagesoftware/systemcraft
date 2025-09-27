import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";

export async function GET(context) {
	const courses = await getCollection("courses");
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: courses.map((c) => ({
			...c.data,
			link: `/courses/${c.slug}`,
		})),
	});
}
