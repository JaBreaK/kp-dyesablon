import { z, defineCollection } from "astro:content";
import { file } from "astro/loaders";

const plates = defineCollection({
	loader: file("src/data/plates.json"),
	schema: z.object({
		slug: z.string(),
		prettyName: z.string(),
		description: z.string(),
		image: z.string().optional(), // ← tambahkan di sini
		plates: z.array(
			z.object({
				name: z.string(),
				description: z.string(),
				price: z.number(),
			})
		),
	}),
});



const reviews = defineCollection({
	loader: file("src/data/reviews.json"),
	schema: z.object({
		author: z.string(),
		review: z.string(),
	}),
});

const gallery = defineCollection({
	loader: file("src/data/gallery.json"),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			alt: z.string(),
			image: image(),
		}),
});

export const collections = { plates, reviews, gallery };
