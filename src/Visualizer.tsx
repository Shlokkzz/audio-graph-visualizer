import React, { useRef, useEffect, useState, useCallback } from "react";
import { Chart, registerables } from "chart.js";
import ReactFlow, {
  addEdge,
  Controls,
} from "reactflow";
// import "reactflow/dist/style.css";
import {
  BiquadFilterNodeData,
  DynamicsCompressorNodeData,
  GainNodeData,
  nodeTypes
} from "./nodes/nodeTypes"

import { useAudioGraph } from "./hooks/useAudioGraph";
import { useVisualization } from "./hooks/useVisualization";
import { useInit } from "./hooks/useInit";

Chart.register(...registerables);

const Visualizer: React.FC = () => {

  const canvasRefSnapshot = useRef<HTMLCanvasElement | null>(null);
  const canvasRefOriginalSnapshot = useRef<HTMLCanvasElement | null>(null);

  const [visualizationType, setVisualizationType] = useState<
    "sinewave" | "frequencybars"
  >("sinewave");

  const [selectedValue, setSelectedValue] = useState<string>('self-configure');

  const {audioCtx,source,analyser,analyserOriginal}=useInit();

  // AUDIO GRAPH
  const {
    nodes,
    setNodes,
    edges,
    setEdges, 
    selectedNode, 
    handleAddNode,
    handleReset,
    handleNodeClick,
    handleChanges,
    onNodesChange,
    onEdgesChange,
    handlePreset
  } = useAudioGraph();

  const onConnect = useCallback(
    (params: any) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { stroke: "#fff" } }, eds)
      ),
    []
  );

  // DISPLAY
   const {canvasRef} = useVisualization(visualizationType,analyser!);
   const { canvasRef:canvasRefOriginal } = useVisualization(visualizationType,analyserOriginal!);

   // SNAPSHOT
  const handleSnapshot = () => {
    console.log("CLICKED");
    const originalCanvas = canvasRefOriginal.current;
    const mixedCanvas = canvasRef.current;
    const snapshotOriginalCanvas = canvasRefOriginalSnapshot.current;
    const snapshotMixedCanvas = canvasRefSnapshot.current;

    if (
      originalCanvas &&
      mixedCanvas &&
      snapshotOriginalCanvas &&
      snapshotMixedCanvas
    ) {
      const ctxOriginal = originalCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      const ctxMixed = mixedCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      const ctxSnapshotOriginal = snapshotOriginalCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      const ctxSnapshotMixed = snapshotMixedCanvas.getContext("2d", {
        willReadFrequently: true,
      });

      // Get the image data from both original canvases
      const originalImageData = ctxOriginal!.getImageData(
        0,
        0,
        originalCanvas.width,
        originalCanvas.height
      );
      const mixedImageData = ctxMixed!.getImageData(
        0,
        0,
        mixedCanvas.width,
        mixedCanvas.height
      );

      // Set the size of snapshot canvases to match original canvases if they are different
      snapshotOriginalCanvas.width = originalCanvas.width;
      snapshotOriginalCanvas.height = originalCanvas.height;
      snapshotMixedCanvas.width = mixedCanvas.width;
      snapshotMixedCanvas.height = mixedCanvas.height;

      ctxSnapshotOriginal!.putImageData(originalImageData, 0, 0);
      ctxSnapshotMixed!.putImageData(mixedImageData, 0, 0);
    }
  };

  const handleVisualizationChange = (type: "sinewave" | "frequencybars") => {
    setVisualizationType(type);
  };

  // PRESETS
  const handlePresetChange = (event:React.ChangeEvent<HTMLSelectElement>): void=>{
    setSelectedValue(event.target.value);
    handlePreset(event,audioCtx!,source!,analyser!);
  }

  // CSS for active filter button
  const buttonStyle = (isActive: boolean) => ({
    backgroundColor: isActive ? "#28a745" : "#007BFF",
    color: "white",
    border: "none",
    padding: "10px 20px",
    marginRight: "10px",
    cursor: "pointer",
    borderRadius: "4px",
    outline: "none",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
  });

  const filterButton = (isActive: boolean) => ({
    backgroundColor: isActive ? "red" : "#28a745",
    color: "white",
    border: "none",
    padding: "10px 20px",
    marginRight: "10px",
    cursor: "pointer",
    borderRadius: "4px",
    outline: "none",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
  });
  
  // JSX for filter buttons
  return (
    <div>
      <div
        style={{
          marginTop: "20px",
          textAlign: "center",
          paddingBottom: "100px",
        }}
      >
        <br />
        <p
          style={{
            fontWeight: "bold",
            marginBottom: "5px",
            fontSize: "30px",
          }}
        >
          AUDIO ROUTING GRAPH
        </p>
        <div
          style={{
            height: "80vh",
            padding: "5px",
            width: "90%",
            marginLeft: "70px",
            display: "flex",
          }}
        >
          <div
            style={{
              marginTop: "10%",
              padding: "10px",
              background: "white",
              borderBottom: "1px solid #ddd",
            }}
          >
            <button
              onClick={() => handleAddNode("biquadFilter",audioCtx!,source!,analyser!)}
              style={buttonStyle(false)}
            >
              Add BiquadFilterNode
            </button>
            <br /> <br />
            <button
              onClick={() => handleAddNode("dynamicsCompressor",audioCtx!,source!,analyser!)}
              style={buttonStyle(false)}
            >
              Add DynamicsCompressorNode
            </button>
            <br /> <br />
            <button
              onClick={() => handleAddNode("gain",audioCtx!,source!,analyser!)}
              style={buttonStyle(false)}
            >
              Add Gain Node
            </button>
            <br />
            <br />
            <button onClick={()=>handleReset(audioCtx!,source!,analyser!)} style={filterButton(true)}>
              RESET
            </button>
            <button onClick={()=>handleChanges(audioCtx!,source!,analyser!)} style={buttonStyle(true)}>
              {" "}
              OK{" "}
            </button>
            <br /> <br />
            {selectedNode && selectedNode.data.type === "biquadFilter" && (
              <div>
                <p
                  style={{
                    fontWeight: "bold",
                    marginBottom: "5px",
                    fontSize: "18px",
                  }}
                >
                  {" "}
                  {selectedNode.data.label}{" "}
                </p>
                <label htmlFor="">Freq: </label>
                <input
                  type="range"
                  min="20"
                  max="20000"
                  step="1"
                  value={(selectedNode.data as BiquadFilterNodeData).frequency}
                  onChange={(event) => {
                    const value = parseFloat(event.target.value);
                    (selectedNode.data as BiquadFilterNodeData).frequency =
                      value;
                    const node = (selectedNode.data as BiquadFilterNodeData)
                      .audioNode;
                    node.frequency.setValueAtTime(value, audioCtx!.currentTime);
                    handleChanges(audioCtx!,source!,analyser!); // Update your audio context
                  }}
                  style={{ backgroundColor: "white" }}
                />
                {(selectedNode.data as BiquadFilterNodeData).frequency}
                <br />
                <label htmlFor="">Q: </label>
                <input
                  type="range"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={(selectedNode.data as BiquadFilterNodeData).Q}
                  onChange={(event) => {
                    const value = parseFloat(event.target.value);
                    (selectedNode.data as BiquadFilterNodeData).Q = value;
                    const node = (selectedNode.data as BiquadFilterNodeData)
                      .audioNode;
                    node.Q.setValueAtTime(value, audioCtx!.currentTime);
                    handleChanges(audioCtx!,source!,analyser!); // Update your audio context
                  }}
                  style={{ backgroundColor: "white" }}
                />
                {(selectedNode.data as BiquadFilterNodeData).Q}
                <br />
                <select
                  value={(selectedNode.data as BiquadFilterNodeData).filterType}
                  onChange={(event) => {
                    const value = event.target.value as BiquadFilterType;
                    (selectedNode.data as BiquadFilterNodeData).filterType =
                      value;
                    const node = (selectedNode.data as BiquadFilterNodeData)
                      .audioNode;
                    node.type = value;
                    handleChanges(audioCtx!,source!,analyser!); // Update your audio context
                  }}
                  style={{ backgroundColor: "white" }}
                >
                  <option value="lowpass">Lowpass</option>
                  <option value="highpass">Highpass</option>
                  <option value="bandpass">Bandpass</option>
                  <option value="lowshelf">Lowshelf</option>
                  <option value="highshelf">Highshelf</option>
                  <option value="peaking">Peaking</option>
                  <option value="notch">Notch</option>
                  <option value="allpass">Allpass</option>
                </select>
              </div>
            )}
            {selectedNode &&
              selectedNode.data.type === "dynamicsCompressor" && (
                <div>
                  <p
                    style={{
                      fontWeight: "bold",
                      marginBottom: "5px",
                      fontSize: "18px",
                    }}
                  >
                    {" "}
                    {selectedNode.data.label}{" "}
                  </p>
                  <label htmlFor="">Threshold: </label>
                  <input
                    type="range"
                    min="-100"
                    max="0"
                    step="0.1"
                    value={
                      (selectedNode.data as DynamicsCompressorNodeData)
                        .threshold
                    }
                    onChange={(event) => {
                      const value = parseFloat(event.target.value);
                      (
                        selectedNode.data as DynamicsCompressorNodeData
                      ).threshold = value;
                      const node = (
                        selectedNode.data as DynamicsCompressorNodeData
                      ).audioNode;
                      node.threshold.setValueAtTime(
                        value,
                        audioCtx!.currentTime
                      );
                      handleChanges(audioCtx!,source!,analyser!); // Update your audio context
                    }}
                    style={{ backgroundColor: "white" }}
                  />
                  {(selectedNode.data as DynamicsCompressorNodeData).threshold}
                  <br />
                  <label htmlFor="">Knee: </label>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="0.1"
                    value={
                      (selectedNode.data as DynamicsCompressorNodeData).knee
                    }
                    onChange={(event) => {
                      const value = parseFloat(event.target.value);
                      (selectedNode.data as DynamicsCompressorNodeData).knee =
                        value;
                      const node = (
                        selectedNode.data as DynamicsCompressorNodeData
                      ).audioNode;
                      node.knee.setValueAtTime(value, audioCtx!.currentTime);
                      handleChanges(audioCtx!,source!,analyser!); // Update your audio context
                    }}
                    style={{ backgroundColor: "white" }}
                  />
                  {(selectedNode.data as DynamicsCompressorNodeData).knee}
                  <br />
                  <label htmlFor="">Attack: </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={
                      (selectedNode.data as DynamicsCompressorNodeData).attack
                    }
                    onChange={(event) => {
                      const value = parseFloat(event.target.value);
                      (selectedNode.data as DynamicsCompressorNodeData).attack =
                        value;
                      const node = (
                        selectedNode.data as DynamicsCompressorNodeData
                      ).audioNode;
                      node.attack.setValueAtTime(value, audioCtx!.currentTime);
                      handleChanges(audioCtx!,source!,analyser!); // Update your audio context
                    }}
                    style={{ backgroundColor: "white" }}
                  />
                  {(selectedNode.data as DynamicsCompressorNodeData).attack}
                  <br />
                  <label>Release: </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={
                      (selectedNode.data as DynamicsCompressorNodeData).release
                    }
                    onChange={(event) => {
                      const value = parseFloat(event.target.value);
                      (
                        selectedNode.data as DynamicsCompressorNodeData
                      ).release = value;
                      const node = (
                        selectedNode.data as DynamicsCompressorNodeData
                      ).audioNode;
                      node.release.setValueAtTime(value, audioCtx!.currentTime);
                      handleChanges(audioCtx!,source!,analyser!); // Update your audio context
                    }}
                    style={{ backgroundColor: "white" }}
                  />
                  {(selectedNode.data as DynamicsCompressorNodeData).release}
                  <br />
                  <label>Ratio: </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.1"
                    value={
                      (selectedNode.data as DynamicsCompressorNodeData).ratio
                    }
                    onChange={(event) => {
                      const value = parseFloat(event.target.value);
                      (selectedNode.data as DynamicsCompressorNodeData).ratio =
                        value;
                      const node = (
                        selectedNode.data as DynamicsCompressorNodeData
                      ).audioNode;
                      node.ratio.setValueAtTime(value, audioCtx!.currentTime);
                      handleChanges(audioCtx!,source!,analyser!); // Update your audio context
                    }}
                    style={{ backgroundColor: "white" }}
                  />
                  {(selectedNode.data as DynamicsCompressorNodeData).ratio}
                </div>
              )}
            {selectedNode && selectedNode.data.type === "gain" && (
              <div>
                <p
                  style={{
                    fontWeight: "bold",
                    marginBottom: "5px",
                    fontSize: "18px",
                  }}
                >
                  {" "}
                  {selectedNode.data.label}{" "}
                </p>
                <label>Gain: </label>
                <br />
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.01"
                  value={(selectedNode.data as GainNodeData).gain}
                  onChange={(event) => {
                    const value = parseFloat(event.target.value);
                    (selectedNode.data as GainNodeData).gain = value;
                    const node = (selectedNode.data as GainNodeData).audioNode;
                    node.gain.setValueAtTime(value, audioCtx!.currentTime);
                    handleChanges(audioCtx!,source!,analyser!); // Update your audio context
                  }}
                  style={{ backgroundColor: "white" }}
                />
                {(selectedNode.data as GainNodeData).gain}
              </div>
            )}
          </div>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            style={{ background: "#43cea2 " }}
            fitView
            attributionPosition="bottom-left"
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
          >
            <Controls />
          </ReactFlow>

          {/* ADD MORE  */}

          <div
            style={{
              marginTop: "10%",
              padding: "10px",
              background: "white",
              borderBottom: "1px solid #ddd",
            }}
          >
            <label
              style={{
                fontWeight: "bold",
                marginBottom: "5px",
                fontSize: "18px",
              }}
            >
              CHOOSE PRESET:{" "}
            </label>
            <br />
            <br />
            <select style={filterButton(false)}  onChange={handlePresetChange} value= {selectedValue}>
              <option value="Preset-1">Preset-1</option>
              <option value="Preset-2">Preset-2</option>
              <option value="Preset-3">Preset-3</option>
              <option value="Preset-4">Preset-4</option>
              <option value="Preset-5">Preset-5</option>
              <option value="self-configure">self-configure</option>
            </select>
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "center", margin: "10px", marginTop: "30px" }}>
          <p
            style={{
              fontWeight: "bold",
              marginBottom: "5px",
              fontSize: "18px",
            }}
          >
            Original Audio
          </p>
          <canvas
            ref={canvasRefOriginal}
            style={{
              maxWidth: "100%",
              // border: "1px solid black",
              padding: "10px",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ textAlign: "center", margin: "10px", marginTop: "30px" }}>
          <p
            style={{
              fontWeight: "bold",
              marginBottom: "5px",
              fontSize: "18px",
            }}
          >
            Processed Audio
          </p>
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: "100%",
              // border: "1px solid black",
              padding: "10px",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p
          style={{
            fontWeight: "bold",
            marginBottom: "5px",
            fontSize: "30px",
          }}
        >
          SNAPSHOTS
        </p>
      </div>
      <br />
      <br />

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <br />
        <br />
        <button
          onClick={() => handleVisualizationChange("sinewave")}
          style={buttonStyle(visualizationType === "sinewave")}
        >
          Sine-wave
        </button>
        <button
          onClick={() => handleVisualizationChange("frequencybars")}
          style={buttonStyle(visualizationType === "frequencybars")}
        >
          Frequency-bar
        </button>
      </div>
      <br />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <button
          style={{
            backgroundColor: "orange",
            color: "white",
            border: "none",
            padding: "10px 20px",
            marginRight: "10px",
            cursor: "pointer",
            borderRadius: "4px",
            outline: "none",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
          }}
          onClick={() => handleSnapshot()}
        >
          Snapshot
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "center", margin: "10px", marginTop: "30px" }}>
          <p
            style={{
              fontWeight: "bold",
              marginBottom: "5px",
              fontSize: "18px",
            }}
          >
            Original Audio
          </p>
          <canvas
            ref={canvasRefOriginalSnapshot}
            style={{
              maxWidth: "100%",
              // border: "1px solid black",
              padding: "10px",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ textAlign: "center", margin: "10px", marginTop: "30px" }}>
          <p
            style={{
              fontWeight: "bold",
              marginBottom: "5px",
              fontSize: "18px",
            }}
          >
            Processed Audio
          </p>
          <canvas
            ref={canvasRefSnapshot}
            style={{
              maxWidth: "100%",
              // border: "1px solid black",
              padding: "10px",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>
      <br />
      <br />
      <br />
    </div>
  );
};

export default Visualizer;
