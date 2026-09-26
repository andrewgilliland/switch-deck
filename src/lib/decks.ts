import { getCollection, type CollectionEntry } from "astro:content";

const RESERVED_ROUTES = new Set([
  "404",
  "_actions",
  "_astro",
  "_server_islands",
  "about",
  "settings",
]);

export interface Deck {
  metadata: CollectionEntry<"decks">;
  slides: CollectionEntry<"slides">[];
  slug: string;
}

export async function getDecks(): Promise<Deck[]> {
  const [metadataEntries, slideEntries] = await Promise.all([
    getCollection("decks", ({ data }) => !import.meta.env.PROD || !data.draft),
    getCollection("slides"),
  ]);

  const seenSlugs = new Set<string>();

  return metadataEntries
    .map((metadata) => {
      const slug = metadata.id;

      if (seenSlugs.has(slug)) {
        throw new Error(`Duplicate Deck slug "${slug}".`);
      }
      if (RESERVED_ROUTES.has(slug)) {
        throw new Error(`Deck slug "${slug}" collides with a reserved route.`);
      }
      seenSlugs.add(slug);

      const slides = slideEntries
        .filter(({ id }) => id.startsWith(`${slug}/slides/`))
        .sort((left, right) => left.data.order - right.data.order);

      validateSlides(slug, slides);

      return { metadata, slides, slug };
    })
    .sort((left, right) =>
      left.metadata.data.title.localeCompare(right.metadata.data.title),
    );
}

function validateSlides(
  slug: string,
  slides: CollectionEntry<"slides">[],
): void {
  if (slides.length === 0) {
    throw new Error(`Deck "${slug}" must contain at least one Slide.`);
  }

  const seenSlugs = new Map<string, string>();
  const seenOrders = new Map<number, string>();

  for (const slide of slides) {
    const duplicateSlug = seenSlugs.get(slide.data.slug);
    if (duplicateSlug) {
      throw new Error(
        `Deck "${slug}" has duplicate Slide slug "${slide.data.slug}" in "${duplicateSlug}" and "${slide.id}".`,
      );
    }

    const duplicateOrder = seenOrders.get(slide.data.order);
    if (duplicateOrder) {
      throw new Error(
        `Deck "${slug}" has duplicate Slide order ${slide.data.order} in "${duplicateOrder}" and "${slide.id}".`,
      );
    }

    seenSlugs.set(slide.data.slug, slide.id);
    seenOrders.set(slide.data.order, slide.id);
  }
}
