import { useRef, useEffect} from "react";

export const useVisualization = (visualizationType:("sinewave" | "frequencybars"),analyser:AnalyserNode) => {

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  return {canvasRef};

}