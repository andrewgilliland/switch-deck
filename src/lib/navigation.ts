export interface ControllerIdentity {
  id: string;
  mapping: string;
  buttons: number;
  axes: number;
}

export function findSlideIndex(slugs: string[], hash: string): number {
  const slug = decodeURIComponent(hash.replace(/^#/, ""));
  const index = slugs.indexOf(slug);

  return index === -1 ? 0 : index;
}

export function moveSlide(
  currentIndex: number,
  delta: number,
  slideCount: number,
): number {
  return Math.min(
    Math.max(currentIndex + delta, 0),
    Math.max(slideCount - 1, 0),
  );
}

export function getNewlyPressedButtons(
  current: boolean[],
  previous: boolean[],
): number[] {
  return current.flatMap((pressed, index) =>
    pressed && !previous[index] ? [index] : [],
  );
}

export function controllerProfileKey(controller: ControllerIdentity): string {
  return [
    controller.id,
    controller.mapping || "raw",
    controller.buttons,
    controller.axes,
  ].join("::");
}
