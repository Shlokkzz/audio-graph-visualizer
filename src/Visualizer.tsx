import React, { useRef, useEffect, useState, useCallback } from "react";
import { Chart, registerables } from "chart.js";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Node,
} from "reactflow";
// import "reactflow/dist/style.css";

import BiquadFilterNode2 from "./nodes/BiquadFilterNode";
import DynamicsCompressorNode2 from "./nodes/DynamicsCompressorNode";
import GainNode2 from "./nodes/GainNode";

interface BaseNodeData {
  id: string;
  label: string;
}

interface BiquadFilterNodeData extends BaseNodeData {
  type: "biquadFilter";
  audioNode: BiquadFilterNode;
  frequency: number;
  Q: number;
  filterType: BiquadFilterType;
}

interface DynamicsCompressorNodeData extends BaseNodeData {
  type: "dynamicsCompressor";
  audioNode: DynamicsCompressorNode;
  threshold: number;
  knee: number;
  attack: number;
  release: number;
  ratio: number;
}

interface GainNodeData extends BaseNodeData {
  type: "gain";
  audioNode: GainNode;
  gain: number;
}

type AudioNodeData =
  | BiquadFilterNodeData
  | DynamicsCompressorNodeData
  | GainNodeData;

interface CustomNode extends Node {
  data: AudioNodeData;
}
const nodeTypes = {
  biquadFilter: BiquadFilterNode2,
  dynamicsCompressor: DynamicsCompressorNode2,
  gain: GainNode2,
};

Chart.register(...registerables);

const Visualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRefOriginal = useRef<HTMLCanvasElement | null>(null);

  const canvasRefSnapshot = useRef<HTMLCanvasElement | null>(null);
  const canvasRefOriginalSnapshot = useRef<HTMLCanvasElement | null>(null);

  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [audioCtxOriginal, setAudioCtxOriginal] = useState<AudioContext | null>(
    null
  );
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [analyserOriginal, setAnalyserOriginal] = useState<AnalyserNode | null>(
    null
  );
  const [source, setSource] = useState<MediaStreamAudioSourceNode | null>(null);
  const [sourceOriginal, setSourceOriginal] =
    useState<MediaStreamAudioSourceNode | null>(null);

  const [visualizationType, setVisualizationType] = useState<
    "sinewave" | "frequencybars"
  >("sinewave");

  //Audio routing graph
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null);

  const [selectedValue, setSelectedValue] = useState<string>('self-configure');

  // INIT
  useEffect(() => {
    const initAudio = async () => {
      try {
        const audioContext = new AudioContext();
        const stream1 = await navigator.mediaDevices.getUserMedia({
          audio: {
            noiseSuppression: true,
            echoCancellation: true, // Optional: Enable echo cancellation
          },
        });
        const sourceNode = audioContext.createMediaStreamSource(stream1);
        const analyserNode = audioContext.createAnalyser();

        analyserNode.fftSize = 2048;
        analyserNode.minDecibels = -90;
        analyserNode.maxDecibels = -10;
        analyserNode.smoothingTimeConstant = 0.85;

        sourceNode.connect(analyserNode);

        analyserNode.connect(audioContext.destination);

        setAudioCtx(audioContext);
        setAnalyser(analyserNode);
        setSource(sourceNode);

        // original
        const audioContextOriginal = new AudioContext();
        const streamOriginal1 = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const sourceNodeOriginal =
          audioContextOriginal.createMediaStreamSource(streamOriginal1);

        const analyserNodeOriginal = audioContextOriginal.createAnalyser();

        analyserNodeOriginal.fftSize = 2048;
        analyserNodeOriginal.minDecibels = -90;
        analyserNodeOriginal.maxDecibels = -10;
        analyserNodeOriginal.smoothingTimeConstant = 0.85;

        sourceNodeOriginal.connect(analyserNodeOriginal);
        // analyserNodeOriginal.connect(audioContext.destination);

        setAudioCtxOriginal(audioContextOriginal);
        setAnalyserOriginal(analyserNodeOriginal);
        setSourceOriginal(sourceNodeOriginal);

        console.log("update");
      } catch (error) {
        console.error("Error initializing audio context:", error);
      }
    };

    initAudio();

    return () => {
      if (audioCtx) {
        audioCtx.close();
      }
      if (audioCtxOriginal) {
        audioCtxOriginal.close();
      }
      if (source) {
        source.disconnect();
      }
      if (sourceOriginal) {
        sourceOriginal.disconnect();
      }
    };
  }, []);




  
  // AUDIO ROUTING GRAPH FUNCTIONS
  const handleAddNode = (
    nodeType: "biquadFilter" | "dynamicsCompressor" | "gain"
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
    handleChanges();
  };

  const handleChanges = () => {
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

  const handleReset = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    handleChanges();
    // Optionally disconnect all audio nodes from the audio context
    // Implement as needed based on your audio node handling
    // removes filter
  };

  const onConnect = useCallback(
    (params: any) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { stroke: "#fff" } }, eds)
      ),
    []
  );

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    console.log(node);
    setSelectedNode(node);
  };



  // SNAPSHOTS AND DISPLAY
  // For processed graph
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d", { willReadFrequently: true });

    if (!canvasCtx) return;

    const intendedWidth = 1400; // Set the desired width here
    const intendedHeight = 800; // Set the desired height here

    canvas.setAttribute("width", intendedWidth.toString());
    canvas.setAttribute("height", intendedHeight.toString());

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    let animationId: number;

    const draw = (timestamp: number) => {
      if (!analyser || !canvasCtx) return;

      if (visualizationType === "sinewave") {
        analyser.fftSize = 4096;
        const bufferLength = analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);

        analyser.getByteTimeDomainData(dataArray);
        canvasCtx.fillStyle = "#dbfdf5";
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "rgb(0, 0, 0)";
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        canvasCtx.beginPath();
        const sliceWidth = (canvas.width * 1.0) / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;
          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
      } else if (visualizationType === "frequencybars") {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        canvasCtx.fillStyle = "white";
        canvasCtx.font = "12px Arial";
        canvasCtx.fillText("Frequency (Hz)", WIDTH / 2, HEIGHT - 10);
        const barWidth = (WIDTH / bufferLength) * 5;
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] * 6;
          canvasCtx.fillStyle = `rgb(${barHeight + 100},50,50)`;
          canvasCtx.fillRect(
            x,
            HEIGHT - barHeight / 2,
            barWidth,
            barHeight / 2
          );
          x += barWidth + 1;
        }
      }
      if (visualizationType === "frequencybars") {
        const step = 20; // Grid step size

        canvasCtx.strokeStyle = "#ddd";

        // Draw grid
        for (let x = 0; x <= WIDTH; x += step) {
          canvasCtx.beginPath();
          canvasCtx.moveTo(x, 0);
          canvasCtx.lineTo(x, HEIGHT);
          canvasCtx.stroke();
          // canvasCtx.fillText(x, x, 10);
        }
        for (let y = 0; y <= HEIGHT; y += step) {
          canvasCtx.beginPath();
          canvasCtx.moveTo(0, y);
          canvasCtx.lineTo(WIDTH, y);
          canvasCtx.stroke();
          // canvasCtx.fillText(y, 0, y + 10);
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animationId);
  }, [analyser, visualizationType]);

  // For original graph
  useEffect(() => {
    if (!canvasRefOriginal.current) return;

    const canvas = canvasRefOriginal.current;
    const canvasCtx = canvas.getContext("2d", { willReadFrequently: true });

    if (!canvasCtx) return;

    const intendedWidth = 1400; // Set the desired width here
    const intendedHeight = 800; // Set the desired height here

    canvas.setAttribute("width", intendedWidth.toString());
    canvas.setAttribute("height", intendedHeight.toString());

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    let animationId: number;

    const draw = (timestamp: number) => {
      if (!analyserOriginal || !canvasCtx) return;

      if (visualizationType === "sinewave") {
        analyserOriginal.fftSize = 4096;
        const bufferLength = analyserOriginal.fftSize;
        const dataArray = new Uint8Array(bufferLength);

        analyserOriginal.getByteTimeDomainData(dataArray);
        canvasCtx.fillStyle = "#dbfdf5";
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "rgb(0, 0, 0)";
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        canvasCtx.beginPath();
        const sliceWidth = (canvas.width * 1.0) / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;
          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
      } else if (visualizationType === "frequencybars") {
        const bufferLength = analyserOriginal.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserOriginal.getByteFrequencyData(dataArray);
        canvasCtx.fillStyle = "white";
        canvasCtx.font = "12px Arial";
        canvasCtx.fillText("Frequency (Hz)", WIDTH / 2, HEIGHT - 10);
        const barWidth = (WIDTH / bufferLength) * 5;
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] * 6;
          canvasCtx.fillStyle = `rgb(${barHeight + 100},50,50)`;
          canvasCtx.fillRect(
            x,
            HEIGHT - barHeight / 2,
            barWidth,
            barHeight / 2
          );
          x += barWidth + 1;
        }
      }

      if (visualizationType === "frequencybars") {
        const step = 20; // Grid step size

        canvasCtx.strokeStyle = "#ddd";

        // Draw grid
        for (let x = 0; x <= WIDTH; x += step) {
          canvasCtx.beginPath();
          canvasCtx.moveTo(x, 0);
          canvasCtx.lineTo(x, HEIGHT);
          canvasCtx.stroke();
          // canvasCtx.fillText(x, x, 10);
        }
        for (let y = 0; y <= HEIGHT; y += step) {
          canvasCtx.beginPath();
          canvasCtx.moveTo(0, y);
          canvasCtx.lineTo(WIDTH, y);
          canvasCtx.stroke();
          // canvasCtx.fillText(y, 0, y + 10);
        }
      }
      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animationId);
  }, [analyserOriginal, visualizationType]);

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
  const handleAddPresetData = (
    newNodeData: AudioNodeData[]
  ) => {
    let index = 1;
    const updatedEdges = [];
    for(let i=0;i<newNodeData.length;i++){

    
    const newNodeId = (index).toString();


    const newNode: CustomNode = {
      id: newNodeId,
      type: "default",
      data: newNodeData[i],
      position:
        nodes.length == 0
          ? { x: 250, y: 50 }
          : {
              x: 250+ 20*index,
              y: 50+ 20*index,
            }, // Adjust the position as needed
      style: {
        backgroundColor:
          newNodeData[i].type === "dynamicsCompressor"
            ? "#f4e2d8"
            : newNodeData[i].type === "gain"
            ? "#ddd6f3"
            : "ffedbc",
      },
    };
    updatedEdges.push(newNode);
    index++;
  }
    setNodes(updatedEdges);
    handleChanges();
  };

  const handlePreset = (event:React.ChangeEvent<HTMLSelectElement>): void=>{
      setSelectedValue(event.target.value);
      if(event.target.value==='Preset-1'){
        handleReset();
        const data:AudioNodeData[]=[
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
        ]
        handleAddPresetData(data);
      }
      else if(event.target.value==='Preset-2'){
        handleReset();
        const data:AudioNodeData[]=[
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
        ]
        handleAddPresetData(data);
        // Add more
      }
      else if(event.target.value==='Preset-3'){
        handleReset();
      }
      else if(event.target.value==='Preset-4'){
        handleReset();
      }
      else if(event.target.value==='Preset-5'){
        handleReset();
      }
      else{
        // self configure
        handleReset();
        handleChanges();
      }
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
              onClick={() => handleAddNode("biquadFilter")}
              style={buttonStyle(false)}
            >
              Add BiquadFilterNode
            </button>
            <br /> <br />
            <button
              onClick={() => handleAddNode("dynamicsCompressor")}
              style={buttonStyle(false)}
            >
              Add DynamicsCompressorNode
            </button>
            <br /> <br />
            <button
              onClick={() => handleAddNode("gain")}
              style={buttonStyle(false)}
            >
              Add Gain Node
            </button>
            <br />
            <br />
            <button onClick={handleReset} style={filterButton(true)}>
              RESET
            </button>
            <button onClick={handleChanges} style={buttonStyle(true)}>
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
                    handleChanges(); // Update your audio context
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
                    handleChanges(); // Update your audio context
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
                    handleChanges(); // Update your audio context
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
                      handleChanges(); // Update your audio context
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
                      handleChanges(); // Update your audio context
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
                      handleChanges(); // Update your audio context
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
                      handleChanges(); // Update your audio context
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
                      handleChanges(); // Update your audio context
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
                    handleChanges(); // Update your audio context
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
            <select style={filterButton(false)}  onChange={handlePreset} value= {selectedValue}>
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
