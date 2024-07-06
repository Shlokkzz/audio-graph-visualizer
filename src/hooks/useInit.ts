import React,{useState,useEffect} from "react";

export const useInit = ()=>{

  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [audioCtxOriginal, setAudioCtxOriginal] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [analyserOriginal, setAnalyserOriginal] = useState<AnalyserNode | null>(null);
  const [source, setSource] = useState<MediaStreamAudioSourceNode | null>(null);
  const [sourceOriginal, setSourceOriginal] = useState<MediaStreamAudioSourceNode | null>(null);

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

  return {audioCtx,audioCtxOriginal,source,sourceOriginal,analyser,analyserOriginal}
}