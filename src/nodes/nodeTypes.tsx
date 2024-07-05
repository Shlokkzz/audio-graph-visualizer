import { Node } from "reactflow";
import {BiquadFilterNode2,BiquadFilterNodeProps} from "./BiquadFilterNode";
import {DynamicsCompressorNode2,DynamicsCompressorNodeProps} from "./DynamicsCompressorNode";
import {GainNode2,GainNodeProps} from "./GainNode";

export interface BaseNodeData {
  id: string;
  label: string;
}

export interface BiquadFilterNodeData extends BaseNodeData {
  type: "biquadFilter";
  audioNode: BiquadFilterNode;
  frequency: number;
  Q: number;
  filterType: BiquadFilterType;
}

export interface DynamicsCompressorNodeData extends BaseNodeData {
  type: "dynamicsCompressor";
  audioNode: DynamicsCompressorNode;
  threshold: number;
  knee: number;
  attack: number;
  release: number;
  ratio: number;
}

export interface GainNodeData extends BaseNodeData {
  type: "gain";
  audioNode: GainNode;
  gain: number;
}

export type AudioNodeData =
  | BiquadFilterNodeData
  | DynamicsCompressorNodeData
  | GainNodeData;

export interface CustomNode extends Node {
  data: AudioNodeData;
}

export const nodeTypes = {
  biquadFilter: BiquadFilterNode2,
  dynamicsCompressor: DynamicsCompressorNode2,
  gain: GainNode2,
};