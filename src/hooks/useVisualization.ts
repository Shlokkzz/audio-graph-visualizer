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

        const barWidth = (WIDTH / bufferLength) * 5;
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] * 6;
          canvasCtx.fillStyle = `rgb(${barHeight + 100},50,50)`;
          canvasCtx.fillRect(
            x+40,
            HEIGHT -10- barHeight / 2  ,
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

        // Label the axes
        canvasCtx.fillStyle = 'black';
        canvasCtx.font = '16px Arial';
        canvasCtx.fillText("Frequency (Hz)", WIDTH / 2 - 50, HEIGHT -10);
        canvasCtx.save();
        canvasCtx.translate(10, HEIGHT / 2 + 50);
        canvasCtx.rotate(-Math.PI / 2);
        canvasCtx.fillText("Amplitude", 0, 10);
        canvasCtx.restore();


        // Draw y-axis (amplitude)
        canvasCtx.beginPath();
        canvasCtx.moveTo(1, 50);
        canvasCtx.lineTo(1, HEIGHT);
        canvasCtx.strokeStyle = 'black';
        canvasCtx.lineWidth = 1;
        canvasCtx.stroke();

        // Draw x-axis (frequency)
        canvasCtx.beginPath();
        canvasCtx.moveTo(1, HEIGHT );
        canvasCtx.lineTo(WIDTH , HEIGHT );
        canvasCtx.strokeStyle = 'black';
        canvasCtx.lineWidth = 1;
        canvasCtx.stroke();

        // Draw y-axis labels
        const maxAmplitude = 255; // Maximum amplitude value for the frequency data
        const yLabelCount = 10;
        for (let i = 0; i <= yLabelCount; i++) {
          const y = HEIGHT - 50 - (i * (HEIGHT - 100) / yLabelCount);
          const amplitude = (maxAmplitude / yLabelCount) * i;
          canvasCtx.fillStyle = 'black';
          canvasCtx.font = '12px Arial';
          canvasCtx.fillText(amplitude.toString(), 15, y + 30);
          canvasCtx.beginPath();
          canvasCtx.moveTo(5, y);
          canvasCtx.lineTo(25, y);
          canvasCtx.stroke();
        }

        // Draw x-axis labels
        const sampleRate = 20000;
        const frequencyBinCount = analyser.frequencyBinCount;
        const xLabelCount = 15;
        for (let i = 0; i <= xLabelCount; i++) {
          const x = 50 + (i * (WIDTH - 100) / xLabelCount);
          const frequency = (sampleRate / 2 / xLabelCount) * i;
          canvasCtx.fillStyle = 'black';
          canvasCtx.font = '12px Arial';
          canvasCtx.fillText(frequency.toFixed(0), x - 30, HEIGHT - 30);
          canvasCtx.beginPath();
          canvasCtx.moveTo(x, HEIGHT - 5);
          canvasCtx.lineTo(x, HEIGHT - 25);
          canvasCtx.stroke();
        }
      }
        animationId = requestAnimationFrame(draw);
      };
      animationId = requestAnimationFrame(draw);
      
      return () => cancelAnimationFrame(animationId);
    }, [analyser, visualizationType]);

  return {canvasRef};

}