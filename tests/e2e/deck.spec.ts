import { expect, test } from "@playwright/test";

test("reports gamepad availability and button presses in the console", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const gamepad = {
      index: 0,
      id: "Test Joy-Con (L)",
      mapping: "",
      axes: [],
      buttons: [
        {
          pressed: false,
          get value() {
            return document.body?.dataset.testPressed === "true" ? 1 : 0;
          },
        },
        { pressed: false },
      ],
    };
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [gamepad],
    });
  });

  const messages: string[] = [];
  page.on("console", (message) => messages.push(message.text()));
  await page.goto("/presentation-1");
  await expect
    .poll(() =>
      messages.some((message) => message.includes("Gamepad diagnostics ready")),
    )
    .toBe(true);
  await expect
    .poll(() =>
      messages.some((message) => message.includes("Gamepad detected")),
    )
    .toBe(true);

  await page.evaluate(() => {
    document.body.dataset.testPressed = "true";
  });
  await expect
    .poll(() =>
      messages.some((message) =>
        message.includes("Test Joy-Con (L) pressed buttons [0]"),
      ),
    )
    .toBe(true);
});

test("catalog opens a published Deck", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Presentation library" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Switch Deck/ }).click();
  await expect(page).toHaveURL(/\/presentation-1#intro$/);
});

test("hash navigation preserves interactive Slide state", async ({ page }) => {
  await page.goto("/presentation-1#components");
  await expect(page.locator("[data-slide].is-active")).toHaveAttribute(
    "data-slug",
    "components",
  );
  await page.getByRole("button", { name: "Start presentation" }).click();
  await expect(page.locator("[data-slide].is-active")).not.toHaveAttribute(
    "data-overflow",
    "true",
  );

  const increment = page.getByRole("button", { name: "Increment" });
  await increment.click();
  await expect(page.locator(".counter-demo span")).toHaveText("1");

  await increment.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#components$/);

  await increment.evaluate((button) => button.blur());
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#finish$/);
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".counter-demo span")).toHaveText("1");
});

test("invalid hashes fall back to the first Slide", async ({ page }) => {
  await page.goto("/presentation-1#missing");
  await expect(page).toHaveURL(/#intro$/);
  await expect(page.locator("[data-slide].is-active")).toHaveAttribute(
    "data-slug",
    "intro",
  );
});

test("the presentation stage stays 16:9 without viewport overflow", async ({
  page,
}) => {
  await page.goto("/presentation-1");
  const stage = page.locator(".deck-stage");
  const box = await stage.boundingBox();

  expect(box).not.toBeNull();
  expect(box!.width / box!.height).toBeCloseTo(16 / 9, 1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
