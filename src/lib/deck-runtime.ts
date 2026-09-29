import {
  controllerProfileKey,
  findSlideIndex,
  getNewlyPressedButtons,
  moveSlide,
} from "./navigation";
import {
  advanceCalibration,
  beginCalibration as createCalibration,
  type CalibrationState,
  type ControllerButtonProfile,
} from "./controller-calibration";

const STANDARD_PROFILE: ControllerButtonProfile = {
  previous: [1, 4, 14],
  next: [0, 5, 15],
};
const PROFILE_PREFIX = "switch-deck:controller:";

export function initializeDeckShell(shell: HTMLElement): void {
  const slides = Array.from(
    shell.querySelectorAll<HTMLElement>("[data-slide]"),
  );
  const slugs = slides.map((slide) => slide.dataset.slug ?? "");
  const previousButton =
    shell.querySelector<HTMLButtonElement>("[data-previous]")!;
  const nextButton = shell.querySelector<HTMLButtonElement>("[data-next]")!;
  const position = shell.querySelector<HTMLOutputElement>("[data-position]")!;
  const endMarker = shell.querySelector<HTMLElement>("[data-end]")!;
  const launch = shell.querySelector<HTMLElement>("[data-launch]")!;
  const status = shell.querySelector<HTMLElement>("[data-status]")!;
  const controls = shell.querySelector<HTMLElement>("[data-controls]")!;
  const calibration = shell.querySelector<HTMLElement>("[data-calibration]")!;
  const calibrationPrompt = shell.querySelector<HTMLElement>(
    "[data-calibration-prompt]",
  )!;
  const controllerMenu = shell.querySelector<HTMLElement>(
    "[data-controller-menu]",
  )!;
  const releaseCaptureButton = shell.querySelector<HTMLButtonElement>(
    "[data-release-capture]",
  )!;
  const initialIndex = findSlideIndex(slugs, window.location.hash);
  let activeIndex = 0;
  let activeGamepadIndex: number | null = null;
  let activeProfile: ControllerButtonProfile | null = null;
  let calibrationState: CalibrationState | null = null;
  let inputCaptured = false;
  let controlsTimer = 0;
  let statusTimer = 0;
  const previousButtonStates = new Map<number, boolean[]>();
  const seenGamepadIndices = new Set<number>();

  function logGamepad(gamepad: Gamepad): void {
    if (seenGamepadIndices.has(gamepad.index)) return;
    seenGamepadIndices.add(gamepad.index);
    console.info("[Switch Deck] Gamepad detected", {
      index: gamepad.index,
      id: gamepad.id,
      mapping: gamepad.mapping,
      buttons: gamepad.buttons.length,
      axes: gamepad.axes.length,
    });
  }

  function showStatus(message: string, persistent = false): void {
    window.clearTimeout(statusTimer);
    status.textContent = message;
    status.hidden = false;
    if (!persistent) {
      statusTimer = window.setTimeout(() => {
        status.hidden = true;
      }, 2600);
    }
  }

  function showControls(): void {
    window.clearTimeout(controlsTimer);
    controls.dataset.visible = "true";
    controlsTimer = window.setTimeout(() => {
      if (!controls.matches(":focus-within") && controllerMenu.hidden) {
        delete controls.dataset.visible;
      }
    }, 2600);
  }

  function checkOverflow(slide: HTMLElement): void {
    if (shell.dataset.development !== "true") return;

    requestAnimationFrame(() => {
      if (
        slide.scrollWidth > slide.clientWidth ||
        slide.scrollHeight > slide.clientHeight
      ) {
        const slug = slide.dataset.slug ?? "unknown";
        slide.dataset.overflow = "true";
        showStatus(`Slide "${slug}" overflows the stage.`, true);
        console.warn(`[Switch Deck] Slide "${slug}" overflows the 16:9 stage.`);
      } else {
        delete slide.dataset.overflow;
      }
    });
  }

  function syncUrl(): void {
    const url = new URL(window.location.href);
    url.hash = slugs[activeIndex];
    window.history.replaceState(null, "", url);
  }

  function showSlide(nextIndex: number, updateUrl = true): void {
    const boundedIndex = moveSlide(
      activeIndex,
      nextIndex - activeIndex,
      slides.length,
    );
    const outgoing = slides[activeIndex];
    const incoming = slides[boundedIndex];

    if (outgoing !== incoming) {
      incoming.hidden = false;
      incoming.setAttribute("aria-hidden", "false");
      outgoing.classList.add("is-leaving");
      outgoing.classList.remove("is-active");
      requestAnimationFrame(() => incoming.classList.add("is-active"));
      window.setTimeout(() => {
        outgoing.hidden = true;
        outgoing.setAttribute("aria-hidden", "true");
        outgoing.classList.remove("is-leaving");
      }, 180);
    }

    activeIndex = boundedIndex;
    position.value = `${activeIndex + 1} / ${slides.length}`;
    previousButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === slides.length - 1;
    endMarker.hidden = activeIndex !== slides.length - 1;
    if (updateUrl) syncUrl();
    checkOverflow(incoming);
    showControls();
  }

  function move(delta: number): void {
    showSlide(moveSlide(activeIndex, delta, slides.length));
  }

  function isEditableTarget(target: EventTarget | null): boolean {
    return (
      target instanceof Element &&
      Boolean(
        target.closest(
          'input, textarea, select, button, a, [contenteditable="true"]',
        ),
      )
    );
  }

  function identityFor(gamepad: Gamepad) {
    return {
      id: gamepad.id,
      mapping: gamepad.mapping,
      buttons: gamepad.buttons.length,
      axes: gamepad.axes.length,
    };
  }

  function loadProfile(gamepad: Gamepad): ControllerButtonProfile | null {
    if (gamepad.mapping === "standard") return STANDARD_PROFILE;

    try {
      const stored = localStorage.getItem(
        PROFILE_PREFIX + controllerProfileKey(identityFor(gamepad)),
      );
      if (!stored) return null;
      const profile = JSON.parse(stored) as ControllerButtonProfile;
      return Array.isArray(profile.previous) && Array.isArray(profile.next)
        ? profile
        : null;
    } catch {
      return null;
    }
  }

  function saveProfile(
    gamepad: Gamepad,
    profile: ControllerButtonProfile,
  ): void {
    try {
      localStorage.setItem(
        PROFILE_PREFIX + controllerProfileKey(identityFor(gamepad)),
        JSON.stringify(profile),
      );
    } catch {
      showStatus("Controller mapping works for this session only.");
    }
  }

  function beginCalibration(gamepad: Gamepad): void {
    activeGamepadIndex = gamepad.index;
    activeProfile = null;
    calibrationState = createCalibration();
    calibration.hidden = false;
    calibrationPrompt.textContent = "Release all buttons";
  }

  function processCalibration(
    gamepad: Gamepad,
    pressed: boolean[],
    newlyPressed: number[],
  ): boolean {
    if (!calibrationState) return false;
    const step = advanceCalibration(calibrationState, pressed, newlyPressed);
    if (!step.handled) return false;

    calibrationState = step.state;
    calibrationPrompt.textContent = step.prompt;
    if (step.profile) {
      saveProfile(gamepad, step.profile);
      activeProfile = step.profile;
      calibrationState = null;
      calibration.hidden = true;
      showStatus(`${gamepad.id} configured`);
    }

    return true;
  }

  function releaseInputCapture(): void {
    inputCaptured = false;
    releaseCaptureButton.hidden = true;
    delete shell.dataset.inputCaptured;
    showStatus("Deck controls restored");
  }

  window.switchDeck = {
    captureInput(label = "Interactive Slide") {
      inputCaptured = true;
      shell.dataset.inputCaptured = "true";
      releaseCaptureButton.hidden = false;
      showStatus(`${label} has controller input`, true);
    },
    releaseInput: releaseInputCapture,
    get isCaptured() {
      return inputCaptured;
    },
  };

  function pollGamepads(): void {
    const gamepads = navigator.getGamepads?.() ?? [];

    for (const gamepad of gamepads) {
      if (!gamepad) continue;
      logGamepad(gamepad);
      const pressed = gamepad.buttons.map(
        (button) => button.pressed || button.value >= 0.5,
      );
      const previous =
        previousButtonStates.get(gamepad.index) ?? pressed.map(() => false);
      const newlyPressed = getNewlyPressedButtons(pressed, previous);
      previousButtonStates.set(gamepad.index, pressed);
      const newlyReleased = previous.flatMap((wasPressed, index) =>
        wasPressed && !pressed[index] ? [index] : [],
      );
      if (newlyPressed.length > 0) {
        console.log(
          `[Switch Deck] ${gamepad.id} pressed buttons`,
          newlyPressed,
        );
      }
      if (newlyReleased.length > 0) {
        console.log(
          `[Switch Deck] ${gamepad.id} released buttons`,
          newlyReleased,
        );
      }

      if (activeGamepadIndex === null && newlyPressed.length > 0) {
        activeGamepadIndex = gamepad.index;
        activeProfile = loadProfile(gamepad);
        showStatus(`${gamepad.id} active`);
        if (!activeProfile) beginCalibration(gamepad);
        continue;
      }

      if (gamepad.index !== activeGamepadIndex) continue;
      if (processCalibration(gamepad, pressed, newlyPressed)) continue;
      if (newlyPressed.length === 0 || !activeProfile) continue;

      if (inputCaptured) {
        window.dispatchEvent(
          new CustomEvent("switchdeck:controllerinput", {
            detail: { gamepad, buttons: newlyPressed },
          }),
        );
      } else if (
        newlyPressed.some((index) => activeProfile!.next.includes(index))
      ) {
        move(1);
      } else if (
        newlyPressed.some((index) => activeProfile!.previous.includes(index))
      ) {
        move(-1);
      }
    }

    requestAnimationFrame(pollGamepads);
  }

  previousButton.addEventListener("click", () => move(-1));
  nextButton.addEventListener("click", () => move(1));
  releaseCaptureButton.addEventListener("click", releaseInputCapture);
  shell.querySelector("[data-start]")?.addEventListener("click", async () => {
    launch.hidden = true;
    try {
      await shell.requestFullscreen?.();
    } catch {
      showStatus("Fullscreen unavailable");
    }
    showControls();
  });

  shell
    .querySelector("[data-controller-menu-button]")
    ?.addEventListener("click", () => {
      controllerMenu.hidden = !controllerMenu.hidden;
      showControls();
    });
  shell
    .querySelector("[data-select-controller]")
    ?.addEventListener("click", () => {
      activeGamepadIndex = null;
      activeProfile = null;
      calibrationState = null;
      calibration.hidden = true;
      controllerMenu.hidden = true;
      showStatus("Waiting for controller input", true);
    });
  shell
    .querySelector("[data-reconfigure-controller]")
    ?.addEventListener("click", () => {
      const gamepad =
        activeGamepadIndex === null
          ? null
          : navigator.getGamepads()[activeGamepadIndex];
      controllerMenu.hidden = true;
      if (!gamepad) {
        showStatus("No active controller");
        return;
      }
      try {
        localStorage.removeItem(
          PROFILE_PREFIX + controllerProfileKey(identityFor(gamepad)),
        );
      } catch {
        // Reconfiguration still works for the current session.
      }
      beginCalibration(gamepad);
    });
  shell
    .querySelector("[data-cancel-calibration]")
    ?.addEventListener("click", () => {
      calibrationState = null;
      calibration.hidden = true;
      activeGamepadIndex = null;
      activeProfile = null;
      showStatus("Controller setup cancelled");
    });

  window.addEventListener("keydown", (event) => {
    showControls();
    if (event.key === "Escape" && inputCaptured) {
      event.preventDefault();
      releaseInputCapture();
      return;
    }
    if (isEditableTarget(event.target)) return;

    if (event.key === "ArrowRight" || event.key === " ") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
  });
  window.addEventListener("hashchange", () =>
    showSlide(findSlideIndex(slugs, window.location.hash), false),
  );
  window.addEventListener("gamepadconnected", (event) => {
    logGamepad(event.gamepad);
    showStatus(`${event.gamepad.id} connected`);
  });
  window.addEventListener("gamepaddisconnected", (event) => {
    console.info("[Switch Deck] Gamepad disconnected", {
      index: event.gamepad.index,
      id: event.gamepad.id,
    });
    seenGamepadIndices.delete(event.gamepad.index);
    previousButtonStates.delete(event.gamepad.index);
    if (activeGamepadIndex === event.gamepad.index) {
      activeGamepadIndex = null;
      activeProfile = null;
      calibrationState = null;
      calibration.hidden = true;
      showStatus(`${event.gamepad.id} disconnected`);
    }
  });
  window.addEventListener("pointermove", showControls, { passive: true });
  window.addEventListener("resize", () => checkOverflow(slides[activeIndex]));

  console.info("[Switch Deck] Gamepad diagnostics ready", {
    gamepadAPI: typeof navigator.getGamepads === "function",
    connected: Array.from(navigator.getGamepads?.() ?? []).filter(Boolean)
      .length,
  });
  showSlide(initialIndex);
  requestAnimationFrame(pollGamepads);
}
