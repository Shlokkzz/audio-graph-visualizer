import { AudioNodeData } from "../nodeTypes";
// Use Presets
export function presetData(
  presetType: string,
  audioCtx: AudioContext
): AudioNodeData[] {
  try {
    switch (presetType) {
      case "Preset-1":
        return [
          {
            id: "1",
            label: `Biquad Filter 1`,
            type: "biquadFilter",
            audioNode: audioCtx!.createBiquadFilter(),
            frequency: 3500,
            Q: 1,
            filterType: "lowpass",
          },
          {
            id: "2",
            label: `Dynamics Compressor 2`,
            type: "dynamicsCompressor",
            audioNode: audioCtx!.createDynamicsCompressor(),
            threshold: -24,
            knee: 20,
            attack: 0.4,
            release: 0.25,
            ratio: 12,
          },
        ];
      case "Preset-2":
        return [];
      case "Preset-3":
        return [];
      case "Preset-4":
        return [];
      case "Preset-5":
        return [];
      case "":
        return [];
    }
  } catch (e) {
    console.log(e);
  }
  return [];
}
