import { describe, expect, it } from "vitest";
import { resolveStimulus } from "@/lib/stimuli";
import { loadStimulusIndex } from "./helpers";

describe("stimuli resolution", () => {
  it("finds entries by motif and id", () => {
    const index = loadStimulusIndex();
    const first = index.stimuli[0]!;
    expect(resolveStimulus(first.motif, index)?.id).toBe(first.id);
    expect(resolveStimulus(first.id, index)?.motif).toBe(first.motif);
    expect(resolveStimulus("does-not-exist", index)).toBeNull();
  });
});
