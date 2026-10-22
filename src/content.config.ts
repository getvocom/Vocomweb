// Content collections. Blog posts and products were exported from the Framer CMS;
// field names are listed in CLAUDE.md. `slug` is the exact live URL segment and
// must never be changed once published.
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const image = z.object({ src: z.string(), alt: z.string().default("") });

const blog = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/blog" }),
  schema: z.object({
    slug: z.string(),
    order: z.number(),
    draft: z.boolean().optional(),
    cardTitle: z.string(),
    title: z.string(),
    metaTitle: z.string().optional(),
    description: z.string().optional(),
    image: image.optional(),
    showOnHomepage: z.boolean().optional(),
    industry: z.string().optional(),
    product: z.string().optional(),
    intro: z.string().optional(),
    buttonText: z.string().optional(),
    buttonLink: z.string().optional(),
    section1Title: z.string().optional(), section1Body: z.string().optional(),
    section2Title: z.string().optional(), section2Body: z.string().optional(),
    section3Title: z.string().optional(), section3Body: z.string().optional(),
    section4Title: z.string().optional(), section4Body: z.string().optional(),
    section5Title: z.string().optional(), section5Body: z.string().optional(),
    gallery1: image.optional(), gallery2: image.optional(), gallerySide1: image.optional(),
    gallerySide2: image.optional(), gallery3: image.optional(), gallery4: image.optional(),
    bottomHeading: z.string().optional(), bottomBody: z.string().optional(),
    finalHeading: z.string().optional(), finalBody: z.string().optional(),
    showCarousel: z.boolean().optional(),
    carousel1: image.optional(), carousel2: image.optional(), carousel3: image.optional(), carousel4: image.optional(),
  }),
});

const products = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/products" }),
  schema: z.object({
    slug: z.string(),
    order: z.number(),
    draft: z.boolean().optional(),
    name: z.string(),
    category: z.string(),
    codes: z.string().optional(),
    fiberCounts: z.string().optional(),
    construction: z.string().optional(),
    typicalUse: z.string().optional(),
    description: z.string().optional(),
    image: image.optional(),
    metaTitle: z.string().optional(), // overrides the page <title>
    metaDescription: z.string().optional(), // overrides the meta description
  }),
});

export const collections = { blog, products };
