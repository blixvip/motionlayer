import { describe, expect, it } from "vitest";
import { creatorStyleLibrary } from "../lib/creator-styles";

describe("creator style library", () => {
  it("loads Nick Puru as a source-backed MotionLayer creator skill", () => {
    expect(creatorStyleLibrary.creators).toHaveLength(5);

    const creator = creatorStyleLibrary.creators.find((item) => item.id === "nick-puru");
    expect(creator).toBeDefined();
    if (!creator) throw new Error("Nick Puru creator profile was not loaded.");
    expect(creator.id).toBe("nick-puru");
    expect(creator.channelHandle).toBe("@NicholasPuru");
    expect(creator.channelUrl).toBe("https://www.youtube.com/@NicholasPuru");
    expect(creator.sources).toHaveLength(23);
    expect(new Set(creator.sources.map((source) => source.id)).size).toBe(23);
    expect(new Set(creator.sources.map((source) => source.url)).size).toBe(23);
    expect(creator.prompts.map((prompt) => prompt.id)).toContain("motion-plan");
    expect(creator.skill.content).toContain("MOTIONLAYER DIRECTION");
    expect(creator.skill.content).toContain("Do not copy");
  });

  it("loads Nick Automates with the complete supplied source corpus", () => {
    const creator = creatorStyleLibrary.creators.find((item) => item.id === "nick-automates");
    expect(creator).toBeDefined();
    if (!creator) throw new Error("Nick Automates creator profile was not loaded.");

    expect(creator.channelHandle).toBe("@nickautomates");
    expect(creator.channelUrl).toBe("https://www.youtube.com/@nickautomates");
    expect(creator.sources).toHaveLength(32);
    expect(new Set(creator.sources.map((source) => source.id)).size).toBe(32);
    expect(new Set(creator.sources.map((source) => source.url)).size).toBe(32);
    expect(creator.sources[0].id).toBe("vyrVH8S9JVE");
    expect(creator.prompts.map((prompt) => prompt.id)).toContain("verification-pass");
    expect(creator.skill.content).toContain("MOTIONLAYER DIRECTION");
    expect(creator.skill.content).toContain("verification checklist");
  });

  it("loads Austin Marchese with the complete supplied source corpus", () => {
    const creator = creatorStyleLibrary.creators.find((item) => item.id === "austin-marchese");
    expect(creator).toBeDefined();
    if (!creator) throw new Error("Austin Marchese creator profile was not loaded.");

    expect(creator.channelHandle).toBe("@austin.marchese");
    expect(creator.channelUrl).toBe("https://www.youtube.com/@austin.marchese");
    expect(creator.sources).toHaveLength(18);
    expect(new Set(creator.sources.map((source) => source.id)).size).toBe(18);
    expect(new Set(creator.sources.map((source) => source.url)).size).toBe(18);
    expect(creator.sources[0].id).toBe("7rRVwjzVQsc");
    expect(creator.prompts.map((prompt) => prompt.id)).toContain("framework-map");
    expect(creator.prompts.map((prompt) => prompt.id)).toContain("verification-pass");
    expect(creator.skill.content).toContain("MOTIONLAYER DIRECTION");
    expect(creator.skill.content).toContain("human validation zones");
  });

  it("loads Dubibubi with the complete supplied source corpus", () => {
    const creator = creatorStyleLibrary.creators.find((item) => item.id === "dubibubi");
    expect(creator).toBeDefined();
    if (!creator) throw new Error("Dubibubi creator profile was not loaded.");

    expect(creator.channelHandle).toBe("@Dubibubiii");
    expect(creator.channelUrl).toBe("https://www.youtube.com/@Dubibubiii");
    expect(creator.sources).toHaveLength(14);
    expect(new Set(creator.sources.map((source) => source.id)).size).toBe(14);
    expect(new Set(creator.sources.map((source) => source.url)).size).toBe(14);
    expect(creator.sources[0].id).toBe("9M8pYsnDFes");
    expect(creator.prompts.map((prompt) => prompt.id)).toContain("experiment-protocol");
    expect(creator.prompts.map((prompt) => prompt.id)).toContain("claims-audit");
    expect(creator.skill.content).toContain("MOTIONLAYER DIRECTION");
    expect(creator.skill.content).toContain("multi-axis comparison");
  });

  it("loads InsiderForce with a copyable script archive", () => {
    const creator = creatorStyleLibrary.creators.find((item) => item.id === "insider-force");
    expect(creator).toBeDefined();
    if (!creator) throw new Error("InsiderForce creator profile was not loaded.");

    expect(creator.channelHandle).toBe("@InsiderForce");
    expect(creator.sources).toHaveLength(16);
    expect(new Set(creator.sources.map((source) => source.id)).size).toBe(16);
    expect(creator.prompts.map((prompt) => prompt.id)).toContain("claims-audit");
    expect(creator.skill.content).toContain("MOTIONLAYER DIRECTION");
  });
});
