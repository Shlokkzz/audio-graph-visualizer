import { useState } from "react";

import ReactFlow, {
    useNodesState,
    useEdgesState,
    Node,
  } from "reactflow";

//types
import {
    AudioNodeData,
    CustomNode,
  } from "../nodes/nodeTypes"

  // AUDIO ROUTING GRAPH FUNCTIONS
export const useAudioGraph = () => {

  //Audio routing graph
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null);

  const handleAddNode = (
      nodeType: "biquadFilter" | "dynamicsCompressor" | "gain",
      audioCtx:AudioContext,
      source:MediaStreamAudioSourceNode,
      analyser:AnalyserNode
    ) => {
      const newNodeId = (nodes.length + 1).toString();
      let newNodeData: AudioNodeData;

      switch (nodeType) {
        case "biquadFilter":
          newNodeData = {
            id: newNodeId,
            label: `Biquad Filter ${newNodeId}`,
            type: "biquadFilter",
            audioNode: audioCtx!.createBiquadFilter(),
            frequency: 350,
            Q: 1,
            filterType: "lowpass",
          };
          break;
        case "dynamicsCompressor":
          newNodeData = {
            id: newNodeId,
            label: `Dynamics Compressor ${newNodeId}`,
            type: "dynamicsCompressor",
            audioNode: audioCtx!.createDynamicsCompressor(),
            threshold: -24,
            knee: 30,
            attack: 0.03,
            release: 0.25,
            ratio: 12,
          };
          break;
        case "gain":
          newNodeData = {
            id: newNodeId,
            label: `Gain ${newNodeId}`,
            type: "gain",
            audioNode: audioCtx!.createGain(),
            gain: 1,
          };
          break;
      }

    const newNode: CustomNode = {
      id: newNodeId,
      type: "default",
      data: newNodeData,
      position:
        nodes.length == 0
          ? { x: 250, y: 50 }
          : {
              x: nodes[nodes.length - 1].position.x + 20,
              y: nodes[nodes.length - 1].position.y + 20,
            }, // Adjust the position as needed
      style: {
        backgroundColor:
          nodeType === "dynamicsCompressor"
            ? "#f4e2d8"
            : nodeType === "gain"
            ? "#ddd6f3"
            : "ffedbc",
      },
    };

    setNodes((nds) => [...nds, newNode]);
    handleChanges(audioCtx,source,analyser);
  };

  const handleChanges = (audioCtx:AudioContext,source:MediaStreamAudioSourceNode,analyser:AnalyserNode) => {
    if (!audioCtx || !source || !analyser) return;
    const updatedEdges = [];
    if (nodes.length == 0) {
      source!.disconnect();
      source!.connect(analyser!);
      analyser!.connect(audioCtx!.destination);
    } else {
      const previousNodeId = nodes[0].id;
      source!.disconnect();
      source?.connect(nodes[0].data.audioNode);
      for (let i = 1; i < nodes.length; i++) {
        // edge naming id
        updatedEdges.push({
          id: `e${nodes[i - 1].id}-${nodes[i].id}`,
          source: nodes[i - 1].id,
          target: nodes[i].id,
          animated: true,
          style: { stroke: "#fff" },
        });
        nodes[i - 1].data.audioNode.connect(nodes[i].data.audioNode);
      }
      nodes[nodes.length - 1].data.audioNode.connect(analyser!);
      analyser!.connect(audioCtx!.destination);
    }
    setEdges(updatedEdges);
    console.log(nodes)
  };

  const handleReset = (audioCtx:AudioContext,source:MediaStreamAudioSourceNode,analyser:AnalyserNode) => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    handleChanges(audioCtx,source,analyser);
    // Optionally disconnect all audio nodes from the audio context
    // Implement as needed based on your audio node handling
    // removes filter
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    console.log(node);
    setSelectedNode(node);
  };

  return { nodes,setNodes, edges,setEdges, selectedNode, handleAddNode,handleReset,handleNodeClick,handleChanges,onNodesChange,onEdgesChange };
};
