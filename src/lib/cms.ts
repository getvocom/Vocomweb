// Ordered access to the content collections, matching the Framer CMS order.
// `id` is the exact URL slug (from the `slug` front-matter field).
import { getCollection } from "astro:content";

export async function getPosts() {
  return (await getCollection("blog", (e) => !e.data.draft)).sort((a, b) => a.data.order - b.data.order);
}

export async function getProducts() {
  return (await getCollection("products", (e) => !e.data.draft)).sort((a, b) => a.data.order - b.data.order);
}
