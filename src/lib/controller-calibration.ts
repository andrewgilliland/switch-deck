export type CalibrationPhase =
  "wait-previous-release" | "previous" | "wait-next-release" | "next" | null;

export interface CalibrationState {
  phase: CalibrationPhase;
  previousButton: number | null;
  needsDifferentButton: boolean;
}

export interface ControllerButtonProfile {
  previous: number[];
  next: number[];
}

export interface CalibrationStep {
  handled: boolean;
  state: CalibrationState;
  prompt: string;
  profile?: ControllerButtonProfile;
}

export function beginCalibration(): CalibrationState {
  return {
    phase: "wait-previous-release",
    previousButton: null,
    needsDifferentButton: false,
  };
}

export function advanceCalibration(
  state: CalibrationState,
  pressed: boolean[],
  newlyPressed: number[],
): CalibrationStep {
  if (state.phase === null) {
    return { handled: false, state, prompt: "" };
  }

  const anyPressed = pressed.some(Boolean);
  let nextState = state;
  let prompt =
    state.phase === "previous"
      ? "Press Previous"
      : state.phase === "next"
        ? state.needsDifferentButton
          ? "Press a different button for Next"
          : "Press Next"
        : "Release all buttons";
  let profile: ControllerButtonProfile | undefined;

  if (state.phase === "wait-previous-release" && !anyPressed) {
    nextState = { ...state, phase: "previous" };
    prompt = "Press Previous";
  } else if (state.phase === "previous" && newlyPressed.length > 0) {
    nextState = {
      ...state,
      phase: "wait-next-release",
      previousButton: newlyPressed[0],
    };
    prompt = "Release all buttons";
  } else if (state.phase === "wait-next-release" && !anyPressed) {
    nextState = { ...state, phase: "next" };
    prompt = state.needsDifferentButton
      ? "Press a different button for Next"
      : "Press Next";
  } else if (state.phase === "next" && newlyPressed.length > 0) {
    const nextButton = newlyPressed[0];
    if (nextButton === state.previousButton) {
      nextState = {
        ...state,
        phase: "wait-next-release",
        needsDifferentButton: true,
      };
      prompt = "Release all buttons";
    } else {
      nextState = { ...state, phase: null };
      profile = { previous: [state.previousButton!], next: [nextButton] };
      prompt = "Controller configured";
    }
  }

  return { handled: true, state: nextState, prompt, profile };
}
