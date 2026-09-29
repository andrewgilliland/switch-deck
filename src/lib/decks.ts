import { getCollection, type CollectionEntry } from "astro:content";
import { buildDecks } from "./deck-catalog";

export interface Deck {
  metadata: CollectionEntry<"decks">;
  slides: CollectionEntry<"slides">[];
  slug: string;
}

export async function getDecks(): Promise<Deck[]> {
  const [metadataEntries, slideEntries] = await Promise.all([
    getCollection("decks"),
    getCollection("slides"),
  ]);

  return buildDecks(metadataEntries, slideEntries, import.meta.env.PROD);
}
