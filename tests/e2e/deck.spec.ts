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

test("calibrates distinct buttons, saves the profile, and reports disconnect", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 8 }, () => false);
    const gamepad = {
      index: 0,
      id: "Test Joy-Con (L)",
      mapping: "",
      axes: [],
      buttons: buttons.map((_, index) => ({
        get pressed() {
          return buttons[index];
        },
        get value() {
          return buttons[index] ? 1 : 0;
        },
      })),
    };
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [gamepad],
    });
    window.addEventListener("testgamepadbutton", (event) => {
      const { index, pressed } = (event as CustomEvent).detail;
      buttons[index] = pressed;
    });
    window.addEventListener("testgamepaddisconnect", () => {
      const event = new Event("gamepaddisconnected");
      Object.defineProperty(event, "gamepad", { value: gamepad });
      window.dispatchEvent(event);
    });
  });

  await page.goto("/presentation-1");
  const prompt = page.locator("[data-calibration-prompt]");
  const messages: string[] = [];
  page.on("console", (message) => messages.push(message.text()));
  const setButton = async (index: number, pressed: boolean) => {
    await page.evaluate(
      ({ index, pressed }) =>
        window.dispatchEvent(
          new CustomEvent("testgamepadbutton", { detail: { index, pressed } }),
        ),
      { index, pressed },
    );
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
  };

  await setButton(0, true);
  await expect(prompt).toHaveText("Release all buttons");
  await expect
    .poll(() =>
      messages.some((message) =>
        message.includes("Test Joy-Con (L) pressed buttons [0]"),
      ),
    )
    .toBe(true);
  await setButton(0, false);
  await expect
    .poll(() =>
      messages.some((message) =>
        message.includes("Test Joy-Con (L) released buttons [0]"),
      ),
    )
    .toBe(true);
  await expect
    .poll(() => prompt.textContent(), { message: messages.join("\n") })
    .toBe("Press Previous");
  await setButton(2, true);
  await expect
    .poll(() =>
      messages.some((message) =>
        message.includes("Test Joy-Con (L) pressed buttons [2]"),
      ),
    )
    .toBe(true);
  await expect(prompt).toHaveText("Release all buttons");
  await setButton(2, false);
  await expect
    .poll(() =>
      messages.some((message) =>
        message.includes("Test Joy-Con (L) released buttons [2]"),
      ),
    )
    .toBe(true);
  await expect(prompt).toHaveText("Press Next");
  await setButton(5, true);
  await expect(page.locator("[data-calibration]")).toBeHidden();
  await expect(page.locator("[data-status]")).toContainText("configured");

  const profile = await page.evaluate(() =>
    localStorage.getItem("switch-deck:controller:Test Joy-Con (L)::raw::8::0"),
  );
  expect(JSON.parse(profile!)).toEqual({ previous: [2], next: [5] });

  await page.evaluate(() =>
    window.dispatchEvent(new Event("testgamepaddisconnect")),
  );
  await expect
    .poll(() =>
      messages.some((message) => message.includes("Gamepad disconnected")),
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

test("start dismisses the launch overlay and navigation clamps at both ends", async ({
  page,
}) => {
  await page.goto("/presentation-1");
  const launch = page.locator("[data-launch]");
  const previous = page.getByRole("button", { name: "Previous Slide" });
  const next = page.getByRole("button", { name: "Next Slide" });

  await expect(previous).toBeDisabled();
  await page.getByRole("button", { name: "Start presentation" }).click();
  await expect(launch).toBeHidden();
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/#intro$/);

  await next.click();
  await next.click();
  await expect(page).toHaveURL(/#finish$/);
  await expect(next).toBeDisabled();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#finish$/);
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
