import { describe, expect, it } from "vitest";
import { buildDecks } from "./deck-catalog";

function metadata(id: string, title: string, draft = false) {
  return { id, data: { title, description: `${title} description`, draft } };
}

function slide(id: string, slug: string, order: number) {
  return { id, data: { title: slug, slug, order } };
}

describe("Deck catalog", () => {
  it("sorts Decks by title and Slides by Slide Order", () => {
    const decks = buildDecks(
      [metadata("zulu", "Zulu"), metadata("alpha", "Alpha")],
      [
        slide("alpha/slides/second", "second", 20),
        slide("alpha/slides/first", "first", 10),
        slide("zulu/slides/opening", "opening", 10),
      ],
      false,
    );

    expect(decks.map(({ slug }) => slug)).toEqual(["alpha", "zulu"]);
    expect(decks[0].slides.map(({ data }) => data.slug)).toEqual([
      "first",
      "second",
    ]);
  });

  it("excludes draft Decks only in production", () => {
    const metadataEntries = [
      metadata("published", "Published"),
      metadata("draft", "Draft", true),
    ];
    const slideEntries = [
      slide("published/slides/intro", "intro", 10),
      slide("draft/slides/intro", "intro", 10),
    ];

    expect(buildDecks(metadataEntries, slideEntries, false)).toHaveLength(2);
    expect(buildDecks(metadataEntries, slideEntries, true).map(({ slug }) => slug))
      .toEqual(["published"]);
  });

  it("rejects a Deck without Slides", () => {
    expect(() => buildDecks([metadata("empty", "Empty")], [], false)).toThrow(
      'Deck "empty" must contain at least one Slide.',
    );
  });

  it("rejects duplicate Slide slugs within a Deck", () => {
    expect(() =>
      buildDecks([metadata("talk", "Talk")], [
        slide("talk/slides/first", "intro", 10),
        slide("talk/slides/second", "intro", 20),
      ], false),
    ).toThrow('Deck "talk" has duplicate Slide slug "intro"');
  });

  it("rejects duplicate Slide Order values within a Deck", () => {
    expect(() =>
      buildDecks([metadata("talk", "Talk")], [
        slide("talk/slides/first", "intro", 10),
        slide("talk/slides/second", "demo", 10),
      ], false),
    ).toThrow('Deck "talk" has duplicate Slide order 10');
  });

  it("rejects Deck slugs reserved by the application", () => {
    expect(() =>
      buildDecks([metadata("about", "About")], [
        slide("about/slides/intro", "intro", 10),
      ], false),
    ).toThrow('Deck slug "about" collides with a reserved route.');
  });
});