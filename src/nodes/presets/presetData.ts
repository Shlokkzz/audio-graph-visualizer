import {
  AudioNodeData,
} from "../nodeTypes"
// Use Presets
export function presetData (presetType:string,audioCtx:AudioContext): AudioNodeData[]{
  try{
   switch(presetType){
      case 'Biquad-Dynamic-Preset':
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
          case 'Gain-Biquad-Preset':
              return [
                  {
                      id: "1",
                      label: `Gain 1`,
                      type: "gain",
                      audioNode: audioCtx!.createGain(),
                      gain: 1.5,
                  },
                  {
                  id: "2",
                  label: `Biquad Filter 2`,
                  type: "biquadFilter",
                  audioNode: audioCtx!.createBiquadFilter(),
                  frequency: 3500,
                  Q: 1,
                  filterType: "lowpass",
                  },
          ];
      case 'Gain-Dynamic-Preset':
          return [
              {
                  id: "1",
                  label: `Gain 1`,
                  type: "gain",
                  audioNode: audioCtx!.createGain(),
                  gain: 1.5,
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
      case 'Biquad-Biquad-Preset':
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
                      label: `Biquad Filter 2`,
                      type: "biquadFilter",
                      audioNode: audioCtx!.createBiquadFilter(),
                      frequency: 3500,
                      Q: 1,
                      filterType: "lowpass",
                      },
          ];
      case 'Dynamic-Gain-Biquad-Preset':
          return [
              {
                  id: "1",
                label: `Dynamics Compressor 1`,
                type: "dynamicsCompressor",
                audioNode: audioCtx!.createDynamicsCompressor(),
                threshold: -24,
                knee: 20,
                attack: 0.4,
                release: 0.25,
                ratio: 12,
              },
              {
                  id: "2",
                  label: `Gain 2`,
                  type: "gain",
                  audioNode: audioCtx!.createGain(),
                  gain: 1.5,
              },
              {
              id: "3",
              label: `Biquad Filter 3`,
              type: "biquadFilter",
              audioNode: audioCtx!.createBiquadFilter(),
              frequency: 3500,
              Q: 1,
              filterType: "lowpass",
              },

          ];
      case '':
          return [

          ];
  }
} catch(e){
  console.log(e);
}
return []
}