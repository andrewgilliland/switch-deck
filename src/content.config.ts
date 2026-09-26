import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const decks = defineCollection({
  loader: glob({
    base: "./src/content/decks",
    pattern: "**/deck.json",
    generateId: ({ entry }) => entry.replace(/\/deck\.json$/, ""),
  }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    draft: z.boolean().default(false),
  }),
});

const slides = defineCollection({
  loader: glob({
    base: "./src/content/decks",
    pattern: "**/slides/*.{md,mdx}",
    generateId: ({ entry }) => entry.replace(/\.(?:md|mdx)$/, ""),
  }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    order: z.number().int(),
  }),
});

export const collections = { decks, slides };
