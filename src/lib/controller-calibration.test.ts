import { describe, expect, it } from "vitest";
import { advanceCalibration, beginCalibration } from "./controller-calibration";

describe("Controller Profile calibration", () => {
  it("waits for all buttons to be released before asking for Previous", () => {
    const started = beginCalibration();
    const whileHeld = advanceCalibration(started, [true], []);

    expect(whileHeld.prompt).toBe("Release all buttons");
    expect(whileHeld.state.phase).toBe("wait-previous-release");

    const released = advanceCalibration(whileHeld.state, [false], []);
    expect(released.prompt).toBe("Press Previous");
    expect(released.state.phase).toBe("previous");

    const waiting = advanceCalibration(released.state, [false], []);
    expect(waiting.prompt).toBe("Press Previous");
  });

  it("requires distinct Previous and Next buttons and returns their profile", () => {
    let step = advanceCalibration(beginCalibration(), [false], []);
    step = advanceCalibration(step.state, [false, false], [2]);
    expect(step.prompt).toBe("Release all buttons");
    step = advanceCalibration(step.state, [false, false], []);
    expect(step.prompt).toBe("Press Next");

    step = advanceCalibration(step.state, [false, false], [2]);
    expect(step.profile).toBeUndefined();
    expect(step.prompt).toBe("Release all buttons");
    step = advanceCalibration(step.state, [false, false], []);
    expect(step.prompt).toBe("Press a different button for Next");

    step = advanceCalibration(step.state, [false, false], [5]);
    expect(step.profile).toEqual({ previous: [2], next: [5] });
    expect(step.state.phase).toBeNull();
  });
});
